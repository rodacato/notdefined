---
title: "Expo `--tunnel` desde un devcontainer me salvó el loop de desarrollo"
date: 2026-04-15
tags: ["expo", "devcontainer", "ngrok", "mobile", "react-native"]
---

Empecé Mi Feria con Expo Web — preview en el browser, ver el cambio en 200ms, todo bien. Cuando la app se puso "más seria" y quise meter animaciones de verdad, Expo Web dejó de soportar lo que necesitaba. Me asusté pensando que iba a tener que abrir Android Studio. No fue así. La Development Build instalada en mi celular se puede conectar a una URL del dev server, y el problema era que mi dev server vive dentro de un devcontainer en VS Code — atrás de la red de Docker, sin acceso directo por LAN desde el celular. Entonces apareció `--tunnel`:

```bash
npx expo start --tunnel
# Abre Metro detrás de un túnel ngrok público.
# La Development Build pega a esa URL en lugar de LAN.
```

Bajo el cofre, `npx expo start --tunnel` levanta `@expo/ngrok` y te da una URL `*.exp.direct`. Ya no importa si mi laptop y mi celular están en la misma red, ya no importa si Metro vive en Docker. La Development Build se conecta a la URL, Metro empuja los cambios de JS, y cuando publico un EAS Update también pasa por el mismo canal. El loop quedó: cambio JS → recarga en el celular sin compilar.

La caveat honesta: el túnel es compartido entre los devs del mundo que usan `--tunnel`, hay un límite de conexiones simultáneas, y hay momentos en que no abre. Como Mi Feria es pet project y trabajo fuera de horario de oficina (donde el tráfico de Expo cae), me he topado con el problema dos o tres veces en meses. Si esto fuera trabajo serio, pagaría ngrok propio. Pero para *darle vida* a mi devcontainer sin Android Studio, gratis y suficiente.
