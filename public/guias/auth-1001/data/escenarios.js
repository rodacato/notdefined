/* ============================================================================
   data/escenarios.js — quiz "¿cuál uso?"
   ----------------------------------------------------------------------------
   Árbol de decisión. Cada opción lleva a otro `nodo` o a un `veredicto`.
   Los veredictos enseñan la lección clave: el stack 2026 es políglota — cada
   capa en su superficie. Solo datos; el motor está en js/page-cual-uso.js.
   ========================================================================== */
(function (G) {
  "use strict";

  G.quizNodos = {
    inicio: {
      pregunta: "¿Qué estás construyendo?",
      opciones: [
        { label: "Una app web con mi propia API y login de usuarios", nodo: "web" },
        { label: "Acceso a recursos de un tercero, o que otra app consuma la mía", veredicto: "oauth" },
        { label: "Servicios que se hablan entre sí, sin humano en el bucle", nodo: "m2m" },
        { label: "SSO para empleados de una empresa", veredicto: "sso" },
        { label: "Dame el stack completo recomendado para 2026", veredicto: "full" }
      ]
    },
    web: {
      pregunta: "Sobre la puerta de entrada: ¿quieres frenar el phishing de raíz?",
      opciones: [
        { label: "Sí — lo más resistente a phishing posible, adiós contraseñas", veredicto: "passkeys" },
        { label: "Por ahora login clásico con contraseña", veredicto: "sesion" }
      ]
    },
    m2m: {
      pregunta: "¿Cómo se comunican esos servicios?",
      opciones: [
        { label: "Un partner externo me manda webhooks", veredicto: "hmac" },
        { label: "Servicios internos en una red de confianza cero", veredicto: "mtls" },
        { label: "Solo necesito identificar qué app llama a mi API", veredicto: "apikeys" }
      ]
    }
  };

  // fam: id de familia para el color del acento de cada capa.
  G.quizVeredictos = {
    full: {
      titulo: "El stack políglota 2026",
      sub: "No es un método, son cuatro capas — cada una en su superficie. Esa es la lección.",
      capas: [
        { where: "La puerta", pick: "Passkeys (WebAuthn)", why: "Login sin contraseña, resistente a phishing por diseño.", fam: "identidad", ficha: "passkeys" },
        { where: "La web", pick: "Session cookies", why: "Estado en el servidor: revocación instantánea, escala con caching.", fam: "identidad", ficha: "session-cookies" },
        { where: "La API", pick: "JWT corto + refresh revocable", why: "Access de 15 min sin tocar la BD; refresh server-side para poder revocar de verdad.", fam: "identidad", ficha: "jwt-sesion" },
        { where: "El acceso", pick: "RBAC", why: "Quién puede qué. Sube a ABAC/ReBAC solo cuando se quede corto.", fam: "autorizacion", ficha: "rbac" }
      ]
    },
    passkeys: {
      titulo: "Passkeys en la puerta + sesión para la web",
      sub: "Entras sin contraseña y resistente a phishing; una vez dentro, la sesión clásica manda.",
      capas: [
        { where: "Login", pick: "Passkeys (WebAuthn)", why: "La llave ligada al origen: el phishing no tiene de dónde agarrar.", fam: "identidad", ficha: "passkeys" },
        { where: "Web", pick: "Session cookies", why: "Revocación instantánea tras el login.", fam: "identidad", ficha: "session-cookies" },
        { where: "API", pick: "JWT corto + refresh revocable", why: "Para tu SPA/móvil contra tu propia API.", fam: "identidad", ficha: "jwt-sesion" }
      ]
    },
    sesion: {
      titulo: "Session cookies para la web, JWT corto para la API",
      sub: "El clásico que aguanta millones de usuarios. Deja la puerta lista para passkeys después.",
      capas: [
        { where: "Web", pick: "Session cookies", why: "Estado en servidor, revocación real, HttpOnly + SameSite.", fam: "identidad", ficha: "session-cookies" },
        { where: "API", pick: "JWT corto + refresh revocable", why: "Nada de JWT largo como sesión: no lo podrías revocar.", fam: "identidad", ficha: "jwt-sesion" },
        { where: "Acceso", pick: "RBAC", why: "Roles → permisos. El default que casi siempre alcanza.", fam: "autorizacion", ficha: "rbac" }
      ]
    },
    oauth: {
      titulo: "OAuth 2.1 · authorization code + PKCE",
      sub: "Delegación de acceso sin compartir contraseñas. Si además necesitas saber QUIÉN es el usuario, súbete a OIDC.",
      capas: [
        { where: "Delegación", pick: "OAuth 2.1 (code + PKCE)", why: "PKCE de piso; mata la interceptación del code. Device flow y client credentials son variantes.", fam: "delegacion", ficha: "oauth" },
        { where: "Identidad", pick: "OIDC", why: "Solo si necesitas login/identidad además del acceso.", fam: "delegacion", ficha: "oidc" }
      ]
    },
    sso: {
      titulo: "OIDC (y SAML solo si el cliente lo exige)",
      sub: "Para greenfield, OIDC. SAML solo cuando el contrato empresarial lo pide — sobrevive donde pagan bien.",
      capas: [
        { where: "Nuevo", pick: "OIDC", why: "El SSO moderno: menos dolor que SAML, mismo resultado.", fam: "delegacion", ficha: "oidc" },
        { where: "Legacy exigido", pick: "SSO SAML", why: "XML y certificados. Solo si RRHH/Seguridad del cliente lo requieren.", fam: "identidad", ficha: "saml" }
      ]
    },
    hmac: {
      titulo: "Firmas HMAC con timestamp",
      sub: "El pan de cada webhook: prueba origen e integridad, y el timestamp firmado frena el replay.",
      capas: [
        { where: "Webhook", pick: "Firmas HMAC", why: "Secreto compartido, firma en cada mensaje, timestamp contra replay.", fam: "maquina", ficha: "hmac" }
      ]
    },
    mtls: {
      titulo: "mTLS entre servicios",
      sub: "Ambos lados se prueban con certificados. Fuerte para servicio-a-servicio; apóyate en un service mesh para la PKI.",
      capas: [
        { where: "Servicio ↔ servicio", pick: "mTLS", why: "Identidad en la capa de transporte; rotación automática de certs.", fam: "maquina", ficha: "mtls" }
      ]
    },
    apikeys: {
      titulo: "API keys (con rotación de verdad)",
      sub: "Simple para identificar apps y hacer rate-limiting. Rótalas y nunca las hardcodees.",
      capas: [
        { where: "Identificar apps", pick: "API keys", why: "Trivial de emitir. Si necesitas scopes y vida corta, mejor client credentials.", fam: "maquina", ficha: "api-keys" }
      ]
    }
  };

})(window.GUIA = window.GUIA || {});
