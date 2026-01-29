importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// URL se keys nikalna
const getQueryParam = (name) => {
  try {
    const urlParams = new URLSearchParams(self.location.search);
    return urlParams.get(name);
  } catch (e) { return null; }
};

const firebaseConfig = {
  apiKey: getQueryParam('apiKey'),
  authDomain: getQueryParam('authDomain'),
  projectId: getQueryParam('projectId'),
  storageBucket: getQueryParam('storageBucket'),
  messagingSenderId: getQueryParam('messagingSenderId'),
  appId: getQueryParam('appId'),
};

// ... upar imports aur config same rahega ...

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // ✅ BACKGROUND HANDLER (Updated for Android Icons)
  messaging.onBackgroundMessage((payload) => {
    console.log('[Background Message]', payload);

    const title = payload.data?.title || "Zerimi Update";
    const body = payload.data?.body || "New notification.";
    const link = payload.data?.link || self.location.origin;
    
    // Images nikalo
    // 1. Bada wala rangeen icon (Notification shade ke liye)
    const largeIcon = payload.data?.icon || '/logo-dark.png';
    // 2. Chhota wala safed icon (Status bar ke liye) - Fallback bhi white hi rakhein
    const smallSilhouetteIcon = payload.data?.smallIcon || '/notification-icon-white.png';

    const notificationOptions = {
      body: body,
      
      // 👇 ANDROID SPECIAL SETTINGS
      icon: smallSilhouetteIcon,  // Status bar icon (Must be transparent/white)
      badge: smallSilhouetteIcon, // Small icon next to app name
      image: largeIcon,           // Big hero image in expanded notification
      
      // Baaki settings same
      requireInteraction: true,
      tag: 'zerimi-notification',
      renotify: true,
      data: { url: link }
    };

    return self.registration.showNotification(title, notificationOptions);
  });
}

// ... niche click handler same rahega ...

// ✅ NOTIFICATION CLICK HANDLER (Website Kholne ke liye)
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  // Click karne par naya tab kholo ya purana focus karo
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(self.location.origin);
      }
    })
  );
});