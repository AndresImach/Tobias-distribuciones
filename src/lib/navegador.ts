// Detección best-effort del navegador in-app (el que abren WhatsApp, Instagram, etc.
// adentro de la propia app) para decidir si conviene auto-abrir wa.me.
//
// OJO, esto es un heurístico y no puede ser exacto:
//   - Android: WhatsApp suele usar un WebView, que sí se marca con "; wv)" en el UA
//     (aunque ese mismo marcador lo comparten Instagram, Facebook y compañía), y otras
//     veces abre el link directo en Chrome, donde ya es un navegador común de verdad.
//   - iOS: WhatsApp usa SFSafariViewController, que manda EXACTAMENTE el mismo UA que
//     Safari. Ahí no hay nada que detectar.
//
// Por eso esta función nunca decide sola: se combina con la señal confiable, que es si
// el pedido vino del botón CTA del bot (query param ?pedido=). Y el costo de un falso
// positivo es solo que el cliente toca un botón en vez de que se le abra WhatsApp solo.
const PATRONES_IN_APP = [
  /;\s*wv\)/i, // WebView de Android
  /\bFBAN\b|\bFBAV\b|\bFB_IAB\b/i, // Facebook / Messenger
  /\bInstagram\b/i,
  /\bWhatsApp\b/i,
  /\bLine\//i,
  /\bMicroMessenger\b/i, // WeChat
];

export function pareceNavegadorInApp(userAgent?: string): boolean {
  const ua = userAgent ?? (typeof navigator === "undefined" ? "" : navigator.userAgent);
  if (!ua) return false;
  return PATRONES_IN_APP.some((patron) => patron.test(ua));
}
