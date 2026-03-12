// Client-side pagination for recipe grids
(function () {
  "use strict";

  var PER_PAGE = 24;

  function initPagination(grid) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".recipe-card"));
    if (cards.length <= PER_PAGE) return; // no pagination needed

    var totalPages = Math.ceil(cards.length / PER_PAGE);
    var currentPage = 1;

    // Read page from URL hash (e.g. #page=2)
    var hashMatch = window.location.hash.match(/page=(\d+)/);
    if (hashMatch) {
      var parsed = parseInt(hashMatch[1], 10);
      if (parsed >= 1 && parsed <= totalPages) currentPage = parsed;
    }

    // Build pagination controls
    var nav = document.createElement("nav");
    nav.className = "pagination-nav";
    nav.setAttribute("aria-label", "Pagination");
    grid.parentNode.insertBefore(nav, grid.nextSibling);

    function render() {
      // Show/hide cards
      cards.forEach(function (card, i) {
        var page = Math.floor(i / PER_PAGE) + 1;
        card.style.display = page === currentPage ? "" : "none";
      });

      // Build controls
      var isFr = document.documentElement.classList.contains("lang-fr");
      var prevLabel = isFr ? "Précédent" : "Previous";
      var nextLabel = isFr ? "Suivant" : "Next";

      var html = [];
      html.push(
        '<button class="pagination-btn" data-page="prev"' +
          (currentPage === 1 ? " disabled" : "") +
          ">" +
          prevLabel +
          "</button>"
      );

      // Page numbers with ellipsis for large page counts
      var pages = buildPageList(currentPage, totalPages);
      pages.forEach(function (p) {
        if (p === "...") {
          html.push('<span class="pagination-ellipsis">&hellip;</span>');
        } else {
          html.push(
            '<button class="pagination-btn' +
              (p === currentPage ? " pagination-btn--active" : "") +
              '" data-page="' +
              p +
              '">' +
              p +
              "</button>"
          );
        }
      });

      html.push(
        '<button class="pagination-btn" data-page="next"' +
          (currentPage === totalPages ? " disabled" : "") +
          ">" +
          nextLabel +
          "</button>"
      );

      nav.innerHTML = html.join("");

      // Update hash without scrolling
      if (currentPage > 1) {
        history.replaceState(null, "", "#page=" + currentPage);
      } else {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }

    // Click handler (delegated)
    nav.addEventListener("click", function (e) {
      var btn = e.target.closest(".pagination-btn");
      if (!btn || btn.disabled) return;

      var target = btn.getAttribute("data-page");
      if (target === "prev") currentPage--;
      else if (target === "next") currentPage++;
      else currentPage = parseInt(target, 10);

      render();
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    render();
  }

  // Build a compact page number list: 1 ... 4 5 [6] 7 8 ... 12
  function buildPageList(current, total) {
    if (total <= 7) {
      var all = [];
      for (var i = 1; i <= total; i++) all.push(i);
      return all;
    }

    var pages = [1];
    var rangeStart = Math.max(2, current - 1);
    var rangeEnd = Math.min(total - 1, current + 1);

    if (rangeStart > 2) pages.push("...");
    for (var j = rangeStart; j <= rangeEnd; j++) pages.push(j);
    if (rangeEnd < total - 1) pages.push("...");
    pages.push(total);

    return pages;
  }

  // Init on DOM ready
  function init() {
    var grids = document.querySelectorAll(".recipe-grid");
    grids.forEach(function (grid) {
      initPagination(grid);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
