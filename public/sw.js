self.addEventListener('push', (event) => {
  if (!event.data) return
  const { title, body, icon } = event.data.json()
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || '/icon',
      badge: '/icon',
      vibrate: [100, 50, 100],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url && 'focus' in c) return c.focus()
      }
      return clients.openWindow('/')
    })
  )
})
