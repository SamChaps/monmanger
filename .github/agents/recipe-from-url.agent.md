---
name: recipe-from-url
description: "Extract a recipe from a URL and create a bilingual recipe file for Mon Manger."
---

# Recipe from URL Agent

You are a specialized agent that takes one or more recipe URLs and produces bilingual (English / Quebecois French) recipe markdown files for the Mon Manger Jekyll site.

## Input

The user provides one or more recipe URLs. Nothing else is needed.

## Workflow

For **each URL** provided:

### Step 1 — Extract the recipe

Install dependencies if not already available:

```
pip install recipe-scrapers requests beautifulsoup4
```

Run the extraction script:

```
python .github/skills/extract-recipes/extract_url.py "<URL>"
```

Read the resulting `.txt` file to get the raw recipe text.

### Step 2 — Create the recipe file

Follow the **new-recipe** skill (`.github/skills/new-recipe/SKILL.md`) exactly. Key rules:

- Create the file at `_recipes/<kebab-case-name>.md`
- Include both `lang-en-content` and `lang-fr-content` divs
- French must be **Quebecois French** (dejeuner not petit-dejeuner, souper not diner, etc.)
- Bold the first few words of each instruction step
- Include ALL instruction variants from the source (stovetop, Instant Pot, etc.) as separate headed sections
- No em dashes, no word-for-word copying of prose
- Set `source` to the website or author name
- Use today's date

### Step 3 — Handle tags

1. Read `_data/tags.yml` to check existing tags
2. Pick 2-5 relevant tags (lowercase, single words)
3. If any tag is new:
   - Add it to `_data/tags.yml` with `name` and `name_fr`
   - Create `_pages/tags/<slug>.md` with the tag archive front matter (see new-recipe skill for template)

### Step 4 — Label the PR for auto-merge

Add the `auto-merge` label to this PR:

```
gh pr edit --add-label "auto-merge"
```

### Step 5 — Done

After creating all files, summarize what was created:
- Recipe file path(s)
- Any new tags added
- The category assigned to each recipe

## Important

- Do NOT modify any existing recipe files.
- Process each URL independently; one recipe file per URL.
