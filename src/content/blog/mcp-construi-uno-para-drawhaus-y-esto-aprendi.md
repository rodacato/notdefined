---
title: 'MCP: construí uno para Drawhaus y esto aprendí'
description: 'No soy experto en MCP, pero construí uno para Drawhaus — que un LLM genere diagramas de RFCs, ADRs y SDDs desde un spec en lugar de dibujarlos a mano. Qué son sin el hype (wrappers con esteroides), stdio vs Streamable HTTP, un server mínimo que puedes correr, y por qué en un mundo de LLMs tu producto necesita ser LLM-friendly o se muere lento.'
pubDate: 2026-06-19
tags: ['mcp', 'llm', 'ai', 'drawhaus', 'architecture']
draft: true
---

## TL;DR

- **MCP es un protocolo** para exponerle a un LLM tus _tools_, _resources_ y _prompts_ de forma estándar. A mi forma de verlo: wrappers con esteroides.
- Construí uno para **Drawhaus** que genera diagramas (Mermaid) de RFCs, ADRs y SDDs **desde un spec**, en lugar de dibujarlos a mano. El objetivo no era técnico: era hacer Drawhaus **adoptable** en equipos que ya viven en el LLM.
- Dos transports que importan: **stdio** (local, vive contigo) y **Streamable HTTP** (remoto, lo deployeas). SSE quedó deprecado en 2025 — si lees "HTTP/SSE" en un tutorial, está viejo.
- Te dejo un **server mínimo en stdio** que puedes correr y conectar a Claude Code hoy.
- La tesis incómoda: en una época donde se hace más vibe coding que código, que tu producto sea _LLM-friendly_ es la diferencia entre que lo usen o que se muera lento.

---

Aclaro de entrada: no soy experto en MCP. Esto es lo que aprendí usándolos y construyendo uno por mi cuenta, con sus tropiezos. Si buscas la especificación canónica, ve a la fuente; si quieres saber cómo se siente meterle mano, quédate.

## Qué es MCP sin el hype

MCP (Model Context Protocol) es un estándar para que un cliente LLM —Claude Code, Claude Desktop, el que sea— hable con un servidor que expone tres cosas: **tools** (acciones que el modelo puede ejecutar), **resources** (datos que puede leer) y **prompts** (plantillas reutilizables). Por debajo es JSON-RPC, nada exótico.

¿Por qué digo que son wrappers con esteroides? Porque eso es lo que son: un wrapper alrededor de tu API o tu lógica. Lo que les pone esteroides es la **estandarización**. Antes, si querías que un LLM usara tu servicio, cada quien inventaba su formato de function calling y lo pegaba a mano. Con MCP, escribes el server una vez y _cualquier_ cliente que hable MCP lo descubre y lo usa. Esa interoperabilidad es todo el punto.

No es magia, es plomería — la que el ecosistema necesitaba para que cada quien dejara de reinventar el mismo wrapper por su lado.

## Por qué construí uno para Drawhaus

