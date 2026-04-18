// Checkable ingredients & steps — tap to strike through
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    // Target li elements inside the recipe content area
    var content = document.querySelector('.page__content');
    if (!content) return;

    var lists = content.querySelectorAll('ul, ol');
    for (var i = 0; i < lists.length; i++) {
      var items = lists[i].querySelectorAll('li');
      for (var j = 0; j < items.length; j++) {
        items[j].classList.add('checkable');
        items[j].addEventListener('click', handleCheck);
      }
    }
  });

  function handleCheck(e) {
    // Don't toggle when clicking links or buttons inside the item
    if (e.target.closest('a, button')) return;
    this.classList.toggle('checked');
  }
})();
