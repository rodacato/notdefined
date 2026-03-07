---
title: "Hotwire en 2026: ¿el sueño Rails sin JS sigue vivo?"
description: "Evaluación honesta después de construir features reales con Turbo y Stimulus. Dónde Hotwire genuinamente brilla, dónde empieza a pelearse contigo, y cuándo el tradeoff vale la pena vs 'solo usa React'."
pubDate: 2026-02-10
tags: ["ruby", "rails", "frontend", "hotwire"]
draft: false
---

## TL;DR

- Hotwire **brilla en**: forms con validación en tiempo real, live updates via Turbo Streams, modales/drawers, navigation sin page reload
- **Empieza a pelearse contigo** en: estado complejo del cliente, optimistic UI, interacciones mobile complejas, features que dependen de librerías JS de terceros
- El **modelo mental correcto**: Hotwire no es "Rails sin JavaScript" — es JavaScript mínimo donde el servidor mantiene el estado
- Para la mayoría de las features de un SaaS B2B, **Hotwire es suficiente y más simple de operar**
- El punto de quiebre hacia React: cuando tienes más de 3-4 interacciones UI que dependen unas de otras en el cliente

---

## Qué es Hotwire realmente (y qué no es)

Antes de evaluar si funciona, hay que tener claro qué es — porque hay mucho marketing mezclado con la documentación. "Rails sin JavaScript" suena bien en Twitter pero es impreciso. Hotwire es JavaScript. Solo que es el JavaScript que ya viene incluido, no el que tú escribes. La diferencia importa. Hotwire son tres cosas:

**Turbo Drive**: intercepta clicks en links y submissions de forms — en lugar de recargar la página completa, hace fetch y reemplaza el `<body>`. Navigation sin full page reload, sin escribir JavaScript.

**Turbo Frames**: secciones de la página que se pueden actualizar independientemente. Haces click en un link dentro de un frame, y solo ese frame se actualiza — el resto de la página no se toca.

**Turbo Streams**: el servidor puede enviar actualizaciones de HTML via WebSocket (Action Cable) o como respuesta a un form. Puedes append, prepend, replace, remove elementos del DOM desde el servidor.

**Stimulus**: un framework JS minimalista para agregar comportamiento a HTML existente. No maneja estado — el estado vive en el servidor.

La promesa: puedes construir apps interactivas sin un framework JS frontend completo. El servidor genera HTML, Turbo lo aplica inteligentemente, Stimulus agrega interactividad simple.

## Donde genuinamente brilla

### Forms con validación en tiempo real

```ruby
# app/controllers/users_controller.rb
def create
  @user = User.new(user_params)

  respond_to do |format|
    if @user.save
      format.html { redirect_to @user, notice: 'Usuario creado' }
      format.turbo_stream { redirect_to @user }
    else
      format.html { render :new, status: :unprocessable_entity }
      format.turbo_stream { render :new, status: :unprocessable_entity }
    end
  end
end
```

```erb
<%# El form ya funciona con validación inline sin JS adicional %>
<%= form_with model: @user do |f| %>
  <div>
    <%= f.label :email %>
    <%= f.email_field :email %>
    <% if @user.errors[:email].any? %>
      <span class="error"><%= @user.errors[:email].first %></span>
    <% end %>
  </div>
  <%= f.submit %>
<% end %>
```

Submit con error → el servidor devuelve el form con errores → Turbo reemplaza el form → el usuario ve los errores. Cero JavaScript personalizado.

### Live updates con Turbo Streams

```ruby
# app/models/message.rb
class Message < ApplicationRecord
  belongs_to :chat_room
  after_create_commit -> {
    broadcast_append_to chat_room,
      target: 'messages',
      partial: 'messages/message',
      locals: { message: self }
  }
end
```

```erb
<%# app/views/chat_rooms/show.html.erb %>
<%= turbo_stream_from @chat_room %>

<div id="messages">
  <%= render @chat_room.messages %>
</div>
```

Nuevo mensaje → callback en el modelo → broadcast via Action Cable → Turbo appends el HTML al `#messages` en todos los clientes conectados. Un chat en tiempo real en ~20 líneas.

### Modales y drawers

```erb
<%# Link que abre un modal dentro de un Turbo Frame %>
<%= link_to 'Editar usuario', edit_user_path(@user),
    data: { turbo_frame: 'modal' } %>

<%# El frame modal — vacío por defecto %>
<turbo-frame id="modal"></turbo-frame>

<%# app/views/users/edit.html.erb — se renderiza dentro del frame %>
<turbo-frame id="modal">
  <div class="modal">
    <%= render 'form', user: @user %>
    <%= link_to 'Cancelar', '#', data: { action: 'click->modal#close' } %>
  </div>
</turbo-frame>
```

Click en "Editar usuario" → Turbo hace fetch del edit view → solo el contenido del frame `modal` reemplaza el frame vacío → el modal aparece. Sin JavaScript custom para abrir/cerrar.

## Donde empieza a pelearse contigo

### Estado complejo del cliente

