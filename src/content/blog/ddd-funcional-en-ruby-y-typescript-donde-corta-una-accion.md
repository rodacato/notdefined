---
title: "DDD funcional en Ruby y TypeScript: dónde corta una acción"
description: "En la parte 2 dejé una lista de lo que la IA no decide por ti. Esta parte es cómo lo decido yo: cada acción como qué ocupa, qué hace y qué espera. Código real de stockerly (Rails) y drawhaus (TypeScript), un use case que pasó de monads a tres líneas, y una batalla que decidí no dar."
pubDate: 2026-09-26
tags: ["ddd", "architecture", "ruby", "typescript", "functional"]
draft: false
series: "DDD funcional"
seriesOrder: 3
---

## TL;DR

- Lo que me hizo click de DDD fue **la acción**: qué ocupa, qué hace y qué espera. Value objects, entities y aggregates son detalles que decido después
- El mismo modelo mental me funciona en **Ruby** (stockerly, Rails + dry-rb) y en **TypeScript** (drawhaus). No depende del lenguaje
- Una acción se separa **cuando cambia lo que espera**, no cuando se repite un paso. Cortar pensando en reuso fue mi error más común
- Un booleano no necesita monads. Tuve un `ToggleRule` con `Success`/`Failure` casi tres meses
- En stockerly **no di la batalla de las entidades**: 35 de 83 acciones mutan ActiveRecord directo. Y la acción aguanta

---

En la [parte 2](/blog/ddd-funcional-y-la-ia-el-combo-que-no-vi-venir) dejé una lista de lo que la IA no decide por ti: nombrar, entity vs value object, dónde corta una acción y cuándo no aplicar la disciplina. La dejé ahí, como tarea del humano, y nunca dije cómo la resuelvo yo.

Esta parte es eso. Y con una diferencia: las dos primeras partes fueron puro Ruby con dry-rb. Esta vez hay TypeScript también.

## La acción como checklist

DDD es mucho de interpretación, a mi forma de verlo. El concepto que a mí me ayudó a entenderlo fue el de una **acción**: qué significa y qué hace de principio a fin, en palabras, como una lista de pasos.

No lo escribo en ningún lado. Es mental. Pero siempre tiene la misma forma: qué ocupo, qué espero, y en medio qué tengo que hacer. "Espero" como expectativa: espero que pase X porque hice Y. Lo demás son detalles de implementación que se deciden después.

