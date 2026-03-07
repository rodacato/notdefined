---
title: "Service objects en Rails: cuándo ayudan y cuándo son solo indirection"
description: "La comunidad Rails lleva una década debatiendo sobre service objects y los dos lados tienen razón a veces. Qué problema resuelven realmente, las diferentes formas de implementarlos, y cuándo un módulo simple es suficiente."
pubDate: 2025-11-25
tags: ["ruby", "rails", "architecture"]
draft: false
---

## TL;DR

- Los service objects resuelven **fat models** y **controladores con lógica de negocio** — ese es el problema real
- Hay múltiples formas: **callable objects** (`call`), **command pattern**, **interactors** con resultado — elige según la complejidad
- Un **módulo con un método** a veces es suficiente — no todo necesita ser una clase
- El anti-patrón: un laberinto de clases `CreateUserService`, `UpdateUserService`, `DeleteUserService` donde cada una tiene un solo método y no hay cohesión
- La pregunta clave: **¿se puede testear en aislamiento?** Si sí, el service object está haciendo su trabajo

---

La comunidad Rails lleva una década peleando sobre service objects y ambos bandos tienen razón a veces. El bando pro: "los modelos se ponen gordos y los controllers mezclan lógica de negocio". El bando anti: "ahora tengo 60 clases `*Service` de una sola línea que nadie puede navegar". Ambos han visto código de prod que les da la razón.

Aquí mi take después de 10 años: la herramienta no es el problema. El problema es no saber cuándo usarla.

## El problema que service objects resuelven

Fat model:

```ruby
class Order < ApplicationRecord
  belongs_to :user
  has_many :items

  # La lógica de negocio está mezclada con ActiveRecord
  def checkout(payment_params)
    validate_items_in_stock!

    charge = Stripe::Charge.create(
      amount: total_in_cents,
      currency: 'usd',
      source: payment_params[:token],
      customer: user.stripe_customer_id,
    )

    update!(status: :paid, stripe_charge_id: charge.id)
    items.each { |item| item.product.decrement!(:stock, item.quantity) }
    OrderMailer.confirmation(self).deliver_later
    LoyaltyProgram.award_points(user, total)

    charge
  rescue Stripe::CardError => e
    update!(status: :failed)
    raise
  end
end
```

El modelo `Order` ahora sabe de Stripe, de inventario, de emails, y de loyalty points. Testear esto requiere stubear todo. Agregar una nueva acción al checkout requiere entender todo el método.

El service object extrae esa lógica:

```ruby
# El modelo queda limpio
class Order < ApplicationRecord
  belongs_to :user
  has_many :items

  def total_in_cents
    items.sum { |item| item.quantity * item.unit_price_cents }
  end

  def validate_items_in_stock!
    items.each do |item|
      raise InsufficientStock unless item.product.stock >= item.quantity
    end
  end
end

# La lógica de negocio vive en el service
class OrderCheckoutService
  def initialize(order, payment_params)
    @order = order
    @payment_params = payment_params
  end

  def call
    @order.validate_items_in_stock!
    charge = process_payment
    complete_order(charge)
    send_notifications
    charge
  end

  private

  def process_payment
    Stripe::Charge.create(
      amount: @order.total_in_cents,
      currency: 'usd',
      source: @payment_params[:token],
      customer: @order.user.stripe_customer_id,
    )
  rescue Stripe::CardError
    @order.update!(status: :failed)
    raise
  end

  def complete_order(charge)
    @order.update!(status: :paid, stripe_charge_id: charge.id)
    @order.items.each { |item| item.product.decrement!(:stock, item.quantity) }
  end

  def send_notifications
    OrderMailer.confirmation(@order).deliver_later
    LoyaltyProgram.award_points(@order.user, @order.total)
  end
end
```

```ruby
# El controller queda limpio
class OrdersController < ApplicationController
  def checkout
    result = OrderCheckoutService.new(@order, payment_params).call
    redirect_to order_path(@order), notice: 'Pago procesado'
  rescue Stripe::CardError => e
    redirect_to cart_path, alert: "Error de pago: #{e.message}"
  rescue InsufficientStock
    redirect_to cart_path, alert: 'Algunos productos están agotados'
  end
end
```

## Las formas de implementarlo

### Callable object — el más simple

```ruby
class UserRegistrationService
  def self.call(params)
    new(params).call
  end

  def initialize(params)
    @params = params
  end

  def call
    user = User.create!(@params)
    WelcomeMailer.send_welcome(user).deliver_later
    user
  end
end

# Uso
UserRegistrationService.call(user_params)
```

El método de clase `call` como delegador es una convención popular — te permite llamar `UserRegistrationService.(params)` usando la sintaxis de callable de Ruby.

### Con resultado explícito — para manejar éxito/fallo

