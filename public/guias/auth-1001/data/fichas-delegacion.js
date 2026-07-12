/* ============================================================================
   data/fichas-delegacion.js — familia 2: delegación (el baile)
   ----------------------------------------------------------------------------
   OAuth incluye device flow y client credentials como VARIANTES dentro de la
   ficha (campo `variantes`), no como fichas propias.
   ========================================================================== */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas["oauth"] = {
    que: "El protocolo para que una app acceda a tus recursos en otro servicio sin conocer tu contraseña. Tú autorizas; el servicio emite un token de acceso acotado. OAuth 2.1 consolidó las buenas prácticas: authorization code + PKCE es el piso, no una opción.",
    secreto: "El authorization server guarda las credenciales del usuario y emite tokens. El cliente nunca ve la contraseña, solo recibe un access token (y, si toca, un refresh token). En clientes públicos (SPA, móvil) el PKCE reemplaza al client secret que no puedes esconder.",
    gana: "Acceso delegado y acotado por scopes: la app tercera solo obtiene lo que autorizaste, nada más. Tokens revocables desde el auth server. El estándar universal para «conéctate con…».",
    paga: "Complejidad y muchas maneras de configurarlo mal. Hay varios flujos y elegir el equivocado es un agujero de seguridad clásico. La UX de consentimiento se puede falsificar si el usuario no mira la barra de direcciones.",
    cuandoNo: "Cuando solo necesitas saber quién es el usuario (login), no acceder a sus recursos: ahí quieres OIDC (folio 08), que es OAuth + identidad. Como sustituto de una sesión propia simple: es sobreingeniería.",
    revoca: "El auth server mantiene el registro de tokens/grants y puede revocarlos (RFC 7009). Si usaste access tokens JWT de vida corta + refresh revocable, matas el refresh y la próxima renovación falla. Misma lección que el folio 02: la revocación de verdad necesita estado en el servidor.",
    parientes: "OIDC (folio 08) se construye literalmente encima. Se confunde constantemente con él: OAuth delega ACCESO, OIDC prueba IDENTIDAD. Dato: el Model Context Protocol (MCP) exige OAuth 2.1 + PKCE — señal de que este es el piso de los protocolos nuevos.",
    variantes: [
      { nombre: "Authorization code + PKCE", nota: "El baile por defecto. El cliente crea un `code_verifier` secreto, manda su hash (`code_challenge`), y al canjear el code prueba el verifier. Aunque intercepten el code, sin el verifier no vale nada.", estrella: true },
      { nombre: "Device flow", nota: "Para dispositivos sin teclado ni navegador (TV, CLI): muestran un código corto y una URL; tú autorizas desde el teléfono. Variante, no ficha aparte." },
      { nombre: "Client credentials", nota: "Máquina a máquina puro, sin usuario: el propio cliente se autentica con sus credenciales y pide un token para sí mismo. Cuando no hay humano que delegue nada." }
    ],
    sims: ["oauth"]
  };

  G.fichas["oidc"] = {
    que: "OpenID Connect: la capa de identidad que le faltaba a OAuth. Añade un ID token (un JWT con claims sobre quién es el usuario) y un endpoint estándar de userinfo. Si OAuth te da un pase de acceso, OIDC te da además una credencial que dice tu nombre.",
    secreto: "Igual que OAuth: el provider (Google, Auth0, tu Keycloak) guarda las credenciales. La novedad es el ID token firmado que el cliente verifica para saber, con confianza, quién entró. Ese token es identidad, no acceso.",
    gana: "«Iniciar sesión con Google/Apple/Microsoft» sin manejar contraseñas. Estándar, interoperable, con discovery automático. Es el SSO de consumo moderno y la respuesta correcta donde antes ibas a SAML.",
    paga: "Hereda la complejidad de OAuth más la suya. Dependes de un tercero para el login (si Google cae, tus usuarios no entran). Confundir el ID token con el access token es un error de seguridad frecuente.",
    cuandoNo: "Para acceso máquina-a-máquina puro (usa client credentials de OAuth). Cuando no quieres depender de un IdP externo y te basta un login local con sesión propia.",
    revoca: "Cortas la sesión en el provider y/o revocas los tokens emitidos. Igual que SAML, la revocación es tan buena como el logout federado que implementes; las sesiones locales del cliente pueden sobrevivir si no las invalidas tú también.",
    parientes: "Es OAuth (folio 07) + identidad — no compiten, se apilan. El reemplazo moderno de SAML (folio 06) para casi todo lo nuevo. La confusión OAuth vs OIDC es de las más comunes del tema: acceso vs. identidad.",
    sims: []
  };

})(window.GUIA = window.GUIA || {});
