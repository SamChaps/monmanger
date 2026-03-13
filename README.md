# 🍴 Mon Manger

Recipes, in English & French.

**[monmanger.com](https://monmanger.com)**

---

## Highlights

| | |
|---|---|
| **Bilingual** | Every recipe, tag, and category in EN + FR. Toggled instantly, no page reload |
| **Theming** | Catppuccin Latte / Mocha with smooth transitions, persisted in `localStorage` |
| **Search** | Lunr.js with accent-insensitive matching. "crème" finds "creme" |
| **Browse** | Tile-based categories & tags, sidebar nav, archive pages with counts |
| **Recipes** | Metadata cards (prep · cook · total · servings · difficulty), clickable grid with teasers |
| **Deploy** | GitHub Actions. Any Jekyll plugin, not limited to Pages whitelist |

## Categories

| 🍰 Dessert | 🥣 Soup | 🍽️ Main | 🥗 Salad | 🍞 Bread | 🥞 Breakfast | 🫙 Appetizer |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|

## Project Structure

```
_recipes/            → Recipe markdown files
_layouts/            → recipe · category-archive · tag-archive
_includes/           → masthead · sidebar · recipe-list · head/custom
_data/               → categories · tags · navigation · translations
_pages/categories/   → One page per category
_pages/tags/         → One page per tag
assets/css/main.scss → Styles + Catppuccin variables
assets/js/lunr/      → Search logic + index
```

## Local Development

```bash
# Prerequisites: Ruby 3.x + Bundler
gem install bundler

# Install & serve
bundle install
bundle exec jekyll serve
```

Open **http://localhost:4000**. Jekyll watches for changes and rebuilds automatically.

## Deploy

Push to `main` → GitHub Actions builds and deploys.

Set **Settings → Pages → Source** to **GitHub Actions** on first setup.

---

Built with [Jekyll](https://jekyllrb.com/) + [Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/)

## Adding a New Recipe

Create a Markdown file in `_recipes/`:

```markdown
---
title: "Recipe Title"
title_fr: "Titre en français"
excerpt: "One-line description for recipe cards."
excerpt_fr: "Description en une ligne pour les fiches."
date: 2026-03-01
categories:
  - Dessert                 # Dessert | Soup | Main | Salad | Bread | Breakfast | Appetizer
tags:
  - chocolate               # lowercase, single-word preferred
  - french
prep_time: "15 min"
cook_time: "30 min"
total_time: "45 min"
servings: "4"
difficulty: "Easy"          # Easy | Medium | Advanced
difficulty_fr: "Facile"     # Facile | Moyen | Avancé
---

<div class="lang-en-content" markdown="1">

English recipe content here.

## Ingredients
- Item 1

## Instructions
1. Step one

</div>

<div class="lang-fr-content" markdown="1">

Contenu de la recette en français.

## Ingrédients
- Article 1

## Instructions
1. Première étape

</div>
```

To add a photo, put it in `assets/images/` and add to the front matter:

```yaml
header:
  teaser: /assets/images/my-recipe.jpg
```

## Adding a New Tag

1. Add the tag (lowercase) to recipe front matter under `tags:`
2. Add the translation to `_data/tags.yml`:
   ```yaml
   - name: mytag
     name_fr: mon étiquette
   ```
3. Create `_pages/tags/mytag.md`:
   ```markdown
   ---
   title: "mytag"
   title_fr: "mon étiquette"
   permalink: /tags/mytag/
   layout: tag-archive
   tag: mytag
   search: false
   author_profile: false
   sidebar:
     recipe_nav: true
   ---
   ```

## Adding a New Category

1. Add the category entry to `_data/categories.yml` (name, name_fr, slug, emoji, descriptions)
2. Create `_pages/categories/mycat.md` with `layout: category-archive`
3. Use the category name in recipe front matter under `categories:`

## Theme & Customization

- **Color scheme:** Catppuccin Latte (light) / Mocha (dark) — variables in `assets/css/main.scss`
- **Accent color:** Mauve (links, active states), Teal (hover)
- **Custom styles:** `assets/css/main.scss`
- **Navigation:** `_data/navigation.yml`
- **UI strings:** `_data/translations.yml`

## Bilingual System

The site uses a CSS class–based language toggle (no separate pages per language):

- English content is wrapped in `<span class="lang-en-content">` or `<div class="lang-en-content">`
- French content uses `lang-fr-content`
- Toggling adds/removes the `lang-fr` class on `<html>`, which hides or shows the appropriate spans via CSS
- Language preference is saved in `localStorage`
