/* ============================================================================
   data/fichas-maquina.js — familia 3: máquina a máquina
   ========================================================================== */
(function (G) {
  "use strict";
  G.fichas = G.fichas || {};

  G.fichas["api-keys"] = {
    que: "Una cadena larga y secreta que identifica al que llama a tu API. Se manda en un header en cada request. Simple hasta lo primitivo: sin ceremonia ni caducidad por defecto — la única pregunta es «¿conoces el secreto?».",
    secreto: "El cliente guarda la key y la manda tal cual; tú guardas su hash para compararla. Ese «tal cual» es el problema: viaja completa en cada llamada y termina en logs, repos de git, historiales de shell y capturas de pantalla.",
    gana: "Trivial de emitir y de usar. Perfecta para identificar aplicaciones (no personas) y para rate-limiting por cliente. Cero infraestructura.",
    paga: "Es un secreto estático de larga vida: si se filtra, sirve hasta que alguien la note y la rote. No prueba integridad del mensaje ni frescura — solo posesión. Cero granularidad más allá de «esta app sí, esta no».",
    cuandoNo: "Para autorización fina por usuario (usa OAuth). Para canales donde el replay importa (usa HMAC con timestamp). Para acceso de alto valor sin rotación ni monitoreo.",
    revoca: "Buena en teoría, floja en la práctica: borras o rotas la key en tu lado y muere al instante. El problema real es operativo — las keys se hardcodean y rotarlas rompe integraciones, así que la gente evita hacerlo.",
    parientes: "Se confunde con client credentials de OAuth (folio 07): ambos son «la app se autentica a sí misma», pero client credentials te da tokens de vida corta y scopes; la API key es un secreto plano y eterno.",
    sims: []
  };

  G.fichas["mtls"] = {
    que: "TLS mutuo: no solo el servidor prueba su identidad con un certificado (el HTTPS de siempre), también el cliente. Ambos extremos se autentican criptográficamente antes de intercambiar un solo byte de aplicación.",
    secreto: "Cada lado tiene su llave privada y un certificado firmado por una CA en la que ambos confían. Las llaves privadas nunca viajan; solo se intercambian y validan los certificados durante el handshake TLS.",
    gana: "Autenticación fortísima y resistente a phishing en ambos sentidos. Ideal para servicio-a-servicio en redes de confianza cero. La identidad va en la capa de transporte, transparente para la aplicación.",
    paga: "PKI es pesada: emitir, distribuir, renovar y rotar certificados a escala es un proyecto en sí. Para humanos es UX inviable. La revocación (CRL/OCSP) es notoriamente incómoda.",
    cuandoNo: "Para clientes que son personas con navegadores — no es realista. Cuando no tienes una PKI ni ganas de operarla. Para APIs públicas de terceros donde no controlas al cliente.",
    revoca: "El talón de Aquiles: revocar un certificado antes de que caduque exige CRL u OCSP, que muchos clientes no chequean bien. En la práctica se compensa con certificados de vida muy corta y rotación automática (estilo SPIFFE/service mesh).",
    parientes: "Convive con service meshes (Istio, Linkerd), que lo automatizan. Se confunde con «HTTPS normal»: ese es TLS de un lado; mTLS añade el certificado del cliente.",
    sims: []
  };

  G.fichas["hmac"] = {
    que: "Firmar cada mensaje con un secreto compartido para probar que viene de quien dice y que nadie lo alteró. El pan de cada día de los webhooks: el emisor firma el payload, tú recalculas la firma y comparas.",
    secreto: "Un secreto compartido que ambos lados conocen de antemano (te lo da el proveedor al configurar el webhook). Nunca viaja en el request — lo que viaja es la firma (un hash del payload + el secreto). Compara firmas en tiempo constante.",
    gana: "Prueba integridad y origen sin cifrar el payload ni montar PKI. Barato y sin dependencias que operar. Con un timestamp firmado, frena ataques de replay.",
    paga: "Secreto compartido: si se filtra, el atacante puede firmar mensajes válidos. No da confidencialidad (el payload va en claro salvo que uses TLS encima, que sí o sí debes). La rotación del secreto requiere coordinación con el emisor.",
    cuandoNo: "Para autenticar usuarios (es integridad de mensaje, no identidad de persona). Cuando necesitas no-repudio fuerte: ahí quieres firmas asimétricas, no un secreto compartido.",
    revoca: "Rotas el secreto compartido en ambos lados y las firmas viejas dejan de validar. Muchos proveedores soportan dos secretos activos a la vez para rotar sin downtime.",
    parientes: "Primo de JWT (folio 02), que por dentro suele ser HMAC (HS256). Se confunde con cifrado: HMAC no oculta nada, solo prueba integridad. El timestamp + firma es lo que mata el replay. Es la contraparte exacta de la ficha de Webhooks del Tomo IV (APIs): la misma firma, contada del otro lado del cable.",
    sims: ["hmac"]
  };

})(window.GUIA = window.GUIA || {});
