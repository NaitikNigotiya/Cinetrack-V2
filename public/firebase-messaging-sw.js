/* eslint-disable no-undef */
// CineTrack v2 Firebase Messaging Background Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'placeholder-sw-key',
  authDomain: 'cinetrack-v2.firebaseapp.com',
  projectId: 'cinetrack-v2',
  storageBucket: 'cinetrack-v2.appspot.com',
  messagingSenderId: '100000000000',
  appId: '1:100000000000:web:cinetrackv2',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || payload.data?.title || 'CineTrack'
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'New update available!',
    icon: payload.notification?.icon || payload.data?.icon || '/pwa-192x192.svg',
    badge: '/pwa-192x192.svg',
    data: {
      actionUrl: payload.data?.actionUrl || payload.data?.url || '/',
      ...payload.data,
    },
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.actionUrl || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and navigate
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus()
          if ('navigate' in client && targetUrl !== '/') {
            client.navigate(targetUrl)
          }
          return
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
