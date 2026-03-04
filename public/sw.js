/**
 * Minimal service worker for PWA installability.
 * Enables "Add to Home Screen" in Chrome on Android.
 * No fetch interception - all requests go to the network.
 */
self.addEventListener("install", function () {
  self.skipWaiting();
});
self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});
