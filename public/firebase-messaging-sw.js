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

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // ✅ BACKGROUND HANDLER (Data Payload Padhne ke liye Updated)
  messaging.onBackgroundMessage((payload) => {
    console.log('[Background Message]', payload);

    // 👇 DATA se title/body nikalo (Notification se nahi)
    const title = payload.data?.title || "Zerimi Update";
    const body = payload.data?.body || "New notification.";
    const link = payload.data?.link || self.location.origin;

    const notificationOptions = {
      body: body,
      icon: '/logo-dark.png', 
      badge: '/logo-dark.png',
      
      requireInteraction: true,
      tag: 'zerimi-notification',
      renotify: true,
      
      data: { url: link }
    };

    return self.registration.showNotification(title, notificationOptions);
  });
}

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