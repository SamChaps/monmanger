// Copy the currently displayed recipe as structured plain text.
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var button = document.getElementById('recipe-copy-btn');
    if (!button) return;

    var resetTimer;

    button.addEventListener('click', function () {
      var recipeText = buildRecipeText();
      if (!recipeText) {
        showState('error');
        return;
      }

      button.setAttribute('aria-busy', 'true');
      copyText(recipeText).then(function () {
        showState('copied');
      }).catch(function () {
        showState('error');
      }).then(function () {
        button.removeAttribute('aria-busy');
      });
    });

    function showState(state) {
      window.clearTimeout(resetTimer);
      button.classList.toggle('is-copied', state === 'copied');
      button.classList.toggle('is-error', state === 'error');

      button.querySelector('.recipe-copy-btn__label--default').setAttribute(
        'aria-hidden', state === 'default' ? 'false' : 'true'
      );
      button.querySelector('.recipe-copy-btn__label--success').setAttribute(
        'aria-hidden', state === 'copied' ? 'false' : 'true'
      );
      button.querySelector('.recipe-copy-btn__label--error').setAttribute(
        'aria-hidden', state === 'error' ? 'false' : 'true'
      );

      var icon = button.querySelector('.recipe-copy-btn__icon');
      if (icon) {
        icon.className = state === 'copied'
          ? 'fas fa-check recipe-copy-btn__icon'
          : state === 'error'
            ? 'fas fa-exclamation-circle recipe-copy-btn__icon'
            : 'far fa-copy recipe-copy-btn__icon';
      }

      if (state !== 'default') {
        resetTimer = window.setTimeout(function () {
          showState('default');
        }, 2500);
      }
    }
  });

  function buildRecipeText() {
    var content = document.querySelector('.page__content');
    if (!content) return '';

    var isFrench = document.documentElement.classList.contains('lang-fr');
    var languageClass = isFrench ? 'div.lang-fr-content' : 'div.lang-en-content';
    var recipe = content.querySelector(languageClass);
    if (!recipe) return '';

    var sections = [];
    var title = document.querySelector('.page__title[itemprop="headline"]');
    if (title) sections.push(cleanInlineText(title.innerText));

    var metadata = [];
    content.querySelectorAll('.recipe-meta-item').forEach(function (item) {
      var label = item.querySelector('.recipe-meta-label');
      var value = item.querySelector('.recipe-meta-value');
      if (label && value) {
        metadata.push(cleanInlineText(label.innerText) + ': ' + cleanInlineText(value.innerText));
      }
    });

    var servingsLabel = content.querySelector('.servings-scaler__label');
    var servingsValue = document.getElementById('servings-value');
    if (servingsLabel && servingsValue) {
      metadata.push(cleanInlineText(servingsLabel.innerText) + ': ' + servingsValue.value.trim());
    }
    if (metadata.length) sections.push(metadata.join('\n'));

    var source = content.querySelector('.recipe-source');
    if (source) sections.push(cleanInlineText(source.innerText));

    sections.push(serializeRecipe(recipe));
    sections.push(window.location.href);
    return sections.filter(Boolean).join('\n\n');
  }

  function serializeRecipe(recipe) {
    var lines = [];

    Array.prototype.forEach.call(recipe.children, function (element) {
      var tagName = element.tagName.toLowerCase();

      if (tagName === 'ul' || tagName === 'ol') {
        appendList(element, lines, 0);
        lines.push('');
        return;
      }

      var copy = element.cloneNode(true);
      copy.querySelectorAll('.header-link').forEach(function (link) {
        link.remove();
      });
      var text = cleanBlockText(copy.innerText || copy.textContent);
      if (text) {
        lines.push(text);
        lines.push('');
      }
    });

    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function appendList(list, lines, depth) {
    var ordered = list.tagName.toLowerCase() === 'ol';
    var items = Array.prototype.filter.call(list.children, function (child) {
      return child.tagName.toLowerCase() === 'li';
    });

    items.forEach(function (item, index) {
      var copy = item.cloneNode(true);
      copy.querySelectorAll('ul, ol').forEach(function (nestedList) {
        nestedList.remove();
      });

      var prefix = ordered ? (index + 1) + '. ' : '- ';
      lines.push('  '.repeat(depth) + prefix + cleanInlineText(copy.innerText || copy.textContent));

      Array.prototype.forEach.call(item.children, function (child) {
        if (child.tagName === 'UL' || child.tagName === 'OL') {
          appendList(child, lines, depth + 1);
        }
      });
    });
  }

  function cleanInlineText(text) {
    return text.replace(/\s+/g, ' ').trim();
  }

  function cleanBlockText(text) {
    return text
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function copyText(text) {
    if (legacyCopyText(text)) return Promise.resolve();

    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return Promise.reject(new Error('Clipboard copy failed'));
  }

  function legacyCopyText(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    var copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }
    textarea.remove();
    return copied;
  }
})();