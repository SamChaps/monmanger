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
  this.field('source', { boost: 5 })
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
      source: store[item].source || '',
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
    resultdiv.append('<div class="recipe-grid recipe-grid--search">');
    var grid = resultdiv.find('.recipe-grid--search');
    for (var item in result) {
      var ref = result[item].ref;
      var s = store[ref];
      var title = fr && s.title_fr ? s.title_fr : s.title;
      var rawExcerpt = (fr && s.excerpt_fr) ? s.excerpt_fr : s.excerpt;
      var excerpt = rawExcerpt.split(" ").splice(0, 20).join(" ") + '...';
      var teaser = s.teaser;
      var source = s.source && s.source !== 'Original' ? s.source : '';
      var prepTime = s.total_time || s.prep_time || '';
      var difficulty = fr && s.difficulty_fr ? s.difficulty_fr : (s.difficulty || '');

      var tagsHtml = '';
      var tags = s.tags;
      var tagsFr = s.tags_fr;
      if (tags && tags.length) {
        tagsHtml = '<div class="recipe-card__tags">';
        var limit = Math.min(tags.length, 4);
        for (var t = 0; t < limit; t++) {
          var slug = tags[t].toLowerCase().replace(/\s+/g, '-');
          var tagLabel = fr && tagsFr && tagsFr[t] ? tagsFr[t] : tags[t];
          tagsHtml += '<a href="/tags/' + slug + '/" class="recipe-tag recipe-tag--link">' + tagLabel + '</a>';
        }
        tagsHtml += '</div>';
      }

      var metaParts = '';
      if (prepTime) metaParts += '<span><i class="fas fa-clock"></i> ' + prepTime + '</span>';
      if (difficulty) metaParts += '<span><i class="fas fa-signal"></i> ' + difficulty + '</span>';
      if (source) metaParts += '<span class="recipe-card__source"><i class="fas fa-bookmark"></i> ' + source + '</span>';

      var searchitem =
        '<article class="recipe-card" onclick="window.location=\'' + s.url + '\'" style="cursor:pointer;">' +
          (teaser ? '<div class="recipe-card__image-link"><img src="' + teaser + '" alt="" class="recipe-card__image" loading="lazy"></div>' : '') +
          '<div class="recipe-card__body">' +
            '<h2 class="recipe-card__title"><a href="' + s.url + '">' + title + '</a></h2>' +
            '<p class="recipe-card__excerpt">' + excerpt + '</p>' +
            (metaParts ? '<div class="recipe-card__meta">' + metaParts + '</div>' : '') +
            tagsHtml +
          '</div>' +
        '</article>';
      grid.append(searchitem);
    }
  });
});
