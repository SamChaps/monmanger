// Favorites — localStorage-backed recipe bookmarking
(function () {
  'use strict';

  var STORAGE_KEY = 'favorites';

  function getFavorites() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveFavorites(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) { /* storage unavailable */ }
  }

  function isFavorite(url) {
    return getFavorites().indexOf(url) !== -1;
  }

  function addFavorite(url) {
    var favs = getFavorites();
    if (favs.indexOf(url) === -1) {
      favs.push(url);
      saveFavorites(favs);
    }
  }

  function removeFavorite(url) {
    var favs = getFavorites();
    var idx = favs.indexOf(url);
    if (idx !== -1) {
      favs.splice(idx, 1);
      saveFavorites(favs);
    }
  }

  // Toggle favorite (from recipe page button)
  function toggle(btn) {
    var url = btn.getAttribute('data-url');
    if (!url) return;

    if (isFavorite(url)) {
      removeFavorite(url);
    } else {
      addFavorite(url);
    }

    syncPageStar();

    // If on homepage, refresh the user favorites section
    var grid = document.getElementById('user-favorites-grid');
    if (grid) renderUserFavorites();
  }

  // Sync the recipe page star button
  function syncPageStar() {
    var btn = document.querySelector('.fav-star--page[data-url]');
    if (!btn) return;
    var url = btn.getAttribute('data-url');
    var icon = btn.querySelector('i');
    if (!icon) return;
    if (isFavorite(url)) {
      icon.className = 'fas fa-star';
      btn.classList.add('fav-star--active');
    } else {
      icon.className = 'far fa-star';
      btn.classList.remove('fav-star--active');
    }
  }

  // Build a recipe card HTML from a store entry
  function buildCard(entry) {
    var isFr = document.documentElement.classList.contains('lang-fr');
    var title = isFr ? (entry.title_fr || entry.title) : entry.title;
    var titleFr = entry.title_fr || entry.title;
    var excerptEn = (entry.excerpt || '').split(/\s+/).slice(0, 20).join(' ');
    var excerptFr = (entry.excerpt_fr || '').split(/\s+/).slice(0, 20).join(' ');

    var html = '<article class="recipe-card" onclick="window.location=\'' + entry.url + '\'" style="cursor:pointer;">';

    if (entry.teaser) {
      html += '<div class="recipe-card__image-link">';
      html += '<img src="' + entry.teaser + '" alt="' + escapeAttr(title) + '" class="recipe-card__image" loading="lazy">';
      html += '</div>';
    }

    html += '<div class="recipe-card__body">';
    html += '<h2 class="recipe-card__title"><a href="' + entry.url + '">';
    html += '<span class="lang-en-content">' + escapeHtml(entry.title) + '</span>';
    html += '<span class="lang-fr-content">' + escapeHtml(titleFr) + '</span>';
    html += '</a></h2>';

    if (excerptEn || excerptFr) {
      html += '<p class="recipe-card__excerpt">';
      html += '<span class="lang-en-content">' + escapeHtml(excerptEn) + '</span>';
      html += '<span class="lang-fr-content">' + escapeHtml(excerptFr) + '</span>';
      html += '</p>';
    }

    html += '<div class="recipe-card__meta">';
    if (entry.total_time) {
      html += '<span><i class="fas fa-clock" aria-hidden="true"></i> ' + escapeHtml(entry.total_time) + '</span>';
    }
    if (entry.difficulty) {
      html += '<span><i class="fas fa-signal" aria-hidden="true"></i> ';
      html += '<span class="lang-en-content">' + escapeHtml(entry.difficulty) + '</span>';
      if (entry.difficulty_fr) {
        html += '<span class="lang-fr-content">' + escapeHtml(entry.difficulty_fr) + '</span>';
      }
      html += '</span>';
    }
    html += '</div>';

    if (entry.tags && entry.tags.length > 0) {
      html += '<div class="recipe-card__tags">';
      var tagsFr = entry.tags_fr || [];
      var limit = Math.min(entry.tags.length, 4);
      for (var i = 0; i < limit; i++) {
        var tagSlug = entry.tags[i].toLowerCase().replace(/\s+/g, '-');
        var tagFr = tagsFr[i] || entry.tags[i];
        html += '<a href="/tags/' + tagSlug + '/" class="recipe-tag recipe-tag--link" onclick="event.stopPropagation();">';
        html += '<span class="lang-en-content">' + escapeHtml(entry.tags[i]) + '</span>';
        html += '<span class="lang-fr-content">' + escapeHtml(tagFr) + '</span>';
        html += '</a>';
      }
      html += '</div>';
    }

    html += '</div></article>';
    return html;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, '&#39;');
  }

  // Render the "Your Favorites" section on the homepage
  function renderUserFavorites() {
    var emptyBanner = document.getElementById('favorites-empty');
    var grid = document.getElementById('user-favorites-grid');
    var countEl = document.getElementById('user-favorites-count');
    if (!grid) return;

    var favs = getFavorites();
    var store = window.store || [];

    if (favs.length === 0) {
      grid.style.display = 'none';
      if (emptyBanner) emptyBanner.style.display = '';
      if (countEl) countEl.textContent = '';
      return;
    }

    grid.style.display = '';
    if (emptyBanner) emptyBanner.style.display = 'none';
    if (countEl) countEl.textContent = '(' + favs.length + ')';

    var cards = [];
    for (var i = 0; i < favs.length; i++) {
      for (var j = 0; j < store.length; j++) {
        if (store[j].url === favs[i]) {
          cards.push(buildCard(store[j]));
          break;
        }
      }
    }

    grid.innerHTML = cards.join('');
  }

  // Init on DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    syncPageStar();
    renderUserFavorites();
  });

  // Public API
  window.Favorites = {
    toggle: toggle,
    sync: syncPageStar,
    render: renderUserFavorites
  };
})();
