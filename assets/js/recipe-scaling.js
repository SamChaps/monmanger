(function () {
  'use strict';

  // --- Fraction helpers ---------------------------------------------------

  var COMMON_FRACTIONS = [
    [1 / 8, '1/8'], [1 / 4, '1/4'], [1 / 3, '1/3'], [3 / 8, '3/8'],
    [1 / 2, '1/2'], [5 / 8, '5/8'], [2 / 3, '2/3'], [3 / 4, '3/4'],
    [7 / 8, '7/8']
  ];

  var TOLERANCE = 0.03;

  /** Parse a quantity string to a number (handles mixed numbers, fractions, decimals). */
  function parseQty(str) {
    str = str.trim();

    // Mixed number: "1 1/2"
    var mixed = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixed) return parseInt(mixed[1], 10) + parseInt(mixed[2], 10) / parseInt(mixed[3], 10);

    // Fraction: "1/2"
    var frac = str.match(/^(\d+)\/(\d+)$/);
    if (frac) return parseInt(frac[1], 10) / parseInt(frac[2], 10);

    // Decimal or integer
    var num = parseFloat(str);
    return isNaN(num) ? null : num;
  }

  /** Try to render a number as a clean fraction or mixed number. Returns null if no clean match. */
  function toFraction(value) {
    if (value < 0) {
      var f = toFraction(-value);
      return f !== null ? '-' + f : null;
    }

    var whole = Math.floor(value);
    var remainder = value - whole;

    // Close to a whole number
    if (remainder < TOLERANCE) {
      return whole.toString();
    }

    for (var i = 0; i < COMMON_FRACTIONS.length; i++) {
      if (Math.abs(remainder - COMMON_FRACTIONS[i][0]) < TOLERANCE) {
        return whole > 0 ? whole + ' ' + COMMON_FRACTIONS[i][1] : COMMON_FRACTIONS[i][1];
      }
    }

    return null;
  }

  /** Format a scaled quantity for display. */
  function formatQty(value, originalText) {
    if (value === 0) return '0';

    var hadFraction = /\//.test(originalText);

    // If original used fractions, prefer fraction output
    if (hadFraction) {
      var frac = toFraction(value);
      if (frac !== null) return frac;
    }

    // Try fraction for small clean values
    if (value < 10) {
      var frac2 = toFraction(value);
      if (frac2 !== null) return frac2;
    }

    // Integer
    if (Math.abs(value - Math.round(value)) < 0.01) {
      return Math.round(value).toString();
    }

    // Round larger numbers more aggressively
    if (value >= 100) return Math.round(value).toString();
    if (value >= 10) return (Math.round(value * 2) / 2).toString();

    // Small decimal: 1 decimal place
    return (Math.round(value * 10) / 10).toString().replace(/\.0$/, '');
  }

  // --- DOM setup ----------------------------------------------------------

  document.addEventListener('DOMContentLoaded', function () {
    var servingsInput = document.getElementById('servings-value');
    if (!servingsInput) return;

    var baseServings = parseQty(servingsInput.dataset.base);
    if (baseServings === null || baseServings <= 0) return;

    var currentServings = baseServings;

    // Collect all qty spans and store their base values
    var qtySpans = document.querySelectorAll('span.qty');
    if (qtySpans.length === 0) return; // No scalable quantities

    qtySpans.forEach(function (span) {
      span.dataset.base = span.textContent.trim();
    });

    // Get controls
    var controls = document.getElementById('servings-controls');
    var btnDecrease = document.getElementById('servings-decrease');
    var btnIncrease = document.getElementById('servings-increase');
    var btnReset = document.getElementById('servings-reset');
    if (!controls || !btnDecrease || !btnIncrease || !btnReset) return;

    // Show controls (hidden by default until JS confirms qty spans exist)
    controls.style.display = '';

    function updateDisplay() {
      var ratio = currentServings / baseServings;

      // Update input display
      servingsInput.value = formatQty(currentServings, baseServings.toString());

      // Scale all qty spans
      qtySpans.forEach(function (span) {
        var base = parseQty(span.dataset.base);
        if (base === null) return;
        var scaled = base * ratio;
        span.textContent = formatQty(scaled, span.dataset.base);
      });

      // Highlight scaled state
      var isScaled = Math.abs(currentServings - baseServings) > 0.01;
      document.querySelectorAll('.lang-en-content, .lang-fr-content').forEach(function (div) {
        div.classList.toggle('recipe-scaled', isScaled);
      });
      servingsInput.classList.toggle('servings-input--scaled', isScaled);
      btnReset.style.display = isScaled ? '' : 'none';
      btnDecrease.disabled = currentServings <= stepSize(currentServings, false);
    }

    // Adaptive step: halves below 1, whole numbers above
    function stepSize(val, goingUp) {
      if (goingUp) return val < 1 ? 0.5 : 1;
      return val <= 1 ? 0.5 : 1;
    }

    function stepDown() {
      var s = stepSize(currentServings, false);
      var next = currentServings - s;
      // Round to avoid floating-point drift
      next = Math.round(next * 8) / 8;
      if (next > 0) {
        currentServings = next;
        updateDisplay();
      }
    }

    function stepUp() {
      var s = stepSize(currentServings, true);
      currentServings = Math.round((currentServings + s) * 8) / 8;
      updateDisplay();
    }

    btnDecrease.addEventListener('click', stepDown);
    btnIncrease.addEventListener('click', stepUp);

    btnReset.addEventListener('click', function () {
      currentServings = baseServings;
      updateDisplay();
    });

    // Direct input editing
    servingsInput.addEventListener('change', function () {
      var val = parseQty(servingsInput.value);
      if (val !== null && val > 0 && val <= 999) {
        currentServings = val;
        updateDisplay();
      } else {
        // Revert to current value on invalid input
        servingsInput.value = formatQty(currentServings, baseServings.toString());
      }
    });

    servingsInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        servingsInput.blur();
      }
    });
  });
})();
