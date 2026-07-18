/* ============================================================================
   data/simulaciones.js — el guión de los "bailes"
   ----------------------------------------------------------------------------
   Solo DATOS. El motor (render + animación + controles) vive en
   js/components.js. Cada paso narra UNA sola cosa que cambia; todo determinista.

   Dos tipos:
     · "secuencia" — diagrama de secuencia entre actores. Campos por paso:
         narracion, why?, activos[], mensaje?{de,a,etiqueta,dir,tipo,dashed},
         local?{actor,etiqueta,tipo}
       Puede tener varias `tabs` (p.ej. passkey: registro / login).
     · "logout"    — comparación de 3 estrategias en paralelo.
   ========================================================================== */
(function (G) {
  "use strict";

  G.simulaciones = {

    /* --------------------------------------------------------------------
       OAuth 2.1 · authorization code + PKCE
       -------------------------------------------------------------------- */
    oauth: {
      titulo: "OAuth 2.1 · authorization code + PKCE",
      tipo: "secuencia",
      actores: [
        { id: "browser", label: "Navegador", color: "var(--role-browser)" },
        { id: "app",     label: "App cliente", color: "var(--role-app)" },
        { id: "auth",    label: "Servidor de auth", color: "var(--role-auth)" },
        { id: "api",     label: "API / recurso", color: "var(--role-api)" }
      ],
      tabs: [{ id: "flujo", label: "El baile", pasos: [
        { narracion: "La app genera un secreto de un solo uso, el code_verifier — que se queda con él — y deriva su hash: el code_challenge, lo único que enviará.",
          why: "El verifier nunca sale del cliente todavía. Recuérdalo — es la pieza clave.",
          activos: ["app"], local: { actor: "app", etiqueta: "verifier + challenge" } },
        { narracion: "La app manda al navegador al servidor de auth con el code_challenge, pidiendo autorización.",
          activos: ["browser", "app", "auth"], mensaje: { de: "app", a: "auth", etiqueta: "GET /authorize?challenge", dir: "der" } },
        { narracion: "El usuario se autentica y aprueba los permisos en la pantalla del servidor de auth.",
          activos: ["browser", "auth"], mensaje: { de: "browser", a: "auth", etiqueta: "login + consentimiento", dir: "der" } },
        { narracion: "El servidor devuelve al navegador un authorization code de un solo uso.",
          activos: ["browser", "auth"], mensaje: { de: "auth", a: "browser", etiqueta: "redirect ?code=XYZ", dir: "izq" } },
        { narracion: "El navegador entrega ese code a la app cliente.",
          activos: ["browser", "app"], mensaje: { de: "browser", a: "app", etiqueta: "code=XYZ", dir: "izq" } },
        { narracion: "La app canjea el code por un token — y ahora sí presenta el code_verifier original.",
          activos: ["app", "auth"], mensaje: { de: "app", a: "auth", etiqueta: "POST /token · code + verifier", dir: "der" } },
        { narracion: "El servidor comprueba que hash(verifier) coincide con el challenge que guardó al inicio.",
          why: "Aunque un atacante hubiera interceptado el code en el redirect, sin el verifier el canje falla. Eso mata la interceptación del code.",
          activos: ["auth"], local: { actor: "auth", etiqueta: "hash(verifier) == challenge ✓", tipo: "ok" } },
        { narracion: "Verificado, el servidor emite el access token (y un refresh token).",
          activos: ["app", "auth"], mensaje: { de: "auth", a: "app", etiqueta: "access_token + refresh", dir: "izq", tipo: "ok" } },
        { narracion: "La app llama a la API llevando el access token en el header Authorization.",
          activos: ["app", "api"], mensaje: { de: "app", a: "api", etiqueta: "Authorization: Bearer …", dir: "der" } },
        { narracion: "La API valida el token y responde con el recurso. Baile terminado.",
          activos: ["app", "api"], mensaje: { de: "api", a: "app", etiqueta: "200 · recurso", dir: "izq", tipo: "ok" } }
      ]}]
    },

    /* --------------------------------------------------------------------
       Passkey · ceremonia de registro y de login
       -------------------------------------------------------------------- */
    passkey: {
      titulo: "Passkey · registro y login (WebAuthn)",
      tipo: "secuencia",
      actores: [
        { id: "auth",    label: "Autenticador", color: "var(--role-auth)", icon: "finger" },
        { id: "browser", label: "Navegador", color: "var(--role-browser)" },
        { id: "server",  label: "Servidor (ejemplo.com)", color: "var(--role-api)" }
      ],
      tabs: [
        { id: "registro", label: "Registro", pasos: [
          { narracion: "El navegador le pide al servidor iniciar el registro de una passkey.",
            activos: ["browser", "server"], mensaje: { de: "browser", a: "server", etiqueta: "quiero registrar", dir: "der" } },
          { narracion: "El servidor responde con un reto aleatorio y su identidad (ejemplo.com).",
            activos: ["browser", "server"], mensaje: { de: "server", a: "browser", etiqueta: "challenge + rpId", dir: "izq" } },
          { narracion: "El navegador le pide al autenticador crear una credencial ligada a ejemplo.com.",
            why: "La llave queda amarrada a este dominio. Ese amarre es lo que después bloquea el phishing.",
            activos: ["browser", "auth"], mensaje: { de: "browser", a: "auth", etiqueta: "create(origin=ejemplo.com)", dir: "izq" } },
          { narracion: "El autenticador genera un par de llaves y pide tu biometría. La llave privada se queda aquí, para siempre.",
            activos: ["auth"], local: { actor: "auth", etiqueta: "par de llaves · Face ID" } },
          { narracion: "Devuelve al navegador la llave pública y un id de credencial.",
            activos: ["auth", "browser"], mensaje: { de: "auth", a: "browser", etiqueta: "pubkey + credId", dir: "der" } },
          { narracion: "El navegador manda la llave pública al servidor.",
            activos: ["browser", "server"], mensaje: { de: "browser", a: "server", etiqueta: "pubkey + credId", dir: "der" } },
          { narracion: "El servidor guarda la llave pública. No hay ningún secreto compartido que pueda filtrarse.",
            activos: ["server"], local: { actor: "server", etiqueta: "guarda pubkey ✓", tipo: "ok" } }
        ]},
        { id: "login", label: "Login", pasos: [
          { narracion: "El navegador pide entrar; el servidor manda un reto nuevo y aleatorio.",
            activos: ["browser", "server"], mensaje: { de: "server", a: "browser", etiqueta: "challenge", dir: "izq" } },
          { narracion: "El navegador le pide al autenticador firmar el reto, para el origen ejemplo.com.",
            activos: ["browser", "auth"], mensaje: { de: "browser", a: "auth", etiqueta: "get(origin=ejemplo.com)", dir: "izq" } },
          { narracion: "El autenticador verifica tu biometría y firma el reto con la llave privada local.",
            activos: ["auth"], local: { actor: "auth", etiqueta: "firma con privada local" } },
          { narracion: "Devuelve la firma al navegador, que la reenvía al servidor.",
            activos: ["auth", "browser", "server"], mensaje: { de: "browser", a: "server", etiqueta: "firma del reto", dir: "der" } },
          { narracion: "El servidor verifica la firma con la llave pública guardada. Entras.",
            why: "Un sitio falso (phishing.com) no puede pedir una firma válida: la llave solo responde a ejemplo.com. El phishing no tiene de dónde agarrar.",
            activos: ["server"], local: { actor: "server", etiqueta: "verifica firma ✓", tipo: "ok" } }
        ]}
      ]
    },

    /* --------------------------------------------------------------------
       Webhook firmado con HMAC · y el replay parado por el timestamp
       -------------------------------------------------------------------- */
    hmac: {
      titulo: "Webhook HMAC · firma, verificación y replay",
      tipo: "secuencia",
      actores: [
        { id: "partner",  label: "Partner (emisor)", color: "var(--role-app)" },
        { id: "atacante", label: "Atacante", color: "var(--role-fail)" },
        { id: "server",   label: "Tu servidor", color: "var(--role-api)" }
      ],
      tabs: [{ id: "flujo", label: "Firma y replay", pasos: [
        { narracion: "El partner arma el payload con un timestamp y firma todo con el secreto compartido.",
          activos: ["partner"], local: { actor: "partner", etiqueta: "sig = HMAC(secreto, payload+ts)" } },
        { narracion: "Envía el webhook a tu servidor con la firma y el timestamp en headers.",
          activos: ["partner", "server"], mensaje: { de: "partner", a: "server", etiqueta: "POST · X-Signature + ts", dir: "der" } },
        { narracion: "Tu servidor recalcula el HMAC con su copia del secreto y compara en tiempo constante.",
          why: "Si las firmas coinciden, el payload no fue alterado y viene del partner. Nadie más conoce el secreto.",
          activos: ["server"], local: { actor: "server", etiqueta: "recalcula HMAC · coincide ✓", tipo: "ok" } },
        { narracion: "Firma válida y timestamp fresco: acepta el webhook.",
          activos: ["partner", "server"], mensaje: { de: "server", a: "partner", etiqueta: "200 OK", dir: "izq", tipo: "ok" } },
        { narracion: "Un atacante había capturado ese request idéntico — no de la red (TLS la cubre): de tus logs o de un proxy interno comprometido.",
          activos: ["atacante"], local: { actor: "atacante", etiqueta: "guardó el request" } },
        { narracion: "Lo reenvía tal cual, intentando un ataque de replay.",
          activos: ["atacante", "server"], mensaje: { de: "atacante", a: "server", etiqueta: "replay · request idéntico", dir: "der" } },
        { narracion: "La firma es válida… pero el timestamp ya está fuera de la ventana permitida.",
          why: "El timestamp firmado es lo que frena el replay: sin él, un mensaje válido capturado serviría para siempre.",
          activos: ["server"], local: { actor: "server", etiqueta: "ts expirado · rechaza", tipo: "fail" } },
        { narracion: "Tu servidor rechaza el replay.",
          activos: ["atacante", "server"], mensaje: { de: "server", a: "atacante", etiqueta: "401 · replay detectado", dir: "izq", tipo: "fail" } }
      ]}]
    },

    /* --------------------------------------------------------------------
       SAML · el redirect dance browser ↔ IdP ↔ SP
       -------------------------------------------------------------------- */
    saml: {
      titulo: "SSO SAML · el baile de redirects",
      tipo: "secuencia",
      actores: [
        { id: "browser", label: "Navegador", color: "var(--role-browser)" },
        { id: "sp",      label: "SP (tu app)", color: "var(--role-app)" },
        { id: "idp",     label: "IdP corporativo", color: "var(--role-idp)" }
      ],
      tabs: [{ id: "flujo", label: "Redirect dance", pasos: [
        { narracion: "El empleado pide un recurso protegido en tu app (el SP).",
          activos: ["browser", "sp"], mensaje: { de: "browser", a: "sp", etiqueta: "GET /recurso", dir: "der" } },
        { narracion: "El SP no ve contraseñas: redirige al IdP con un AuthnRequest SAML.",
          why: "El SP delega la autenticación al IdP central. Nunca toca las credenciales del empleado.",
          activos: ["browser", "sp"], mensaje: { de: "sp", a: "browser", etiqueta: "redirect · AuthnRequest", dir: "izq" } },
        { narracion: "El navegador sigue el redirect y llega al IdP corporativo.",
          activos: ["browser", "idp"], mensaje: { de: "browser", a: "idp", etiqueta: "AuthnRequest", dir: "der" } },
        { narracion: "El empleado se autentica contra el IdP (aquí sí viven las credenciales).",
          activos: ["idp"], local: { actor: "idp", etiqueta: "valida al empleado" } },
        { narracion: "El IdP responde con una aserción SAML firmada, vía un POST que el navegador reenvía.",
          activos: ["browser", "idp"], mensaje: { de: "idp", a: "browser", etiqueta: "SAML Response firmada", dir: "izq" } },
        { narracion: "El navegador entrega la aserción firmada al SP.",
          activos: ["browser", "sp"], mensaje: { de: "browser", a: "sp", etiqueta: "POST · aserción", dir: "der" } },
        { narracion: "El SP verifica la firma con el certificado del IdP intercambiado al federar.",
          why: "Confía en la aserción porque va firmada con el certificado acordado. Ahí está el ancla de confianza — y el dolor de mantenerlo.",
          activos: ["sp"], local: { actor: "sp", etiqueta: "verifica firma · cert IdP ✓", tipo: "ok" } },
        { narracion: "El SP crea la sesión y concede el acceso.",
          activos: ["browser", "sp"], mensaje: { de: "sp", a: "browser", etiqueta: "sesión creada · 200", dir: "izq", tipo: "ok" } }
      ]}]
    },

    /* --------------------------------------------------------------------
       LA JOYA · el mismo logout en 3 estrategias, en paralelo
       -------------------------------------------------------------------- */
    logout: {
      titulo: "Cerrar sesión: tres finales distintos",
      tipo: "logout",
      tracks: [
        { id: "session", nombre: "Session cookie", sub: "estado en el servidor" },
        { id: "jwtpuro", nombre: "JWT puro", sub: "JWT de 60 min, sin refresh" },
        { id: "jwtref",  nombre: "JWT corto + refresh", sub: "access 15 min · refresh revocable" },
        { id: "dpop",    nombre: "JWT + DPoP", sub: "access 15 min · amarrado a tu llave" }
      ],
      pasos: [
        { narracion: "Sesión iniciada. Los tres métodos te tienen dentro, todo normal.",
          estados: {
            session: { estado: "alive", detalle: "Cookie válida · sesión en Redis" },
            jwtpuro: { estado: "alive", detalle: "JWT válido · caduca en 60 min" },
            jwtref:  { estado: "alive", detalle: "Access 15 min · refresh en servidor" },
            dpop:    { estado: "alive", detalle: "Access 15 min · cada request lleva la prueba de posesión de tu llave" }
          } },
        { narracion: "Un atacante roba tu token/cookie desde otra máquina. Ahora hay dos copias vivas.",
          estados: {
            session: { estado: "alive", detalle: "Cookie robada · pero la sesión sigue en TU servidor" },
            jwtpuro: { estado: "alive", detalle: "JWT robado · válido tal cual, sin tocar tu servidor" },
            jwtref:  { estado: "alive", detalle: "Access robado · válido, refresh también" },
            dpop:    { estado: "alive", detalle: "Access robado · la llave privada no: esa nunca sale de tu dispositivo" }
          } },
        { narracion: "Pulsas «Cerrar sesión». Aquí se separan los caminos.",
          estados: {
            session: { estado: "dead", detalle: "DELETE de la sesión en Redis",
                       verdict: { tono: "win", texto: "Muerta al instante — también para el atacante." } },
            jwtpuro: { estado: "zombie", detalle: "El servidor no puede invalidarlo. El JWT sigue vivo.", timer: 98,
                       verdict: { tono: "lose", texto: "Logout solo borra tu copia local. La del atacante sigue." } },
            jwtref:  { estado: "zombie", detalle: "Refresh revocado en servidor; el access aún no caduca.", timer: 100,
                       verdict: { tono: "neutral", texto: "Acotado: el access morirá en ≤15 min." } },
            dpop:    { estado: "zombie", detalle: "Refresh revocado; el access vive ≤15 min — y solo corre con tu llave.", timer: 100,
                       verdict: { tono: "neutral", texto: "Acotado como el refresh. La diferencia se ve en el siguiente paso." } }
          } },
        { narracion: "El atacante usa su copia justo después del logout.",
          estados: {
            session: { estado: "dead", detalle: "401 · la sesión ya no existe",
                       verdict: { tono: "win", texto: "El atacante rebota." } },
            jwtpuro: { estado: "zombie", detalle: "200 OK · el atacante entra. Faltan 59 min de validez.", timer: 90,
                       verdict: { tono: "lose", texto: "Acceso robado en curso." } },
            jwtref:  { estado: "zombie", detalle: "200 OK · todavía dentro de la ventana de 15 min.", timer: 70,
                       verdict: { tono: "neutral", texto: "Entra, pero con reloj corriendo." } },
            dpop:    { estado: "zombie", detalle: "401 · presenta el token… sin la firma DPoP de tu llave. Rebota.", timer: 70,
                       verdict: { tono: "win", texto: "La copia robada no sirve sin la llave." } }
          } },
        { narracion: "Pasan 15 minutos.",
          estados: {
            session: { estado: "dead", detalle: "Sigue muerta.",
                       verdict: { tono: "win", texto: "" } },
            jwtpuro: { estado: "zombie", detalle: "Sigue vivo. 45 min más de acceso robado.", timer: 60,
                       verdict: { tono: "lose", texto: "El daño se acumula." } },
            jwtref:  { estado: "dead", detalle: "El access caducó y el refresh está revocado: renovar → falla.",
                       verdict: { tono: "win", texto: "Se cierra solo. Ventana máxima: 15 min." } },
            dpop:    { estado: "dead", detalle: "El access caducó; el refresh estaba revocado.",
                       verdict: { tono: "win", texto: "Y el atacante nunca entró." } }
          } },
        { narracion: "Pasa 1 hora. Recuento de daños.",
          estados: {
            session: { estado: "dead", detalle: "Nunca revivió.",
                       verdict: { tono: "win", texto: "Revocación real, inmediata. Por esto la web clásica usa sesiones." } },
            jwtpuro: { estado: "dead", detalle: "Por fin caduca solo. Estuvo 1 hora entera en manos del atacante.",
                       verdict: { tono: "lose", texto: "Firmaste un cheque que no pudiste cancelar." } },
            jwtref:  { estado: "dead", detalle: "Muerto desde el minuto 15.",
                       verdict: { tono: "win", texto: "El compromiso 2026: ventana de 15 min, no de 60." } },
            dpop:    { estado: "dead", detalle: "Muerto desde el minuto 15 — y la copia robada jamás sirvió.",
                       verdict: { tono: "win", texto: "El robo se volvió papel: token amarrado (sender-constrained), justo lo que OAuth 2.1 pide para clientes públicos." } }
          } }
      ]
    }

  };

})(window.GUIA = window.GUIA || {});
