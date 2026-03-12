---
layout: single
title: "Recipes"
title_fr: "Recettes"
author_profile: false
search: false
sidebar:
  recipe_nav: true
---

{% assign recipes = site.recipes | sort: "title" %}
{% include recipe-list.html recipes=recipes %}
