// ═══════════════════════════════════════════════════════════════
// SERVICE WORKER — sw.js
//
// What is a Service Worker?
// It's a JS file the browser installs separately from your page.
// It runs in the background, even when the tab is closed.
//
// What does this one do?
// 1. Receives scheduled notifications from the main app
// 2. Fires the browser notification at the right time
// 3. When clicked, opens/focuses your app
// ═══════════════════════════════════════════════════════════════

let scheduledNotifications = [];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

// Receive schedule from the main app
self.addEventListener('message', event => {
  if (!event.data) return;
  if (event.data.type === 'SCHEDULE') {
    scheduledNotifications = event.data.notifications || [];
  }
  if (event.data.type === 'CHECK_NOW') {
    checkAndFire();
  }
});

// When user clicks a notification, open/focus the app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(clients => {
      for (const c of clients) {
        if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});

// Fire any notifications whose scheduled time has arrived
function checkAndFire() {
  const now = Date.now();
  scheduledNotifications.forEach(n => {
    const diff = now - n.fireAt;
    if (diff >= 0 && diff < 10 * 60 * 1000) { // within 10-min window
      self.registration.showNotification(n.title, {
        body: n.body,
        tag: n.tag,
        requireInteraction: true,
        icon: './icon.png'
      });
    }
  });
}

self.addEventListener('sync', event => {
  if (event.tag === 'check-notifications') event.waitUntil(checkAndFire());
});

self.addEventListener('push', event => {
  if (!event.data) return;
  const d = event.data.json();
  event.waitUntil(
    self.registration.showNotification(d.title || 'Debt Tracker', {
      body: d.body || '', tag: d.tag || 'push', requireInteraction: true, icon: './icon.png'
    })
  );
});
