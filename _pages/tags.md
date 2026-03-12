---
title: "Tags"
title_fr: "Étiquettes"
permalink: /tags/
layout: single
search: false
author_profile: false
sidebar:
  recipe_nav: true
---

{% assign all_tags = "" | split: "" %}
{% for recipe in site.recipes %}
  {% for tag in recipe.tags %}
    {% unless all_tags contains tag %}
      {% assign all_tags = all_tags | push: tag %}
    {% endunless %}
  {% endfor %}
{% endfor %}
{% assign all_tags = all_tags | sort_natural %}

<div class="tag-tiles">
  {% for tag in all_tags %}
  {% assign tag_recipes = site.recipes | where_exp: "r", "r.tags contains tag" %}
  {% assign tag_slug = tag | slugify %}
  {% assign tag_data = site.data.tags | where: "name", tag | first %}
  <a href="{{ '/tags/' | append: tag_slug | append: '/' | relative_url }}" class="tag-tile">
    <span class="tag-tile__name"><span class="lang-en-content">{{ tag }}</span><span class="lang-fr-content">{{ tag_data.name_fr | default: tag }}</span></span>
    <span class="tag-tile__count">{{ tag_recipes.size }} <span class="lang-en-content">recipe{% if tag_recipes.size != 1 %}s{% endif %}</span><span class="lang-fr-content">recette{% if tag_recipes.size != 1 %}s{% endif %}</span></span>
  </a>
  {% endfor %}
</div>