Así se ve en Ruby. En stockerly el código les dice use cases; yo les digo acciones. Esta registra una compra o venta en [stockerly](https://github.com/rodacato/stockerly), mi app de portafolio:

```ruby
class ExecuteTrade < ApplicationUseCase
  def call(user:, params:)
    attrs = yield validate(Trading::Contracts::ExecuteTradeContract, params)
    portfolio = user.portfolio
    return Failure([ :not_found, "Portfolio not found" ]) unless portfolio

    asset = Asset.find_by!(symbol: attrs[:asset_symbol].upcase)
    trade_currency = attrs[:currency] || asset.currency
    fx_rate = yield capture_fx(trade_currency, attrs)
    return Failure([ :missing_fx_rate, trade_currency ]) if unpriceable?(trade_currency, asset, fx_rate)

    position = find_or_create_position(portfolio, asset, attrs)
    return Failure([ :insufficient_shares, "Not enough shares to sell" ]) if sell_exceeds_position?(attrs, position)

    trade = persist_trade(portfolio, asset, position, attrs, trade_currency, fx_rate)
    update_position_after_trade(position, attrs)

    publish(Events::TradeExecuted.new(...))

    Success(trade)
  end
end
```

Léelo de arriba a abajo y es la checklist: validar, encontrar el portafolio, el activo, el tipo de cambio, la posición; guardar, actualizar, avisar. Ocupa un usuario y unos params. Quien la llama espera que el trade quede registrado y la posición al día, o saber por qué no.

Ahora TypeScript. En [drawhaus](https://github.com/rodacato/drawhaus) (una app de diagramas) transferir diagramas a otro dueño:

```typescript
export class TransferDiagramOwnershipUseCase {
  constructor(
    private readonly diagrams: DiagramRepository,
    private readonly workspaces: WorkspaceRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(diagramIds: string[], actorId: string, newOwnerId: string) {
    if (newOwnerId === actorId) throw new ForbiddenError();

    for (const id of diagramIds) {
      const diagram = await this.diagrams.findById(id);
      if (!diagram) throw new NotFoundError("Diagram");
      if (diagram.ownerId !== actorId) throw new ForbiddenError();

      if (diagram.workspaceId) {
        const role = await this.workspaces.findMemberRole(diagram.workspaceId, newOwnerId);
        if (!role) throw new ForbiddenError();
      }
    }

    await this.diagrams.transferBulkOwnership(diagramIds, newOwnerId);

    this.audit.log({
      actor: actorId,
      action: "diagram.transfer_ownership",
      target: newOwnerId,
      meta: { diagramIds },
    });
  }
}
```

Misma forma. No te lo puedes pasar a ti mismo; por cada diagrama revisa que exista y que sea tuyo, y si vive en un workspace, que el nuevo dueño sea miembro. Transferir. Dejar rastro.

Cambia el cómo: el de drawhaus falla con excepciones y el de stockerly regresa `Failure`; en drawhaus los repositorios llegan inyectados en el constructor, en stockerly la acción llama a ActiveRecord directo. La checklist es la misma.

### Lo que sí cambia entre los dos

| | Ruby | JavaScript / TypeScript |
|---|---|---|
| El ecosistema te empuja | Hacia Rails. Sus convenciones se metieron hasta en las gemas | A nada. Arquitectura libre, tú decides |
| Qué es "un modelo" | Un `ApplicationRecord`, por default | Lo que tú definas |

En Ruby el trabajo fue desaprender lo que Rails me enseñó que era un modelo. Por eso la acción me sirve en los dos: no depende de qué te regala el lenguaje.

## Dónde corta una acción

Esta es la pregunta de la parte 2 que más me costó, y la contesto con lo que me pasa cuando cambio código: **normalmente no cambia qué hace ni qué espera, solo cómo se hace**. Si cambio de proveedor de tipo de cambio en `ExecuteTrade`, la checklist es la misma. Cambió un paso por dentro.

Cuando lo que cambia es lo que espera, ahí hay otra cosa. A veces es un flujo nuevo que grita ser independiente. Otras, la complejidad misma de querer forzarlo te grita "voy en otro lugar".

La parte 2 dejó colgado un ejemplo: ¿`RenewSubscription` manda el email de renovación, o eso lo hace un subscriber de `SubscriptionRenewed`? Con la regla sale. Quien renueva espera que la suscripción quede renovada: el cobro hecho y la fecha nueva. El email lo espera alguien más, el usuario. La prueba, que en el fondo es consistencia transaccional: si el email falla, ¿se debería deshacer la renovación? No. Entonces no es parte de lo que espera la acción, y va en un subscriber.

Lo vi en [ai-town](https://github.com/rodacato/ai-town), un pueblo simulado para comparar modelos de lenguaje. Fue un arranque de mucho vibe coding con Claude, no tanto en tiempo como en iteraciones. Todo era de un solo pueblo, y yo ya sabía que quería otro. Eso cambió lo que esperaba del sistema: que un mundo nuevo fuera una carpeta nueva, no un fork. A media mañana [reorganicé el código](https://github.com/rodacato/ai-town/commit/2d7b199) en core, providers y worlds; diez minutos después metí un [contrato de "world pack"](https://github.com/rodacato/ai-town/commit/eb98b59): "a new world is a new folder plus one line". Siete minutos más tarde entró el segundo pueblo. Es un nivel más arriba que una acción, pero el criterio es el mismo: lo que cambió fue lo que esperaba el sistema.

Ahora, la otra cara. Mis errores con DDD fueron muchos. El más común, por mucho: **partir use cases en varios muy pequeños que todavía no se reusaban**. Los demás:

- Definir bounded contexts de más
- Aggregate roots ambiciosos que querían cargar con todo
- Invariantes que eran de otro dominio, metidas ahí por reusar lógica

Fíjate que el primero y el último son el mismo pecado: cortar pensando en reuso. La regla de "qué espera" los habría evitado, porque un paso repetido no cambia lo que la acción espera.

## Un booleano no necesita monads

En stockerly, febrero de 2026, así nació pausar o activar una alerta:

```ruby
class ToggleRule < ApplicationUseCase
  def call(user:, rule_id:)
    rule = yield find_rule(user, rule_id)
    rule.update!(status: rule.active? ? :paused : :active)

    Success(rule)
  end

  private

  def find_rule(user, id)
    rule = user.alert_rules.find_by(id: id)
    rule ? Success(rule) : Failure([:not_found, "Alert rule not found"])
  end
end
```

Monads, `yield`, un método privado que envuelve un `find_by` en `Success`/`Failure`. Para voltear un booleano.

En mayo lo migré, junto con otros dos use cases de una sola mutación, a esto:

```ruby
class ToggleRule < SimpleUseCase
  def call(user:, rule_id:)
    rule = user.alert_rules.find(rule_id)
    rule.update!(status: rule.active? ? :paused : :active)
    rule
  end
end
```

Tres líneas. Si no existe, `find` truena y el controller responde con su flash. La checklist era de dos pasos y no ocupaba más.

No fue el único. La auditoría de mayo contó que cerca de un tercio de los 67 use cases de entonces eran envolturas así, y de ahí salió el [ADR-006](https://github.com/rodacato/stockerly/blob/master/docs/architecture/adr/0006-simple-use-case-criterion.md): la base se elige por lo que la acción ocupa, no por regla uniforme. Son cuatro pruebas: sin `yield`, sin contrato, sin publicar eventos por la base y sin nadie que haga pattern matching sobre su resultado. Las cuatro, o lleva monads. La cuarta es la que se olvida: en septiembre un [issue](https://github.com/rodacato/stockerly/issues/535) contó que 21 de las 51 que heredaban `ApplicationUseCase` no usaban `yield`, contrato ni eventos. El desvío real era de 13: a las otras 8 las detenía justo la cuarta.

## La batalla que no di

Antes de dry-rb yo usaba los modelos de ActiveRecord como entidades dentro de los actions. Y era muy fácil caer en la tentación de mutarlos. `dry-struct` y las entidades me salvaron de esa mala maña en Invoy y en Monato.

Si abres stockerly vas a ver lo contrario. `Dry::Struct` aparece en dos archivos de `app/`. De las 83 acciones que tiene hoy, 35 llaman `update!`, `save!` o `create!` sobre ActiveRecord directo. `ExecuteTrade`, el de arriba, hace `position.update!`.

Esa batalla no la di. stockerly es Rails, y ahí las convenciones jalan fuerte. Lo de adentro es el cómo, y ese lo cambio cuando me estorbe.

En febrero los use cases vivían planos en `app/use_cases`; en marzo los seis contextos pasaron a estructura hexagonal; en mayo salió el ADR-006 con nueve migraciones. Las entidades siguen pendientes y hoy no me estorban. Eso me dio functional domain modeling: escoger las batallas y dejar que el sistema converja sin el cansancio de hacerlo, y muchas veces rehacerlo, en el camino.

---

Hoy, antes de partir una acción, me hago una sola pregunta: ¿cambió lo que espera? Si solo se repite un paso, no la parto.
