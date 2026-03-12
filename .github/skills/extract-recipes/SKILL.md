---
name: extract-recipes
description: 'Extract text from recipe websites. Use when: scraping a recipe URL, preparing raw text for the new-recipe skill.'
argument-hint: 'A recipe URL to extract'
---

# Recipe Extraction Skill

## When to Use
- Scraping a recipe from a website URL
- Preparing raw text for conversion to recipe markdown using the new-recipe skill

## Prerequisites

Python 3 with these packages (install if missing):

```
pip install recipe-scrapers requests beautifulsoup4
```

## Scripts

- **`extract_url.py`** — Extract recipe from a website URL (tries recipe-scrapers, falls back to JSON-LD)

## Workflow

Run `extract_url.py` with the recipe URL:

```powershell
py -3 .github/skills/extract-recipes/extract_url.py "<URL>" [output_folder]
```

This will:
1. Try `recipe-scrapers` (supports 400+ sites) for structured extraction
2. Fall back to JSON-LD Recipe schema parsing if the site isn't supported
3. Save a `.txt` file named after the URL slug

The output folder defaults to the current directory if not specified.

## Output

A `.txt` file with the recipe title, times, ingredients, and instructions, ready to be converted to recipe markdown using the **new-recipe** skill.
