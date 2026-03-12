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

## Copilot Coding Agent — Recipe from URL

When assigned to a GitHub Issue that contains recipe URLs, follow this workflow:

1. **Install Python dependencies**: `pip install recipe-scrapers requests beautifulsoup4`
2. **For each URL** in the issue body:
   a. Run `python .github/skills/extract-recipes/extract_url.py "<URL>"` to extract the recipe text
   b. Read the resulting `.txt` file
   c. Follow the **new-recipe** skill (`.github/skills/new-recipe/SKILL.md`) to create a bilingual recipe markdown file in `_recipes/`
   d. Check `_data/tags.yml` for existing tags. If any new tags are needed, add them to `_data/tags.yml` and create corresponding `_pages/tags/<slug>.md` files
3. **Commit** all new files with the message: `Add recipe: <recipe name>`
4. If multiple URLs are provided, create one recipe file per URL in a single PR
