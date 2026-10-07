/* Keep media playback in sync with visible slides and fragments. */
(() => {
  const wrapper = document.querySelector('.reveal');
  if (!wrapper) return;

  function syncVideos() {
    const slide = window.Reveal?.getCurrentSlide();
    wrapper.querySelectorAll('video').forEach(video => {
      const visible = !document.hidden && slide?.contains(video) &&
        !video.closest('.fragment:not(.visible)');
      if (visible) {
        video.playsInline = true;
        video.play().catch(() => { /* Manual playback remains available. */ });
      } else {
        video.pause();
      }
    });
  }

  ['ready', 'slidechanged', 'fragmentshown', 'fragmenthidden'].forEach(event => {
    wrapper.addEventListener(event, syncVideos);
  });
  document.addEventListener('visibilitychange', syncVideos);
  syncVideos();
})();
