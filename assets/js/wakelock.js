// Wake Lock — keeps the screen on while viewing a recipe
(function () {
  'use strict';

  if (!('wakeLock' in navigator)) return;

  var wakeLock = null;

  async function requestWakeLock() {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', function () {
        wakeLock = null;
      });
    } catch (e) { /* user denied or low battery */ }
  }

  // Acquire on load if this is a recipe page
  document.addEventListener('DOMContentLoaded', function () {
    if (!document.querySelector('.recipe-meta-card')) return;
    requestWakeLock();
  });

  // Re-acquire when returning to the tab
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && !wakeLock && document.querySelector('.recipe-meta-card')) {
      requestWakeLock();
    }
  });
})();
