// Checkable ingredients & steps — tap to strike through
// Syncs checked state across both language blocks using list position
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var content = document.querySelector('.page__content');
    if (!content) return;

    // Get both language blocks (div, not span)
    var enBlock = content.querySelector('div.lang-en-content');
    var frBlock = content.querySelector('div.lang-fr-content');

    if (enBlock && frBlock) {
      // Paired mode: sync checks across languages
      var enLists = enBlock.querySelectorAll('ul, ol');
      var frLists = frBlock.querySelectorAll('ul, ol');
      var count = Math.min(enLists.length, frLists.length);

      for (var i = 0; i < count; i++) {
        var enItems = enLists[i].querySelectorAll('li');
        var frItems = frLists[i].querySelectorAll('li');
        var itemCount = Math.min(enItems.length, frItems.length);

        for (var j = 0; j < itemCount; j++) {
          var pair = [enItems[j], frItems[j]];
          enItems[j].classList.add('checkable');
          frItems[j].classList.add('checkable');
          enItems[j]._pair = pair;
          frItems[j]._pair = pair;
          enItems[j].addEventListener('click', handlePairedCheck);
          frItems[j].addEventListener('click', handlePairedCheck);
        }
      }
    } else {
      // Fallback: simple check without pairing
      var lists = content.querySelectorAll('ul li, ol li');
      for (var k = 0; k < lists.length; k++) {
        lists[k].classList.add('checkable');
        lists[k].addEventListener('click', handleSimpleCheck);
      }
    }
  });

  function handlePairedCheck(e) {
    if (e.target.closest('a, button')) return;
    var pair = this._pair;
    if (!pair) return;
    var shouldCheck = !this.classList.contains('checked');
    for (var i = 0; i < pair.length; i++) {
      pair[i].classList.toggle('checked', shouldCheck);
    }
  }

  function handleSimpleCheck(e) {
    if (e.target.closest('a, button')) return;
    this.classList.toggle('checked');
  }
})();
