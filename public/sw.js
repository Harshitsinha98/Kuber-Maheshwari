/* Kuber Maheshwari service worker: keeps tickets available offline (venues often have no network). */
const STATIC = "km-static-v2";
const TICKETS = "km-tickets-v1";
const OFFLINE = "/offline.html";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC).then((c) => c.addAll([OFFLINE, "/images/brand/km-logo.png"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![STATIC, TICKETS].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Pages whose last good copy is kept on the phone.
const isTicketPage = (p) => p === "/my-tickets" || /^\/(bookings|p|t)\/[^/]+$/.test(p);

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;

  // Build assets & fonts are content-hashed: cache forever once fetched.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/images/brand/")) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone(); // clone before the page starts reading the body
              e.waitUntil(caches.open(STATIC).then((c) => c.put(req, copy)));
            }
            return res;
          })
      )
    );
    return;
  }

  if (req.mode !== "navigate") return;

  if (isTicketPage(url.pathname)) {
    // Network first (fresh check-in status), fall back to the saved copy when offline.
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && !res.redirected) {
            const copy = res.clone(); // clone before the page starts reading the body
            e.waitUntil(caches.open(TICKETS).then((c) => c.put(req, copy)));
          }
          return res;
        })
        .catch(() => caches.match(req, { ignoreVary: true }).then((hit) => hit || caches.match(OFFLINE)))
    );
    return;
  }

  e.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
});

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "clear-tickets") e.waitUntil(caches.delete(TICKETS));
});
