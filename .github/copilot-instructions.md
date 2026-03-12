# Mon Manger — Workspace Instructions

## Project Overview

Mon Manger is a bilingual (English / French) cooking recipe website built with Jekyll and the Minimal Mistakes remote theme, hosted on GitHub Pages at monmanger.com.

## Tech Stack

- **Jekyll 4.x** with `jekyll-remote-theme` (Minimal Mistakes "air" skin)
- **Ruby 3.3** — run `bundle exec jekyll serve` from the project root
- **Catppuccin** color scheme — Latte (light) / Mocha (dark), accent = Mauve, hover = Teal
- **Lunr.js** for client-side search with custom accent normalization
- **GitHub Actions** for deployment (`.github/workflows/deploy.yml`)

## Bilingual System

- Content uses CSS class toggle — **not** separate pages per language
- English content: `<span class="lang-en-content">` or `<div class="lang-en-content" markdown="1">`
- French content: `<span class="lang-fr-content">` or `<div class="lang-fr-content" markdown="1">`
- Toggling adds/removes `lang-fr` class on `<html>` — CSS hides/shows the matching spans
- Language preference persisted in `localStorage`
- Page titles swap via `window.__pageTitleFr` (set from `title_fr` front matter)

## Key Directories

- `_recipes/` — Recipe markdown files (flat, no subdirectories)
- `_layouts/` — `recipe.html`, `category-archive.html`, `tag-archive.html`
- `_includes/` — `sidebar.html`, `recipe-list.html`, `masthead.html`, `head/custom.html`
- `_data/` — `categories.yml`, `tags.yml`, `navigation.yml`, `translations.yml`
- `_pages/categories/` — One `.md` per category
- `_pages/tags/` — One `.md` per tag
- `assets/css/main.scss` — All custom styles + Catppuccin variables
- `assets/js/lunr/` — `lunr-custom.js` (search logic), `lunr-store.js` (search index)

## Categories (use exact names in front matter)

Dessert, Soup, Main, Salad, Bread, Breakfast, Appetizer

## Tags

- Always lowercase, prefer single words (e.g. `comfort` not `comfort food`)
- Defined in `_data/tags.yml` with `name` and `name_fr`
- Each tag needs a corresponding archive page in `_pages/tags/`

## Conventions

- Recipe filenames: `kebab-case.md` (e.g. `chocolate-lava-cake.md`)
- Dates in front matter: `YYYY-MM-DD`
- Difficulty levels: Easy / Medium / Advanced (French: Facile / Moyen / Avancé)
- Time formats: "15 min", "1 hr 30 min"
- Commits: imperative mood, concise
- When pushing: `git add -A; git commit -m "message"; git push`