```ruby
class OrderCheckoutService
  Result = Struct.new(:success?, :order, :error, keyword_init: true)

  def call
    @order.validate_items_in_stock!
    charge = process_payment
    complete_order(charge)

    Result.new(success?: true, order: @order)
  rescue Stripe::CardError => e
    Result.new(success?: false, order: @order, error: e.message)
  rescue InsufficientStock => e
    Result.new(success?: false, order: @order, error: e.message)
  end
end

# En el controller — más explícito que rescuear excepciones
result = OrderCheckoutService.new(@order, payment_params).call

if result.success?
  redirect_to order_path(result.order)
else
  flash[:alert] = result.error
  render :checkout
end
```

Este patrón de resultado explícito es útil cuando quieres que el controller maneje múltiples tipos de fallo sin rescuear excepciones.

### Interactors (la gema)

```ruby
# Gemfile
gem 'interactor'

class CheckoutOrder
  include Interactor

  def call
    order = context.order

    charge_card
    update_inventory
    send_confirmation

    context.receipt = generate_receipt
  rescue Stripe::CardError => e
    context.fail!(message: "Pago rechazado: #{e.message}")
  end

  private

  def charge_card
    context.charge = Stripe::Charge.create(...)
  end
end

# Organizar en cadenas
class PlaceOrder
  include Interactor::Organizer
  organize CheckoutOrder, UpdateInventory, SendConfirmationEmail
  # Si alguno falla, los anteriores hacen rollback
end

result = PlaceOrder.call(order: @order, payment_params: payment_params)
result.success?  # => true/false
result.message   # => mensaje de error si falló
```

Interactor es útil cuando tienes flujos complejos con múltiples pasos y necesitas rollback si alguno falla. Para flujos simples, es overhead.

## Cuándo un módulo es suficiente

No todo necesita una clase. Si la "lógica de negocio" es una función pura sin estado:

```ruby
# MAL — service object innecesario para algo sin estado
class PriceCalculatorService
  def initialize(items, discount_code)
    @items = items
    @discount_code = discount_code
  end

  def call
    subtotal = @items.sum(&:price)
    discount = DiscountCode.find_by(code: @discount_code)&.percentage || 0
    subtotal * (1 - discount / 100.0)
  end
end

# BIEN — módulo con método, sin estado
module PriceCalculator
  def self.calculate(items, discount_code: nil)
    subtotal = items.sum(&:price)
    discount = DiscountCode.find_by(code: discount_code)&.percentage || 0
    subtotal * (1 - discount / 100.0)
  end
end

PriceCalculator.calculate(@order.items, discount_code: params[:code])
```

La distinción: si el "service" no tiene estado (no guarda variables de instancia entre llamadas), probablemente es un módulo.

## El anti-patrón: service objects como indirection vacía

```ruby
# Esto no ayuda a nadie
class CreateUserService
  def initialize(params)
    @params = params
  end

  def call
    User.create!(@params)  # ← esto es todo, sin lógica adicional
  end
end

# Si esto es todo lo que hace, escríbelo directo en el controller
User.create!(user_params)
```

Un service object que es solo un wrapper de una sola operación de ActiveRecord no agrega valor — agrega una capa de indirection que alguien tiene que navegar cuando lee el código. El código "limpio" que hace más difícil seguir el flujo no es más limpio.

La pregunta para decidir: **¿este service object tiene lógica de negocio real, o solo está llamando a otro método?** Si es lo segundo, no lo necesitas.

## Testing: donde los service objects muestran su valor

```ruby
RSpec.describe OrderCheckoutService do
  describe '#call' do
    let(:user) { create(:user, :with_stripe_customer) }
    let(:order) { create(:order, :with_items, user: user) }

    before do
      stub_stripe_charge(amount: order.total_in_cents)
    end

    it 'marks order as paid' do
      described_class.new(order, token: 'tok_visa').call
      expect(order.reload.status).to eq('paid')
    end

    it 'decrements product stock' do
      product = order.items.first.product
      expect {
        described_class.new(order, token: 'tok_visa').call
      }.to change { product.reload.stock }.by(-order.items.first.quantity)
    end

    it 'enqueues confirmation email' do
      expect {
        described_class.new(order, token: 'tok_visa').call
      }.to have_enqueued_mail(OrderMailer, :confirmation)
    end

    context 'when card is declined' do
      before { stub_stripe_charge_failure }

      it 'marks order as failed' do
        expect { described_class.new(order, token: 'tok_fail').call }.to raise_error(Stripe::CardError)
        expect(order.reload.status).to eq('failed')
      end
    end
  end
end
```

El test del service object no necesita saber nada del controller. Prueba la lógica de negocio de forma aislada. Eso es el valor real.

---

Los service objects son una herramienta, no una religión ni una señal de madurez arquitectónica. Úsalos cuando tienes lógica de negocio compleja que mezcla múltiples responsabilidades y necesitas testarla en aislamiento. Evítalos cuando son solo wrappers de una operación simple.

Y si tu app tiene 50 clases `*Service` de 5 líneas cada una que nadie puede navegar — no ganaste arquitectura limpia, ganaste indirection sin beneficio. El código "limpio" que hace más difícil seguir el flujo no es más limpio.
