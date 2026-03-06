// Sostituisci con il tuo App ID OneSignal
const ONESIGNAL_APP_ID = "https://giacomorodolfi179-pixel.github.io/promemoria/";

window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(async function(OneSignal) {
  await OneSignal.init({
    appId: ONESIGNAL_APP_ID,
    // Percorsi SW: OneSignal gestisce il proprio service worker per le push
    serviceWorkerParam: { scope: '/' },
    serviceWorkerPath: 'OneSignalSDKWorker.js',
    serviceWorkerUpdaterPath: 'OneSignalSDKUpdaterWorker.js',
    safari_web_id: undefined // non serve più il vecchio Safari Web Push ID; iOS usa lo standard Web Push su PWA
  });
});

// **Richiesta permesso**: DEVE avvenire dopo un gesto utente su iOS
window.enablePushPermission = async function() {
  const OneSignal = window.OneSignal;
  try {
    const res = await OneSignal.Notifications.requestPermission();
    console.log('Permesso push:', res);
    if (res === 'granted') alert('Notifiche attivate ✅');
  } catch (e) {
    console.error(e);
    alert('Non è stato possibile attivare le notifiche.');
  }
};

// Pianifica una push alla data di scadenza (lato servizio)
// Opzione 1 (semplice): usa la SCHEDULAZIONE dal pannello OneSignal (manuale)
// Opzione 2 (avanzata): chiama la tua funzione/API che usa OneSignal REST per schedulare
async function schedulePush(item) {
  console.log('Promemoria creato:', item);
  // 👉 Per semplicità iniziale, ti mostro come inviarla dal pannello OneSignal:
  // - Dashboard OneSignal → Messages → New Push → Scheduled → scegli data/ora
  // - Segment: "All Users" o crea un tag utente.
  // Se vuoi, in secondo step ti preparo uno script su Cloud (gratuito) per schedulare automaticamente.
}
``