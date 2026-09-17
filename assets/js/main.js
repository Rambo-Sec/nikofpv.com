(function () {
  "use strict";

  var cfg = window.NIKO_CONFIG || {};

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch (err) { return ""; }
  }

  function watchUrl(videoId) {
    return "https://www.youtube.com/watch?v=" + videoId;
  }

  function fallback(message) {
    var latestEl = qs("#latest-flight");
    var gridEl = qs("#flights-grid");
    if (latestEl) {
      latestEl.innerHTML = "";
      var p = document.createElement("p");
      p.className = "loading-line";
      var link = document.createElement("a");
      link.href = cfg.channelUrl || "https://www.youtube.com";
      link.style.color = "var(--teal)";
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "watch on YouTube";
      p.textContent = message + " \u2014 ";
      p.appendChild(link);
      latestEl.appendChild(p);
    }
    if (gridEl) gridEl.innerHTML = "";
  }

  function renderLatest(item) {
    var latestEl = qs("#latest-flight");
    var videoId = item.snippet.resourceId.videoId;
    var title = item.snippet.title;
    var thumbs = item.snippet.thumbnails || {};
    var thumb = (thumbs.high || thumbs.medium || thumbs.default || {}).url || "";

    latestEl.innerHTML = "";

    var a = document.createElement("a");
    a.className = "latest-flight-link";
    a.href = watchUrl(videoId);
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", "Watch on YouTube: " + title);

    var thumbWrap = document.createElement("div");
    thumbWrap.className = "latest-flight-thumb";
    if (thumb) thumbWrap.style.backgroundImage = 'url("' + thumb + '")';

    var badge = document.createElement("div");
    badge.className = "play-badge";
    var badgeInner = document.createElement("span");
    badgeInner.innerHTML = "\u25B6 Watch on YouTube";
    badge.appendChild(badgeInner);
    thumbWrap.appendChild(badge);

    a.appendChild(thumbWrap);

    var caption = document.createElement("p");
    caption.className = "latest-flight-title";
    caption.textContent = title;
    a.appendChild(caption);

    latestEl.appendChild(a);
  }

  function renderGrid(items) {
    var gridEl = qs("#flights-grid");
    gridEl.innerHTML = "";
    if (!items.length) {
      var p = document.createElement("p");
      p.className = "loading-line";
      p.textContent = "(only one video so far \u2014 more on the way)";
      gridEl.appendChild(p);
      return;
    }
    items.forEach(function (it) {
      var videoId = it.snippet.resourceId.videoId;
      var title = it.snippet.title;
      var thumbs = it.snippet.thumbnails || {};
      var thumb = (thumbs.medium || thumbs.default || {}).url || "";

      var a = document.createElement("a");
      a.className = "flight-card";
      a.href = watchUrl(videoId);
      a.target = "_blank";
      a.rel = "noopener";

      var img = document.createElement("img");
      img.src = thumb;
      img.alt = "";
      img.loading = "lazy";
      a.appendChild(img);

      var body = document.createElement("div");
      body.className = "flight-card-body";

      var t = document.createElement("p");
      t.className = "flight-card-title";
      t.textContent = title;

      var d = document.createElement("p");
      d.className = "flight-card-date";
      d.textContent = formatDate(it.snippet.publishedAt);

      body.appendChild(t);
      body.appendChild(d);
      a.appendChild(body);

      gridEl.appendChild(a);
    });
  }

  function loadVideos() {
    if (!cfg.youtubeApiKey || cfg.youtubeApiKey === "YOUR_YOUTUBE_API_KEY_HERE" || !cfg.uploadsPlaylistId) {
      fallback("Video feed isn't configured yet");
      return;
    }

    var url = "https://www.googleapis.com/youtube/v3/playlistItems"
      + "?part=snippet&maxResults=7"
      + "&playlistId=" + encodeURIComponent(cfg.uploadsPlaylistId)
      + "&key=" + encodeURIComponent(cfg.youtubeApiKey);

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("YouTube API responded " + res.status);
        return res.json();
      })
      .then(function (data) {
        var items = (data.items || []).filter(function (it) { return it.snippet && it.snippet.resourceId; });
        if (!items.length) throw new Error("No videos in feed");
        renderLatest(items[0]);
        renderGrid(items.slice(1));
      })
      .catch(function (err) {
        console.warn("Niko FPV: video feed fallback \u2014", err);
        fallback("Couldn't reach the video feed");
      });
  }

  document.addEventListener("DOMContentLoaded", loadVideos);
})();
