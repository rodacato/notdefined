/* ============================================================================
   data/catalogo.js — FUENTE ÚNICA DE VERDAD
   ----------------------------------------------------------------------------
   Folios, familias, ejes de rating y etiquetas de dolor. Las fichas (en
   data/fichas-*.js) referencian estos ids; nunca redefinen folio ni familia.
   Para agregar un método: añade su entrada aquí y su ficha en el archivo de
   familia correspondiente. Nada más.
   ========================================================================== */
(function (G) {
  "use strict";

  // Las cuatro familias del almanaque. El color es codificación de datos:
  // estable en toda la colección, no decorativo.
  G.familias = [
    { id: "identidad",    nombre: "Identidad del humano",       nota: "Probar que eres tú",              color: "var(--fam-identidad)" },
    { id: "delegacion",   nombre: "Delegación — el baile",       nota: "Dar acceso sin dar la contraseña", color: "var(--fam-delegacion)" },
    { id: "maquina",      nombre: "Máquina a máquina",           nota: "Sin humano en el bucle",          color: "var(--fam-maquina)" },
    { id: "autorizacion", nombre: "Autorización — quién puede qué", nota: "Ya sé quién eres; ¿qué te dejo?", color: "var(--fam-autorizacion)" }
  ];

  // Siete ejes fijos, evaluados 1–7. `inverso: true` = más es peor (se pinta en
  // gris neutro para que no se lea como "mejor").
  G.ejes = [
    { key: "phishing",     label: "Resistencia a phishing" },
    { key: "revocabilidad",label: "Revocabilidad" },
    { key: "complejidad",  label: "Complejidad de implementación", inverso: true },
    { key: "ux",           label: "UX del usuario final" },
    { key: "m2m",          label: "Aptitud máquina-a-máquina" },
    { key: "terceros",     label: "Dependencia de terceros", inverso: true },
    { key: "madurez",      label: "Madurez / soporte" }
  ];

  // Dolores para el catálogo problema-primero. El orden es el de la barra.
  G.dolores = [
    { id: "spa-api",             label: "SPA con API propia" },
    { id: "movil-terceros",      label: "App móvil contra API de terceros" },
    { id: "webhook-partner",     label: "Webhook que me llama un partner" },
    { id: "microservicios",      label: "Microservicios internos" },
    { id: "sso-corp",            label: "SSO corporativo" },
    { id: "eliminar-passwords",  label: "Eliminar contraseñas" },
    { id: "revocar-ya",          label: "Revocar acceso YA" }
  ];

  // Catálogo: folio (único), familia, título, frecuencia y ejes. La descripción
  // corta y los tags de dolor viven aquí; el contenido largo, en las fichas.
  // frecuencia: "nucleo" (★) · "medio" (◐) · "cola" (○)
  G.catalogo = [
    // --- Identidad del humano ---
    { id: "session-cookies", folio: "01", familia: "identidad", titulo: "Session cookies", tipo: "Estado en el servidor", frecuencia: "nucleo",
      desc: "La cookie es un ticket de guardarropa; el abrigo se queda en el servidor.",
      tags: ["spa-api", "revocar-ya"],
      ejes: { phishing: 3, revocabilidad: 7, complejidad: 2, ux: 6, m2m: 1, terceros: 1, madurez: 7 } },

    { id: "jwt-sesion", folio: "02", familia: "identidad", titulo: "JWT como sesión", tipo: "Estado en el cliente", frecuencia: "medio",
      desc: "Firmar un cheque de identidad que no puedes cancelar hasta que caduca.",
      tags: ["spa-api"],
      ejes: { phishing: 3, revocabilidad: 2, complejidad: 4, ux: 6, m2m: 3, terceros: 1, madurez: 6 } },

    { id: "magic-links", folio: "03", familia: "identidad", titulo: "Magic links", tipo: "Posesión del correo", frecuencia: "medio",
      desc: "El correo es la contraseña: recibes un enlace de un solo uso.",
      tags: ["eliminar-passwords"],
      ejes: { phishing: 4, revocabilidad: 6, complejidad: 3, ux: 4, m2m: 1, terceros: 3, madurez: 6 } },

    { id: "totp-2fa", folio: "04", familia: "identidad", titulo: "TOTP / 2FA", tipo: "Segundo factor", frecuencia: "medio",
      desc: "Un código de 6 dígitos que cambia cada 30 s — todavía phishable en tiempo real.",
      tags: [],
      ejes: { phishing: 3, revocabilidad: 6, complejidad: 3, ux: 4, m2m: 1, terceros: 2, madurez: 7 } },

    { id: "passkeys", folio: "05", familia: "identidad", titulo: "Passkeys (WebAuthn)", tipo: "Criptografía ligada al origen", frecuencia: "nucleo",
      desc: "Firma con una llave privada que nunca sale del dispositivo. El phishing no tiene de dónde agarrar.",
      tags: ["eliminar-passwords"],
      ejes: { phishing: 7, revocabilidad: 6, complejidad: 5, ux: 7, m2m: 1, terceros: 3, madurez: 5 } },

    { id: "saml", folio: "06", familia: "identidad", titulo: "SSO SAML", tipo: "Federación empresarial", frecuencia: "medio",
      desc: "XML, certificados y un baile de redirects. Sobrevive donde pagan bien.",
      tags: ["sso-corp"],
      ejes: { phishing: 4, revocabilidad: 5, complejidad: 6, ux: 6, m2m: 2, terceros: 6, madurez: 7 } },

    // --- Delegación (el baile) ---
    { id: "oauth", folio: "07", familia: "delegacion", titulo: "OAuth 2.1", tipo: "Delegación de acceso", frecuencia: "nucleo",
      desc: "Dar a una app acceso a tus cosas sin darle tu contraseña. Code + PKCE de piso.",
      tags: ["movil-terceros", "microservicios"],
      ejes: { phishing: 5, revocabilidad: 6, complejidad: 6, ux: 6, m2m: 6, terceros: 5, madurez: 7 } },

    { id: "oidc", folio: "08", familia: "delegacion", titulo: "OIDC", tipo: "Identidad sobre OAuth", frecuencia: "nucleo",
      desc: "La capa de identidad encima de OAuth. OAuth delega acceso; OIDC prueba quién eres.",
      tags: ["sso-corp", "eliminar-passwords"],
      ejes: { phishing: 5, revocabilidad: 6, complejidad: 6, ux: 6, m2m: 3, terceros: 5, madurez: 6 } },

    // --- Máquina a máquina ---
    { id: "api-keys", folio: "09", familia: "maquina", titulo: "API keys", tipo: "Secreto estático", frecuencia: "medio",
      desc: "Una cadena larga que identifica al que llama. Simple, y se filtra por todos lados.",
      tags: ["microservicios"],
      ejes: { phishing: 2, revocabilidad: 5, complejidad: 1, ux: 3, m2m: 6, terceros: 1, madurez: 7 } },

    { id: "mtls", folio: "10", familia: "maquina", titulo: "mTLS", tipo: "Certificados en ambos lados", frecuencia: "cola",
      desc: "Cliente y servidor se prueban con certificados. Fuerte, pesado, para servicios.",
      tags: ["microservicios"],
      ejes: { phishing: 6, revocabilidad: 4, complejidad: 6, ux: 2, m2m: 7, terceros: 2, madurez: 7 } },

    { id: "hmac", folio: "11", familia: "maquina", titulo: "Firmas HMAC", tipo: "Integridad de mensaje", frecuencia: "medio",
      desc: "Firmar el payload con un secreto compartido. El pan de cada webhook.",
      tags: ["webhook-partner"],
      ejes: { phishing: 5, revocabilidad: 5, complejidad: 3, ux: 2, m2m: 6, terceros: 2, madurez: 6 } },

    // --- Autorización ---
    { id: "rbac", folio: "12", familia: "autorizacion", titulo: "RBAC", tipo: "Roles → permisos", frecuencia: "nucleo",
      desc: "Agrupas permisos en roles y asignas roles a la gente. El default que casi siempre alcanza.",
      tags: ["revocar-ya"],
      ejes: { phishing: 4, revocabilidad: 6, complejidad: 2, ux: 5, m2m: 5, terceros: 1, madurez: 7 } },

    { id: "abac", folio: "13", familia: "autorizacion", titulo: "ABAC", tipo: "Atributos + políticas", frecuencia: "medio",
      desc: "Reglas sobre atributos: quién, qué, cuándo, dónde. Flexible hasta volverse inauditables.",
      tags: [],
      ejes: { phishing: 4, revocabilidad: 6, complejidad: 5, ux: 4, m2m: 6, terceros: 3, madurez: 6 } },

    { id: "rebac", folio: "14", familia: "autorizacion", titulo: "ReBAC", tipo: "Relaciones (estilo Zanzibar)", frecuencia: "cola",
      desc: "El permiso se deriva de relaciones: «eres editor de este doc porque estás en la carpeta».",
      tags: [],
      ejes: { phishing: 4, revocabilidad: 6, complejidad: 6, ux: 5, m2m: 6, terceros: 4, madurez: 5 } }
  ];

  // --- Índices derivados (una sola construcción, todos los consumen) ---
  G.porId = {};
  G.catalogo.forEach(function (m) { G.porId[m.id] = m; });

  G.familiaPorId = {};
  G.familias.forEach(function (f) { G.familiaPorId[f.id] = f; });

  G.dolorPorId = {};
  G.dolores.forEach(function (d) { G.dolorPorId[d.id] = d; });

  // Glifo de complejidad ◆◆◆ derivado del eje (no se guarda por separado).
  G.complejidadGlyph = function (n) {
    var llenos = n <= 3 ? 1 : n <= 5 ? 2 : 3;
    return { llenos: llenos, vacios: 3 - llenos };
  };

  // Glifo de frecuencia (★ núcleo / ◐ uso medio / ○ cola rara).
  G.frecuenciaGlyph = function (f) {
    return f === "nucleo" ? "★" : f === "medio" ? "◐" : "○";
  };
  G.frecuenciaLabel = function (f) {
    return f === "nucleo" ? "Núcleo — lo verás siempre" : f === "medio" ? "Uso medio" : "Cola rara";
  };

})(window.GUIA = window.GUIA || {});
