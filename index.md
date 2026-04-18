---
layout: single
classes: wide
title: ""
author_profile: false
search: false
sidebar:
  recipe_nav: true
---

{% assign t = site.data.translations %}

<p class="homepage-welcome">
  <span class="lang-en-content">Sam & Luisa's Online Cookbook</span>
  <span class="lang-fr-content">Les recettes de Sam et Luisa</span>
</p>

<!-- Favorites — dynamically populated by favorites.js -->
<section class="favorites-section">
  <h2 class="favorites-section__title">
    <i class="fas fa-star favorites-section__icon"></i>
    <span class="lang-en-content">{{ t.en.your_favorites }}</span>
    <span class="lang-fr-content">{{ t.fr.your_favorites }}</span>
    <span class="favorites-count" id="user-favorites-count"></span>
  </h2>
  <p class="favorites-hint">
    <i class="fas fa-info-circle"></i>
    <span class="lang-en-content">{{ t.en.favorites_hint }}</span>
    <span class="lang-fr-content">{{ t.fr.favorites_hint }}</span>
  </p>
  <!-- Empty-state (shown when no user favorites) -->
  <div id="favorites-empty" class="favorites-empty">
    <div class="favorites-empty__icon"><i class="far fa-star"></i></div>
    <p>
      <span class="lang-en-content">{{ t.en.favorites_empty }}</span>
      <span class="lang-fr-content">{{ t.fr.favorites_empty }}</span>
    </p>
    <a href="{{ '/recipes/' | relative_url }}" class="favorites-empty__cta">
      <span class="lang-en-content">{{ t.en.favorites_empty_cta }}</span>
      <span class="lang-fr-content">{{ t.fr.favorites_empty_cta }}</span>
      <i class="fas fa-arrow-right"></i>
    </a>
  </div>
  <!-- Favorite cards grid (populated by JS) -->
  <div class="recipe-grid" id="user-favorites-grid" style="display:none;"></div>
</section>

<!-- Top Picks — curated picks -->
<section class="favorites-section">
  <h2 class="favorites-section__title">
    <i class="fas fa-heart favorites-section__icon"></i>
    <span class="lang-en-content">{{ t.en.home_favorites }}</span>
    <span class="lang-fr-content">{{ t.fr.home_favorites }}</span>
  </h2>
  {% assign home_favs = site.data.home_favorites %}
  {% assign fav_recipes = "" | split: "" %}
  {% for slug in home_favs %}
    {% assign r = site.recipes | where: "slug", slug | first %}
    {% if r %}
      {% assign fav_recipes = fav_recipes | push: r %}
    {% endif %}
  {% endfor %}
  {% include recipe-list.html recipes=fav_recipes %}
</section>
