---
layout: single
classes: wide
title: "Recipes"
title_fr: "Recettes"
permalink: /recipes/
author_profile: false
search: false
sidebar:
  recipe_nav: true
---

{% assign recipes = site.recipes | sort: "title" %}
<p class="recipe-count">
  <span class="lang-en-content">{{ recipes.size }} total</span>
  <span class="lang-fr-content">{{ recipes.size }} au total</span>
</p>
{% include recipe-list.html recipes=recipes %}
