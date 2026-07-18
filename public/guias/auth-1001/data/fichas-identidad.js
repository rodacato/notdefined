/* ============================================================================
   data/fichas-identidad.js — familia 1: identidad del humano
   ----------------------------------------------------------------------------
   Contenido largo de cada ficha. La mecánica NO vive aquí: solo el guión.
   Campos: que · secreto · gana · paga · cuandoNo · revoca · parientes · sims.
   `sims` referencia ids de data/simulaciones.js.
   ========================================================================== */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas["session-cookies"] = {
    que: "El servidor guarda tu sesión y te manda una cookie con un id opaco. En cada request el navegador reenvía la cookie y el servidor busca quién eres. El estado vive en el servidor; la cookie solo es el ticket.",
    secreto: "El servidor. La cookie no contiene datos, solo un id aleatorio; el mapa id → usuario vive en tu almacén (Redis, Postgres, memoria). Marca la cookie HttpOnly + Secure + SameSite para que el JS del navegador ni la vea.",
    gana: "Revocación instantánea y control total: borras la fila y la sesión murió, en ese mismo request. Escala a millones de usuarios activos con un cache en memoria delante. El modelo mental más simple que existe.",
    paga: "Estado que alguien tiene que guardar y sincronizar entre nodos. Un request extra al store por cada llamada (mitigable con cache). No cruza dominios fácil, así que sufre para APIs de terceros.",
    cuandoNo: "Cuando la API la consumen clientes que no son navegadores (móvil nativo, servicios, terceros): ahí las cookies estorban más de lo que ayudan. Tampoco para SSO entre dominios distintos.",
    revoca: "Trivial y es su mejor carta: DELETE de la fila de sesión, o marcarla inválida en el store. Efecto inmediato en el siguiente request. Puedes cerrar «todas las demás sesiones» de un usuario de un solo query. Esto es lo que el JWT puro no puede hacer.",
    parientes: "Se confunde con «JWT como sesión» (folio 02): son la misma necesidad resuelta al revés — estado en el servidor vs. estado en el cliente. El patrón 2026 usa sesiones para la web clásica y deja el JWT corto para la superficie de API.",
    sims: ["logout"],
    notaCampo: {
      label: "del cuaderno",
      texto: "En un backend Rails con Redis y datos bajo HIPAA, la sesión server-side fue justo lo que salvó las auditorías: poder responder <em>«revoca este acceso ahora»</em> y que ahora signifique <em>ahora</em>, no «en 15 minutos cuando caduque el token», no es un lujo — es un requisito de cumplimiento."
    }
  };

  G.fichas["jwt-sesion"] = {
    que: "Metes la identidad del usuario dentro de un token firmado (JWT) y se lo das al cliente. En cada request el cliente lo manda y tú verificas la firma — sin tocar ninguna base de datos. Suena perfecto hasta que necesitas revocar.",
    secreto: "El cliente guarda el token; tú guardas solo la llave de firma. El payload es legible por cualquiera (Base64, no cifrado): nunca metas secretos ahí. La confianza viene de la firma, no del contenido.",
    gana: "Cero lecturas de base de datos para autenticar: verificas la firma y listo. Cruza servicios y dominios sin estado compartido. Encaja natural con APIs y arquitecturas distribuidas.",
    paga: "No puedes revocarlo. Una vez firmado, ese token es válido hasta que caduca, pase lo que pase. Si lo robaron, el atacante lo usa hasta el último segundo de vida. El «stateless» que tanto se presume casi nunca es el cuello de botella real que creías resolver.",
    cuandoNo: "Como reemplazo directo de una sesión con vidas largas (horas, días). Si necesitas logout instantáneo, baneos o «cerrar todas las sesiones», el JWT puro te miente. Un JWT de 8 horas es un cheque al portador de 8 horas.",
    revoca: "El pedo es que no se revoca de verdad. Tus opciones son parches — TTL cortísimo (15–30 min) para acotar la ventana, o una denylist de tokens quemados… que es reintroducir el estado en servidor que querías eliminar. El patrón sano: access token JWT corto + refresh token revocable guardado server-side.",
    parientes: "El eterno debate «session vs JWT» ya tiene respuesta madura: no es o uno u otro. Se confunde con OAuth (folio 07), que a menudo emite JWTs pero es otra cosa: OAuth es el protocolo de delegación; el JWT es solo un formato de token.",
    sims: ["logout"]
  };

  G.fichas["magic-links"] = {
    que: "En vez de contraseña, el usuario mete su correo y le mandas un enlace de un solo uso con un token corto. Al abrirlo, queda dentro. La posesión del buzón es la prueba de identidad.",
    secreto: "Tú, server-side: guardas el token (hasheado) con su expiración y una marca de «ya usado». El correo es el canal, no el secreto. El enlace debe morir al primer uso y en pocos minutos.",
    gana: "Cero contraseñas que gestionar, resetear o filtrar. Onboarding sin fricción de registro. Barato de implementar sobre el correo que ya tienes.",
    paga: "La seguridad hereda la del correo del usuario: si le hackean el buzón, entran. Fricción de contexto — hay que salir de tu app, abrir el correo, volver. Deliverability: si el mail cae en spam, no hay login.",
    cuandoNo: "Para cuentas de alto valor sin un segundo factor detrás. Para flujos donde el cambio de contexto al correo mata la conversión. Para acceso máquina-a-máquina, obviamente.",
    revoca: "Fácil a nivel de enlace: caduca solo (TTL corto) y se invalida al primer uso. La sesión que crea después se revoca según el mecanismo de sesión que uses detrás (cookie o token).",
    parientes: "Primo de los OTP por correo/SMS. Se confunde con passwordless «de verdad»: los magic links son passwordless, sí, pero no resisten phishing como las passkeys — al usuario lo pueden inducir a reenviar el enlace o el código al atacante, o el flujo puede haberlo iniciado el atacante mismo.",
    sims: []
  };

  G.fichas["totp-2fa"] = {
    que: "Un segundo factor: además de la contraseña, el usuario prueba que posee un dispositivo generando un código de 6 dígitos que cambia cada 30 segundos. Tú y su app comparten una semilla y calculan el mismo número.",
    secreto: "Un secreto compartido (la semilla TOTP) que se guarda en tu servidor y en la app del usuario (Authy, Google Authenticator). Se intercambia una vez, al configurar, vía QR. Nunca viaja después.",
    gana: "Sube muchísimo el costo de un ataque de credenciales robadas: la contraseña sola ya no basta. Funciona offline, sin SMS, sin dependencia de red del operador.",
    paga: "Sigue siendo phishable: un sitio falso en tiempo real te pide el código y lo reenvía antes de que caduque. Fricción real en cada login. La recuperación (perdí el teléfono) es un dolor de cabeza operativo.",
    cuandoNo: "Como tu única defensa creyendo que resiste phishing — no lo hace. Si puedes ir directo a passkeys, el TOTP es un escalón intermedio que quizá te saltes.",
    revoca: "Rotas o borras la semilla del usuario en tu servidor; su app deja de servir. En la práctica lo combinas con códigos de respaldo de un solo uso para no dejar a nadie fuera.",
    parientes: "Se confunde con las passkeys (folio 05): la gente cree que una passkey es «otro 2FA». No lo es — la passkey reemplaza a la contraseña entera, no le suma un factor. TOTP es un factor extra; passkey es el factor.",
    sims: []
  };

  G.fichas["passkeys"] = {
    que: "Criptografía de clave pública en la puerta de entrada. En el registro, el dispositivo genera un par de llaves; la privada nunca sale de ahí. Para entrar, firmas un reto del servidor con biometría. No hay contraseña que robar ni que teclear.",
    secreto: "La llave privada vive en el dispositivo (Secure Enclave, TPM) o en tu gestor de contraseñas sincronizado. El servidor solo guarda la llave pública. No hay un secreto compartido que filtrar — ese es el punto.",
    gana: "Resistencia a phishing por diseño: la llave está ligada al origen (dominio) donde se creó, así que un sitio falso simplemente no puede pedir la firma correcta. UX de un toque con Face ID / huella. Es la ficha estrella de 2026.",
    paga: "La recuperación de cuenta sigue siendo el hueso duro (¿qué pasa si pierdes todos tus dispositivos?). La ceremonia WebAuthn tiene su curva. Dependes del ecosistema de passkeys del sistema operativo y navegador.",
    cuandoNo: "Como tu único método sin un plan de recuperación sólido — dejarías gente fuera. En entornos donde no controlas el hardware/navegador del usuario y no puedes garantizar soporte.",
    revoca: "El servidor borra el credential id de esa passkey y esa llave deja de servir para entrar. El usuario puede tener varias passkeys (una por dispositivo) y revocar solo la del teléfono perdido, dejando vivas las demás.",
    parientes: "FIDO2/WebAuthn es el estándar debajo. Se confunde con TOTP/2FA (folio 04): la passkey no es un segundo factor, es el reemplazo del password. También se confunde con «biometría»: la huella no viaja a ningún lado, solo desbloquea la llave local.",
    sims: ["passkey"]
  };

  G.fichas["saml"] = {
    que: "El estándar veterano de SSO empresarial. Tu app (el SP, Service Provider) confía en un proveedor de identidad central (el IdP) que ya autenticó al empleado. Todo se coordina con documentos XML firmados que rebotan por el navegador.",
    secreto: "El IdP guarda las credenciales; tu SP nunca las ve. La confianza se ancla en certificados X.509 intercambiados al configurar la federación (los «metadata»). Las aserciones SAML van firmadas con esos certificados.",
    gana: "Un solo login corporativo para todo. Es lo que Recursos Humanos y Seguridad de las empresas grandes esperan y saben auditar. Décadas de madurez y herramientas.",
    paga: "XML, certificados que caducan, metadata que hay que sincronizar — es doloroso de implementar y de depurar. El Single Logout (cerrar sesión en todos los SP a la vez) es notoriamente frágil. Nadie diseña algo nuevo en SAML por gusto.",
    cuandoNo: "Para consumo (usuarios normales, no empleados): ahí OIDC es mejor. Para apps móviles nativas: SAML vive en el navegador y encaja mal. Para greenfield sin requisito empresarial: usa OIDC.",
    revoca: "Centralizada en el IdP: desactivas al empleado ahí y pierde el acceso a todo (esa es la gracia del SSO). El problema es la latencia — las sesiones ya establecidas en cada SP pueden sobrevivir hasta que expiran, porque el Single Logout falla seguido.",
    parientes: "El primo enterprise de OIDC (folio 08): misma idea (federación de identidad), distinta era y sintaxis. Comparte destino con SOAP — legacy que sobrevive donde hay contratos y dinero de por medio.",
    sims: ["saml"]
  };

})(window.GUIA = window.GUIA || {});