Imagina un formulario multi-step donde el paso 3 depende de lo que el usuario eligió en el paso 1 y 2, y algunas secciones se muestran/ocultan condicionalmente según múltiples campos:

```javascript
// En React esto es straightforward
const [step, setStep] = useState(1);
const [selections, setSelections] = useState({});

// Cada interacción actualiza el estado local
// La UI reacciona automáticamente
```

Con Hotwire, tienes que hacer un server roundtrip por cada cambio relevante, o usar Stimulus para manejar el estado en el cliente. Stimulus no está diseñado para esto — se vuelve verbose rápidamente:

```javascript
// Stimulus controller para manejar estado del form multi-step
// Se pone feo rápido
import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static targets = ['step1', 'step2', 'step3', 'categoryField', 'subcategoryField'];
  static values = { step: Number, category: String };

  // 50+ líneas para algo que React haría en 10
}
```

### Optimistic UI

Cuando haces click en "Me gusta" y quieres que el contador suba inmediatamente sin esperar al servidor:

```javascript
// React — trivial
const [liked, setLiked] = useState(false);
const [count, setCount] = useState(post.likes_count);

const handleLike = async () => {
  setLiked(true);  // inmediato, optimistic
  setCount(c => c + 1);
  try {
    await api.likePost(post.id);
  } catch {
    setLiked(false);  // rollback si falla
    setCount(c => c - 1);
  }
};
```

Con Hotwire, el optimistic UI requiere Stimulus custom + manejo de rollback manual. No es imposible, pero es más código del que debería ser para algo tan básico.

### Librerías JS de terceros

Si necesitas integrar un date picker complejo, un editor rich text (Tiptap, Quill), un drag & drop sofisticado, o charts interactivos — todas esas librerías están diseñadas para React/Vue. Puedes usarlas con Stimulus, pero la integración requiere más trabajo y puede ser frágil si la librería asume un modelo de estado reactivo.

## Hotwire vs React: el árbol de decisión real

```
¿Tu app tiene features que requieren...?

Estado complejo del cliente (múltiples campos que dependen entre sí) → React
Optimistic UI que sea crítica para el UX → React
Librerías JS que asumen framework reactivo → React
Offline support / PWA → React
App tipo dashboard con muchos widgets interactivos → React

Para todo lo demás:

¿Necesitas live updates en tiempo real? → Turbo Streams + Action Cable
¿Tienes forms con validación server-side? → Turbo Drive, funciona solo
¿Necesitas partes de la página que se actualicen independientemente? → Turbo Frames
¿Algo de comportamiento JS que no involucra estado complejo? → Stimulus
```

## La comparación honesta para un SaaS B2B típico

Para un SaaS con features como: tabla de datos con filtros, formularios CRUD, notificaciones en tiempo real, modales de edición, dashboard con métricas — Hotwire es suficiente en el 80-90% de los casos.

| Feature | Hotwire | React/Next.js |
|---------|---------|---------------|
| CRUD con forms | Excelente | Más boilerplate |
| Live updates simples | Excelente | Requiere WebSocket setup |
| Modales/drawers | Muy bueno | Simple |
| Búsqueda con filtros | Bueno (con Turbo Frames) | Más interactivo |
| Estado complejo UI | Difícil | Natural |
| Optimistic UI | Tedioso | Trivial |
| SEO | Excelente (HTML del server) | Requiere SSR |
| Time to first contentful paint | Muy bueno | Variable |
| Bundle size | Mínimo (~30KB) | Variable (200KB+) |
| Deploys | Simple | Puede ser complejo |

La ventaja operacional de Hotwire es real: no tienes build pipeline de frontend que mantener, no tienes dos bases de código (Rails API + React SPA), no tienes que sincronizar tipos entre backend y frontend. Un solo equipo puede mantener todo.

## Mi veredicto en 2026

Hotwire sigue siendo mi default para proyectos nuevos donde el equipo es pequeño y la app no tiene requerimientos de UX extremadamente interactivos. La productividad inicial es mejor, el mantenimiento es más simple, y la mayoría de las features de negocio que construyo no necesitan React.

El punto de quiebre hacia React: cuando tengo más de 3-4 interacciones que dependen del estado del cliente entre sí, o cuando el diseñador empieza a pedir cosas que claramente están diseñadas pensando en React. En ese punto, la fricción de forzar Hotwire supera el costo de agregar React.

Pero ese punto llega menos seguido de lo que la comunidad React haría creer. Y lo sé porque he caído en la trampa de "esto necesita React" para features que terminaron siendo 40 líneas de Turbo Stream.

---

El sueño Rails sin JS no está muerto. Está madurando — y en 2026 la pregunta ya no es "¿Hotwire o React?" sino "¿en qué punto de la app tiene sentido cada uno?". Hotwire no es una bala de plata — es la herramienta correcta para la mayoría de las apps web de negocio, mal vendida como la solución para todas. Úsala donde funciona, cede donde no, y ahórrate el drama del bundle size en el 90% de los proyectos.
