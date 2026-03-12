# Mon Manger 🍴

A bilingual cooking recipe site built with [Jekyll](https://jekyllrb.com/) and the [Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/) theme, designed for GitHub Pages.

## Features

- **Bilingual (EN / FR)** — every page, recipe, tag, and category has both languages, toggled instantly via an EN | FR button (CSS class–based, no page reload)
- **Dark / light theme** — Catppuccin Latte (light) and Mocha (dark) with smooth transition, persisted in localStorage
- **Full-text search** — custom Lunr.js with accent-insensitive matching (e.g. "crème" matches "creme"), bilingual titles and tag pills in results
- **Categories & tags** — tile-based browse pages, sidebar navigation, per-tag and per-category archive pages with recipe counts
- **Recipe metadata card** — prep time, cook time, total time, servings, difficulty
- **Responsive recipe grid** — fully clickable recipe cards with teaser images, excerpts, and tag pills
- **GitHub Actions deployment** — works with any Jekyll plugin, not limited to GitHub Pages whitelist

## Project Structure

```
monmanger/
├── _config.yml                 # Site configuration
├── Gemfile                     # Ruby dependencies
├── index.md                    # Home page (recipe grid)
├── _recipes/                   # Recipe markdown files
│   ├── chocolate-lava-cake.md
│   └── french-onion-soup.md
├── _layouts/
│   ├── recipe.html             # Recipe detail page with meta card + tags
│   ├── category-archive.html   # Category listing page
│   └── tag-archive.html        # Tag listing page
├── _includes/
│   ├── masthead.html           # Top nav with lang/theme toggles + search
│   ├── sidebar.html            # Left sidebar with categories + tags
│   ├── recipe-list.html        # Recipe card grid component
│   ├── head/custom.html        # Anti-FOUC, lang/theme/search JS
│   └── search/
│       └── lunr-search-scripts.html
├── _pages/
│   ├── all-categories.md       # Category tile grid
│   ├── tags.md                 # Tag tile grid
│   ├── search.md               # Search page
│   ├── categories/             # One .md per category (7 categories)
│   └── tags/                   # One .md per tag (7 tags)
├── _data/
│   ├── navigation.yml          # Top nav links (bilingual)
│   ├── categories.yml          # Category names, slugs, emoji, descriptions (bilingual)
│   ├── tags.yml                # Tag names (bilingual)
│   └── translations.yml        # UI label translations (EN/FR)
├── assets/
│   ├── css/main.scss           # All custom styles + Catppuccin theme variables
│   └── js/lunr/
│       ├── lunr-custom.js      # Custom search with accent normalization
│       └── lunr-store.js       # Jekyll-generated search index
└── .github/workflows/
    └── deploy.yml              # GitHub Actions build + deploy pipeline
```

## Local Development

### Prerequisites

- Ruby 3.x ([RubyInstaller](https://rubyinstaller.org/) on Windows)
- Bundler: `gem install bundler`

### Setup

```bash
cd monmanger
bundle install
bundle exec jekyll serve
```

Open [http://localhost:4000](http://localhost:4000) in your browser.  
Jekyll watches for changes and rebuilds automatically.

## Deploying to GitHub Pages

1. Push your repository to GitHub.
2. Go to **Settings → Pages → Source** and select **GitHub Actions**.
3. On the next push to `main`, the Actions workflow will build and deploy automatically.
4. Update `url` in `_config.yml` to your GitHub Pages URL, e.g. `https://yourusername.github.io`.

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
