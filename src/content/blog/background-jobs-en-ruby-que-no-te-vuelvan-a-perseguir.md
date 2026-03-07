---
title: "Background jobs en Ruby que no te vuelvan a perseguir"
description: "Todos saben usar Sidekiq básico. Lo que nadie te enseña: idempotencia, manejo de errores que no sea retry ciego, timeouts, cómo testear sin mockear todo, y patrones para jobs que llaman APIs externas."
pubDate: 2025-11-11
tags: ["ruby", "rails", "backend"]
draft: false
---

## TL;DR

- **Idempotencia**: tu job debe poder correr dos veces sin efectos duplicados — diseña para eso desde el inicio
- **Retries con backoff exponencial**, no retries ciegos — y define explícitamente qué errores merecen retry
- **Timeouts**: un job sin timeout puede bloquear workers indefinidamente
- **Dead queue**: los jobs que fallaron N veces necesitan revisión manual, no desaparecer silenciosamente
- **Testing**: usa `perform_now` en tests con datos reales, no mocks de todo

---

## El problema que nadie anticipa: idempotencia

Un job puede correr más de una vez. Sidekiq puede reintentar por un error de red, tu proceso puede morir a la mitad, alguien puede reencolar manualmente desde la UI, un deploy mal timed puede matar workers a la mitad de un perform. Si tu job no es idempotente, tienes un bug esperando su momento — y cuando llegue, probablemente será un cargo duplicado a un cliente.

```ruby
# MAL — no es idempotente
class ChargeSubscriptionJob < ApplicationJob
  def perform(user_id)
    user = User.find(user_id)
    amount = user.subscription.monthly_amount

    # Si esto se corre dos veces: dos cargos
    Stripe::Charge.create(
      amount: amount,
      currency: 'usd',
      customer: user.stripe_customer_id,
    )

    user.subscription.update!(last_charged_at: Time.current)
  end
end

# BIEN — idempotente con idempotency key
class ChargeSubscriptionJob < ApplicationJob
  def perform(user_id, billing_period)
    user = User.find(user_id)

    # Verifica si ya se cobró este período
    return if user.subscription.charged_for_period?(billing_period)

    # Stripe acepta idempotency keys — mismo key = mismo resultado, no duplicado
    idempotency_key = "charge-#{user_id}-#{billing_period}"

    charge = Stripe::Charge.create(
      { amount: user.subscription.monthly_amount, currency: 'usd',
        customer: user.stripe_customer_id },
      { idempotency_key: idempotency_key }
    )

    user.subscription.record_charge!(billing_period, charge.id)
  end
end
```

La regla de oro: **si no puedes correr el job dos veces de forma segura, no lo hagas async todavía** — primero hazlo idempotente.

## Manejo de errores que no sea retry ciego

El comportamiento default de Sidekiq: 25 retries con backoff exponencial. Para la mayoría de los errores temporales (timeout de red, DB momentáneamente no disponible), está perfecto. Para otros errores, no tanto.

```ruby
class SyncInventoryJob < ApplicationJob
  # Errores que merecen retry (problemas temporales)
  retry_on Faraday::TimeoutError, wait: :exponentially_longer, attempts: 5
  retry_on ActiveRecord::Deadlocked, wait: 5.seconds, attempts: 3

  # Errores que NO merecen retry (problemas de datos/lógica)
  discard_on ActiveRecord::RecordNotFound  # el registro se borró — no hay nada que hacer
  discard_on InventoryService::ProductDiscontinued

  # Errores que necesitan atención manual
  retry_on InventoryService::APIError, attempts: 3 do |job, error|
    # Después de 3 intentos, notifica pero no silencies
    Honeybadger.notify(error, context: { job_id: job.job_id })
  end

  def perform(product_id)
    product = Product.find(product_id)  # lanza RecordNotFound si fue borrado
    InventoryService.sync(product)
  end
end
```

La distinción importante: `retry_on` para errores transitorios (red, locks), `discard_on` para errores de datos donde reintentar no va a cambiar nada.

## Timeouts: lo que falta en casi todos los jobs

Un job sin timeout puede colgar un worker thread indefinidamente — y si tienes 10 workers y 10 jobs colgados, tu queue se para:

```ruby
class ExportReportJob < ApplicationJob
  # Timeout a nivel de job
  def perform(report_id)
    Timeout.timeout(5.minutes) do
      report = Report.find(report_id)
      data = ReportGenerator.generate(report)
      report.update!(file_url: upload(data), status: 'completed')
    end
  rescue Timeout::Error
    Report.find(report_id).update!(status: 'failed', error: 'Timeout after 5 minutes')
    raise  # re-raise para que Sidekiq lo registre como fallo
  end
end
```

Para Sidekiq específicamente, también puedes configurar timeout a nivel de worker:

```yaml
# config/sidekiq.yml
:timeout: 300  # 5 minutos — después de esto, Sidekiq mata el worker
```

Pero `Timeout.timeout` en el job es más granular y te permite hacer cleanup antes de morir.

## La dead queue no es opcional

Por defecto en Sidekiq, después de 25 retries el job va a la dead queue y se queda ahí por 6 meses antes de borrarse. Eso es bueno — pero necesitas monitoring:

```ruby
# config/initializers/sidekiq.rb
Sidekiq.configure_server do |config|
  config.death_handlers << lambda do |job, exception|
    # Alerta cuando un job va a la dead queue
    Honeybadger.notify(
      "Job died permanently",
      context: {
        job_class: job['class'],
        job_args: job['args'],
        error: exception.message,
        jid: job['jid'],
      }
    )

    # O notifica en Slack si prefieres
    SlackNotifier.alert(
      channel: '#alerts',
      message: "💀 Job #{job['class']} murió después de #{job['retry_count']} intentos: #{exception.message}"
    )
  end
end
```

Sin esto, los jobs que fallaron definitivamente desaparecen en silencio y nunca te enteras.

## Unique jobs: cuando el mismo job no debe correr dos veces en paralelo

Si un usuario puede triggear el mismo job múltiples veces rápidamente (doble click, múltiples requests concurrentes):

```ruby
# Con sidekiq-unique-jobs gem
class GenerateInvoiceJob < ApplicationJob
  sidekiq_options lock: :until_executed,
                  lock_args_method: ->(args) { [args.first] },  # unique por user_id
                  lock_ttl: 10.minutes

  def perform(user_id, month)
    InvoiceGenerator.for_user(user_id, month)
  end
end

# Con SolidQueue (Rails 8) — usando concurrency controls
class GenerateInvoiceJob < ApplicationJob
  limits_concurrency to: 1, key: ->(user_id, _month) { user_id }

  def perform(user_id, month)
    InvoiceGenerator.for_user(user_id, month)
  end
end
```

## Testing: usa perform_now con datos reales

El error más común al testear jobs:

```ruby
# MAL — mocks de todo, no prueba nada real
RSpec.describe SendWelcomeEmailJob do
  it 'sends welcome email' do
    user = double('User', email: 'alice@example.com', name: 'Alice')
    mailer = double('Mailer')

    allow(UserMailer).to receive(:welcome).with(user).and_return(mailer)
    allow(mailer).to receive(:deliver_now)

    SendWelcomeEmailJob.perform_now(1)

    expect(mailer).to have_received(:deliver_now)
  end
end

# BIEN — prueba el comportamiento real
RSpec.describe SendWelcomeEmailJob do
  it 'sends welcome email to user' do
    user = create(:user, email: 'alice@example.com')

    expect {
      SendWelcomeEmailJob.perform_now(user.id)
    }.to have_enqueued_mail(UserMailer, :welcome).with(user)
    # O si el mailer usa deliver_now:
    # }.to change { ActionMailer::Base.deliveries.count }.by(1)
  end

  it 'does nothing if user does not exist' do
    # Con discard_on ActiveRecord::RecordNotFound, esto no debe explotar
    expect {
      SendWelcomeEmailJob.perform_now(999_999)
    }.not_to raise_error
  end
end
```

`perform_now` en tests es sincrónico — no encola, ejecuta directamente. Usa datos reales (factories) en lugar de mocks para que el test pruebe el camino completo.

## Patrón para jobs que llaman APIs externas

```ruby
class SyncContactJob < ApplicationJob
  retry_on CRM::RateLimitError, wait: :exponentially_longer, attempts: 8
  retry_on CRM::TemporaryError, wait: 30.seconds, attempts: 3
  discard_on CRM::ContactNotFoundError
  discard_on ActiveRecord::RecordNotFound

  def perform(contact_id)
    contact = Contact.find(contact_id)

    # Evita sincronizar si ya se hizo recientemente (idempotencia + eficiencia)
    return if contact.synced_recently?

    result = CRM::Client.sync_contact(
      id: contact.external_id,
      name: contact.full_name,
      email: contact.email,
    )

    contact.update!(
      crm_synced_at: Time.current,
      crm_version: result.version,
    )
  end
end
```

El patrón: siempre relee los datos del DB al inicio del job (no confíes en datos serializados del momento del enqueue — pueden estar stale), maneja explícitamente los tipos de error del API externo, y registra el resultado para idempotencia.

---

Los background jobs son una de esas cosas donde el 80% del valor está en los detalles: idempotencia, timeouts, error handling específico, y saber qué jobs están en la dead queue. `perform_later` es trivial. Hacer que esos jobs sean confiables en producción — que no cobren dos veces, que no queden colgados, que alguien se entere cuando fallan definitivamente — eso es lo que toma tiempo.

Diseña tus jobs como si fueran a correr dos veces. Porque en algún momento lo harán.
