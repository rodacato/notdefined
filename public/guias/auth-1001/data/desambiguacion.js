/* ============================================================================
   data/desambiguacion.js — los conceptos que todo el mundo confunde
   ----------------------------------------------------------------------------
   `cols` tiene 2 o 3 columnas. Solo datos.
   ========================================================================== */
(function (G) {
  "use strict";

  G.desambiguaciones = [
    {
      titulo: "Autenticación · vs · Autorización",
      sub: "La madre de todas las confusiones. Ocurren en ese orden y responden preguntas distintas.",
      cols: [
        { nombre: "Autenticación (authn)", def: "«¿Quién eres?» Probar tu identidad: contraseña, passkey, código. Pasa una vez, en la puerta." },
        { nombre: "Autorización (authz)", def: "«¿Qué te dejo hacer?» Decidir permisos una vez que ya sé quién eres. Pasa en cada acción." }
      ],
      veredicto: "Primero authn, luego authz. Un login perfecto sin autorización deja a cualquiera tocar todo; una autorización perfecta sin saber quién eres no significa nada. Las familias 1–3 de este almanaque son authn; la familia 4 es authz."
    },
    {
      titulo: "OAuth · vs · OIDC",
      sub: "Se apilan, no compiten — pero resuelven cosas distintas.",
      cols: [
        { nombre: "OAuth 2.1", def: "Delega ACCESO. «Deja que esta app lea mi calendario.» Te da un access token acotado por scopes. No te dice de forma fiable quién es el usuario." },
        { nombre: "OIDC", def: "Prueba IDENTIDAD. Se construye encima de OAuth y añade un ID token firmado que dice quién entró. Es el «iniciar sesión con…»." }
      ],
      veredicto: "Si solo quieres acceder a recursos, OAuth. Si quieres saber quién es el usuario (login), OIDC. Usar el access token de OAuth como prueba de identidad es un error de seguridad clásico."
    },
    {
      titulo: "JWT · ≠ · sesión",
      sub: "El mito del «stateless» y el problema que nadie ve hasta que necesita revocar.",
      cols: [
        { nombre: "JWT", def: "Un FORMATO de token: datos firmados que verificas sin tocar la BD. Una vez emitido, es válido hasta que caduca — no lo puedes revocar." },
        { nombre: "Sesión", def: "Un CONCEPTO: estado de «este usuario está dentro». Con estado en servidor la revocas al instante; con JWT puro, no." }
      ],
      veredicto: "Un JWT no es una sesión, es un formato que a veces usas para representar una. Como sesión de larga vida, el JWT puro es un cheque al portador que no puedes cancelar. El patrón sano: JWT corto (15–30 min) + refresh token revocable en servidor."
    },
    {
      titulo: "API key · vs · client credentials",
      sub: "Ambos son «una app se autentica a sí misma», pero no son lo mismo.",
      cols: [
        { nombre: "API key", def: "Un secreto estático y plano, sin expiración por defecto. Simple, pero se filtra por todos lados y no trae scopes ni caducidad." },
        { nombre: "Client credentials", def: "Un flujo de OAuth: la app canjea sus credenciales por un access token de vida corta y con scopes. Más ceremonia, más control." }
      ],
      veredicto: "API key para identificar y rate-limitar apps de forma simple. Client credentials cuando quieres tokens de vida corta, scopes y revocación — es la versión adulta del mismo problema."
    },
    {
      titulo: "RBAC · vs · ABAC · vs · ReBAC",
      sub: "Tres formas de responder «¿puede X hacer Y?». Cada una gana cuando la anterior se queda corta.",
      cols: [
        { nombre: "RBAC", def: "Roles → permisos. «Los editores pueden publicar.» Simple y auditable; explota cuando la realidad es más fina que un rol." },
        { nombre: "ABAC", def: "Reglas sobre atributos. «Un médico ve el expediente si está asignado y es horario laboral.» Flexible; difícil de auditar." },
        { nombre: "ReBAC", def: "Relaciones (Zanzibar). «Editas el doc porque eres editor de su carpeta.» Ideal para compartición jerárquica estilo Drive." }
      ],
      veredicto: "Empieza en RBAC — resuelve el 80%. Sube a ABAC cuando el permiso dependa del contexto, y a ReBAC cuando dependa de relaciones con el recurso. No metas infraestructura Zanzibar para tres roles."
    },
    {
      titulo: "Passkey · vs · 2FA",
      sub: "El error más caro: creer que una passkey es «otro factor».",
      cols: [
        { nombre: "2FA (p.ej. TOTP)", def: "Un factor ADICIONAL sobre la contraseña. La contraseña sigue existiendo — y sigue siendo phishable, igual que el código." },
        { nombre: "Passkey", def: "REEMPLAZA la contraseña entera. Una llave privada ligada al origen; nada que teclear, nada que phishear." }
      ],
      veredicto: "Una passkey no le suma un factor a tu login: elimina la contraseña. Por eso resiste phishing donde el 2FA clásico no — no hay secreto que un sitio falso te pueda sacar."
    }
  ];

})(window.GUIA = window.GUIA || {});