[Drawhaus](https://drawhaus.notdefined.dev) es mi alternativa self-hosted a Excalidraw. El problema que quería resolver no era de la herramienta — era de **adopción**. Un equipo no cambia de tool de diagramación porque sí; lo hace cuando le quitas fricción.

¿Y cuál es la fricción más grande de los diagramas? Hacerlos. Nadie quiere abrir un canvas y acomodar cajitas para documentar un RFC, un ADR o un SDD. Así que el MCP de Drawhaus expone una tool que toma un **spec** —el texto de tu documento técnico— y genera el diagrama en Drawhaus como Mermaid. Le dices a Claude "diagrama el flujo de este ADR" y aparece en tu Drawhaus, listo para ajustar.

El cálculo fue directo: la gente ya está en Claude Code escribiendo sus docs. Si Drawhaus vive _ahí_, dentro de su flujo, deja de competir por atención. Esa es la jugada — y es la misma que está haciendo medio mundo. Mira context7 sirviéndole docs actualizadas a los LLMs, o el MCP toolkit de Docker. El mercado está empujando a que los servicios sean LLM-friendly por default. No es opcional ya.

## stdio vs Streamable HTTP: cuál y cuándo

Aquí está la decisión que más confunde al principio, y es más simple de lo que parece. Hay dos transports que importan:

**stdio** — el cliente levanta tu server como un subproceso y se hablan por stdin/stdout. Vive _contigo_, en tu máquina, junto al cliente. Cero infraestructura: no hay servidor que deployar, no hay puerto, no hay auth. Es el default para todo lo local: tooling personal, algo que corre en tu repo, un MCP que toca tu file system.

**Streamable HTTP** — tu server es un proceso independiente que escucha por HTTP y atiende a varios clientes. Esto es lo que deployeas cuando el MCP tiene que vivir en un servidor: un servicio compartido por un equipo, algo detrás de auth, un SaaS que ofrece su MCP a sus clientes.

Un apunte para que no te vean la cara: el transport remoto **antes** era HTTP+SSE. Quedó **deprecado** en el spec de marzo de 2025 y lo reemplazó Streamable HTTP (que puede usar SSE _por dentro_ para streamear, pero ya no es el transport "SSE" de antes). Si un tutorial te dice "usa SSE para remoto", está viejo.

¿La regla práctica? **stdio si vive contigo, Streamable HTTP si lo consume un equipo o un servicio.** Suena obvio escrito así, pero aquí está mi tropiezo, por si te ahorro el rato: con el de Drawhaus no entendí esa diferencia a tiempo. Lo armé sin pensar en el transport, y cuando caí en que lo necesitaba **remoto** —porque el diagrama tiene que aterrizar en una instancia que el equipo comparte, no en mi laptop— lo tuve que **rehacer**.

Y lo segundo que no me esperaba: escribir el server fue la parte fácil. Conectarlo del lado del **cliente** —que Claude lo _descubra_ y lo _use_ bien— me costó más, por pura falta de experiencia. Un MCP no es solo la fuente; es también la mitad que vive en la config del cliente, y esa mitad está peor documentada. Esa fue la curva real, no el código.

## Un MCP mínimo que sí corre

Suficiente teoría. Este es un server completo en stdio, con una tool. Lo escribí con el SDK oficial de TypeScript:

```ts
// drawhaus-mcp.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({ name: 'drawhaus', version: '0.1.0' });

server.tool(
  'create_diagram',
  'Crea un diagrama en Drawhaus a partir de Mermaid',
  { title: z.string(), mermaid: z.string() },
  async ({ title, mermaid }) => {
    const res = await fetch(`${process.env.DRAWHAUS_URL}/api/diagrams`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.DRAWHAUS_TOKEN}`,
      },
      body: JSON.stringify({ title, mermaid }),
    });
    const { url } = await res.json();
    return { content: [{ type: 'text', text: `Diagrama creado: ${url}` }] };
  },
);

await server.connect(new StdioServerTransport());
```

Eso es todo el server. Una tool, un contrato explícito (gracias a Zod, el LLM sabe qué mandar), y la lógica real —el POST a Drawhaus— igual que cualquier cliente HTTP. Fíjate que el server **no decide nada de negocio**: solo traduce entre el LLM y mi API. Esa frontera es a propósito; el día que cambie de protocolo, la lógica de Drawhaus no se entera.

Un detalle por si lo copias: la API exacta del SDK cambia entre versiones (en algunas el método es `registerTool` en lugar de `tool`). Checa la versión que instales antes de pelearte con un error raro.

Para conectarlo a Claude Code, un `.mcp.json` en tu proyecto:

```json
{
  "mcpServers": {
    "drawhaus": {
      "command": "node",
      "args": ["./drawhaus-mcp.js"],
      "env": {
        "DRAWHAUS_URL": "https://drawhaus.notdefined.dev",
        "DRAWHAUS_TOKEN": "tu-token"
      }
    }
  }
}
```

Reinicias Claude Code, y ya tienes una tool `create_diagram` que el modelo puede invocar. Le pegas tu ADR, le dices "diagrámalo", y el diagrama aparece en tu Drawhaus. Eso es el loop completo.

## Lo que me llevo

MCP no es revolucionario en lo técnico — es un wrapper estandarizado, y a veces se siente como ceremonia para algo que un script resolvía. Pero esa lectura se queda corta. En un mundo donde la gente le habla a un LLM antes que a tu UI, el MCP es **la puerta** por la que tu producto entra a su flujo de trabajo. Sin esa puerta, existes pero no te encuentran.

Construir el de Drawhaus no me hizo experto. Me hizo entender que "ser LLM-friendly" dejó de ser un nice-to-have. Es la diferencia, para muchos productos, entre que los adopten o que se mueran despacito mientras otro —con peor producto pero mejor integrado— se lleva a los usuarios.

La neta, arma uno chiquito en stdio y conéctalo a Claude. Yo me tardé más de lo que debía justo por no hacerlo antes — se entiende haciéndolo, no leyendo sobre ello.
