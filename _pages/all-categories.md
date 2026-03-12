---
title: "Categories"
title_fr: "Catégories"
permalink: /categories/
layout: single
search: false
author_profile: false
sidebar:
  recipe_nav: true
---

<div class="category-tiles">
  {% for cat in site.data.categories %}
  {% assign cat_recipes = site.recipes | where_exp: "r", "r.categories contains cat.name" %}
  <a href="{{ '/categories/' | append: cat.slug | append: '/' | relative_url }}" class="category-tile">
    <span class="category-tile__emoji">{{ cat.emoji }}</span>
    <div class="category-tile__text">
      <span class="category-tile__name">
        <span class="lang-en-content">{{ cat.name }}</span>
        <span class="lang-fr-content">{{ cat.name_fr }}</span>
      </span>
      <span class="category-tile__desc">
        <span class="lang-en-content">{{ cat.description_en }}</span>
        <span class="lang-fr-content">{{ cat.description_fr }}</span>
      </span>
    </div>
    {% if cat_recipes.size > 0 %}
    <span class="category-tile__count">{{ cat_recipes.size }}</span>
    {% endif %}
  </a>
  {% endfor %}
</div>
