// Custom Lunr search with accent-insensitive matching and bilingual support
function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Register a custom pipeline function that strips accents
var accentNormalizer = function (token) {
  return token.update(function (str) {
    return removeAccents(str.toLowerCase());
  });
};
lunr.Pipeline.registerFunction(accentNormalizer, 'accentNormalizer');

var idx = lunr(function () {
  this.field('title', { boost: 10 })
  this.field('title_fr', { boost: 10 })
  this.field('excerpt')
  this.field('categories', { boost: 5 })
  this.field('tags', { boost: 5 })
  this.ref('id')

  // Use accent normalizer in both indexing and search pipelines
  this.pipeline.remove(lunr.trimmer)
  this.pipeline.remove(lunr.stemmer)
  this.pipeline.remove(lunr.stopWordFilter)
  this.pipeline.add(accentNormalizer)
  this.searchPipeline.reset()
  this.searchPipeline.add(accentNormalizer)

  for (var item in store) {
    this.add({
      title: store[item]._titleEn || store[item].title,
      title_fr: store[item].title_fr || '',
      excerpt: store[item].excerpt,
      categories: store[item].categories,
      tags: store[item].tags,
      id: item
    })
  }
});

// Detect current language
function isFrench() {
  return document.documentElement.classList.contains('lang-fr');
}

$(document).ready(function() {
  $('input#search').on('keyup', function () {
    var resultdiv = $('#results');
    var query = $(this).val().trim().toLowerCase();
    if (query.length === 0) {
      resultdiv.empty();
      return;
    }
    var result =
      idx.query(function (q) {
        query.split(lunr.tokenizer.separator).forEach(function (term) {
          var normalised = removeAccents(term);
          if (normalised === "") return;
          // Exact match on normalised term (highest priority)
          q.term(normalised, { boost: 100 })
          // Wildcard trailing (partial match while typing)
          q.term(normalised, { usePipeline: false, wildcard: lunr.Query.wildcard.TRAILING, boost: 10 })
          // Fuzzy match (typo tolerance)
          q.term(normalised, { usePipeline: false, editDistance: 1, boost: 1 })
        })
      });
    resultdiv.empty();
    var fr = isFrench();
    var countLabel = fr
      ? (result.length + ' résultat' + (result.length !== 1 ? 's' : '') + ' trouvé' + (result.length !== 1 ? 's' : ''))
      : (result.length + ' Result' + (result.length !== 1 ? 's' : '') + ' found');
    resultdiv.prepend('<p class="results__found">' + countLabel + '</p>');
    for (var item in result) {
      var ref = result[item].ref;
      var title = store[ref].title;
      var rawExcerpt = (fr && store[ref].excerpt_fr) ? store[ref].excerpt_fr : store[ref].excerpt;
      var excerpt = rawExcerpt.split(" ").splice(0, 20).join(" ") + '...';
      var teaser = store[ref].teaser;
      var tagsHtml = '';
      var tags = store[ref].tags;
      var tagsFr = store[ref].tags_fr;
      if (tags && tags.length) {
        tagsHtml = '<div class="search-result__tags">';
        for (var t = 0; t < tags.length; t++) {
          var slug = tags[t].toLowerCase().replace(/\s+/g, '-');
          var tagLabel = fr && tagsFr && tagsFr[t] ? tagsFr[t] : tags[t];
          tagsHtml += '<a href="/tags/' + slug + '/" class="recipe-tag recipe-tag--link">' + tagLabel + '</a>';
        }
        tagsHtml += '</div>';
      }
      var searchitem =
        '<div class="list__item">' +
          '<article class="archive__item" itemscope itemtype="https://schema.org/CreativeWork">' +
            '<h2 class="archive__item-title" itemprop="headline">' +
              '<a href="' + store[ref].url + '" rel="permalink">' + title + '</a>' +
            '</h2>' +
            (teaser ? '<div class="archive__item-teaser"><img src="' + teaser + '" alt=""></div>' : '') +
            '<p class="archive__item-excerpt" itemprop="description">' + excerpt + '</p>' +
            tagsHtml +
          '</article>' +
        '</div>';
      resultdiv.append(searchitem);
    }
  });
});
