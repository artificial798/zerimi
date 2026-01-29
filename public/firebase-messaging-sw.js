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

  // ✅ BACKGROUND HANDLER (Jab Tab Band Ho)
  messaging.onBackgroundMessage((payload) => {
    console.log('[Background Message] Received:', payload);

    const notificationTitle = payload.notification?.title || "Zerimi Update";
    const notificationOptions = {
      body: payload.notification?.body || "Check out new offers!",
      icon: '/logo-dark.png', // Make sure ye image public folder me ho
      
      // 👇 Yeh zaroori settings hain background ke liye
      requireInteraction: true, // User jab tak close na kare, tab tak dikhega
      tag: 'zerimi-notification', // Messages group karega
      renotify: true, // Har message par sound bajega
      
      // Click karne par website khulni chahiye
      data: {
        url: self.location.origin 
      }
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
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