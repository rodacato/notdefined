---
title: "Monolitos vs microservicios en 2026: el debate que ya debería estar muerto"
date: 2026-03-01
tags: ["architecture", "backend"]
---

Un CTO me dijo esta semana que los monolitos están muertos y que todos están reescribiendo en microservicios. Me quedé callado porque sentí exactamente lo contrario — la tendencia que veo en la industria va en la otra dirección.

Los casos que confirman esa intuición: Amazon Prime Video migró de microservicios a monolito en 2023 y redujo costos de infraestructura un 90%. Segment consolidó 140+ servicios en uno solo porque la complejidad operacional estaba matando la productividad. Shopify lleva años defendiendo el monolito modular a escala global y es un testimonio en vida de lo que puede hacer una aplicación monolítica modular de Rails.

La distinción que importa no es monolito vs microservicios — es "Big Ball of Mud" vs Monolito Modular. O mejor aún, tus interfaces. El segundo tiene fronteras de dominio claras internamente, schemas separados por módulo, y se despliega como una sola unidad. Obtienes el orden del dominio sin el network tax de los microservicios, sin mencionar el tax del developer experience — el más subvalorado pero el más importante.

El criterio que uso: nunca empieces con microservicios. En mi opinión es una evolución de las arquitecturas, no una decisión de diseño. Confío en las interfaces y cómo me dan la flexibilidad para evolucionar a microservicios cuando sea necesario, no antes — a menos que tengas equipos *diferentes* que necesiten deployar de forma independiente. Si no, el monolito gana. Y no está en conflicto con Clean Architecture, no son lo mismo, no te confundas.

Lo sé porque lo viví dos veces, empezamos con microservicios, terminamos con monolito distribuido — lo peor de los dos mundos.

---

- [Scaling up the Prime Video audio/video monitoring service and reducing costs by 90%](https://www.primevideotech.com/video-streaming/scaling-up-the-prime-video-audio-video-monitoring-service-and-reducing-costs-by-90) — Prime Video Tech Blog
- [Goodbye Microservices: From 100s of problem children to 1 superstar](https://segment.com/blog/goodbye-microservices/) — Segment Engineering
- [Deconstructing the Monolith: Designing Software that Maximizes Developer Productivity](https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity) — Shopify Engineering
