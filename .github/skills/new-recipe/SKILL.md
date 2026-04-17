---
name: new-recipe
description: 'Create a new bilingual recipe for Mon Manger. Use when: adding a recipe, converting recipe text to markdown, importing a recipe, creating recipe files. Handles front matter, bilingual content, tags, and category assignment.'
argument-hint: 'Recipe name or paste raw recipe text to convert'
---

# New Recipe Skill

## When to Use
- Adding a new recipe to the site
- Converting raw text (from PDF extraction, web copy, etc.) into recipe markdown
- Translating a recipe between English and French

## Recipe File Template

Create the file at `_recipes/<kebab-case-name>.md`:

```markdown
---
title: "English Title"
title_fr: "Titre en français"
excerpt: "One-line description for cards (max ~15 words)."
excerpt_fr: "Description en une ligne pour les fiches."
date: YYYY-MM-DD
categories:
  - CategoryName
tags:
  - lowercase
  - singleword
prep_time: "15 min"
cook_time: "30 min"
total_time: "45 min"
servings: "4"
difficulty: "Easy"
difficulty_fr: "Facile"
source: "Name or URL of the original recipe"
---

<div class="lang-en-content" markdown="1">

Brief intro paragraph about the dish.

## Ingredients

- <span class="qty">200</span> g (<span class="qty">7</span> oz) ingredient one
- <span class="qty">2</span> tbsp ingredient two

## Instructions

1. **Bold first words.** Then describe the step.
2. **Next step.** Details here.

## Notes & Tips

- Helpful tip or variation.

</div>

<div class="lang-fr-content" markdown="1">

Paragraphe d'introduction sur le plat.

## Ingrédients

- <span class="qty">200</span> g d'ingrédient un
- <span class="qty">2</span> c. à soupe d'ingrédient deux

## Instructions

1. **Premiers mots en gras.** Puis décrire l'étape.
2. **Étape suivante.** Détails ici.

## Notes & conseils

- Conseil utile ou variante.

</div>
```

## Rules

### Front Matter
- **title / title_fr**: Both required, in quotes.
  - **English title**: Normal title case (capitalize major words).
  - **French title_fr**: Sentence case only. Capitalize only the first word; all other words lowercase except proper nouns (brand names like "Oreo", "Beyond Meat"; place names like "Bruxelles", "César"). Example: `"Tacos de patate douce à l'érable"`, not `"Tacos de Patate Douce à l'Érable"`.
- **excerpt / excerpt_fr**: Short, enticing, max ~15 words each.
- **date**: Use today's date in `YYYY-MM-DD` format.
- **categories**: Exactly one from: `Dessert`, `Soup`, `Main`, `Salad`, `Bread`, `Breakfast`, `Appetizer`.
- **tags**: Lowercase, prefer single words. 2-5 tags per recipe.
- **Times**: Format as `"15 min"`, `"1 hr 30 min"`. `total_time` = prep + cook.
- **servings**: As a quoted string.
- **difficulty / difficulty_fr**: `Easy`/`Facile`, `Medium`/`Moyen`, or `Advanced`/`Avancé`.
- **source**: Name of the original recipe creator for attribution (e.g. `"Preppy Kitchen"`). Use the short canonical name, not the full website title. For example, use `"Ricardo"` (not `"Ricardo Cuisine"`), `"Loounie"` (not `"Loounie Mordu"`). If the recipe is original or a family recipe, use `"Original"` or `"Recette familiale"`.

### Content
- Wrap English in `<div class="lang-en-content" markdown="1">`, French in `<div class="lang-fr-content" markdown="1">`.
- Include metric measurements with imperial in parentheses where helpful.
- Bold the first few words of each instruction step.
- Sections: Ingredients → Instructions → Notes & Tips (optional).
- Sub-sections within Ingredients are fine (e.g. **Sauce**, **Dough**).
- **Include ALL instruction variants.** If a recipe offers multiple cooking methods (e.g. stovetop, Instant Pot, oven, slow cooker, air fryer), include all of them as separate headed sections: `## Instructions (Stovetop)`, `## Instructions (Instant Pot)`, etc. Never omit an alternative method provided in the source.
- **Scalable quantities.** Wrap every numeric quantity in ingredient lines with `<span class="qty">...</span>`. This enables the serving scaler on recipe pages. Examples:
  - `<span class="qty">225</span> g (<span class="qty">1 1/2</span> cups) flour`
  - `<span class="qty">1/2</span> tsp baking soda`
  - `<span class="qty">1</span> egg`
  - Lines without quantities (e.g. "Salt and pepper, to taste") get no spans.
  - Apply to both English and French ingredient sections.

### Writing Style
- **No em dashes (—).** Use commas, periods, colons, or semicolons instead. Rewrite the sentence if needed.
- **No copying.** Never copy descriptions, intros, or notes word-for-word from the source. Always rewrite in your own words to avoid copyright issues. Ingredient lists and basic technique steps are fine, but all prose must be original.
- **Quebecois French.** All French content must use Quebecois French rather than Metropolitan French. Key differences include:
  - "déjeuner" (not "petit-déjeuner") for breakfast
  - "dîner" (not "déjeuner") for lunch
  - "souper" (not "dîner") for dinner/supper
  - "breuvage" (not "boisson") for beverage
  - "bleuets" (not "myrtilles") for blueberries
  - "canneberges" (not "airelles") for cranberries
  - "fève" (not "haricot") for bean when used colloquially
  - Prefer local expressions and vocabulary when a clear Quebecois equivalent exists.

### Tags Checklist
When adding a new tag that doesn't exist yet:
1. Add to `_data/tags.yml` with `name` and `name_fr`
2. Create `_pages/tags/<slug>.md` with this front matter:
   ```yaml
   ---
   title: "tagname"
   title_fr: "nom en français"
   permalink: /tags/tagname/
   layout: tag-archive
   tag: tagname
   search: false
   author_profile: false
   sidebar:
     recipe_nav: true
   ---
   ```

### Filename
- `kebab-case.md`, derived from the English title
- Example: "Chocolate Lava Cakes" → `chocolate-lava-cakes.md`

## Converting from Raw Text
When converting extracted text from PDFs or images:
1. Identify the language of the source and translate the other language
2. Parse ingredients and instructions from the raw text
3. Rewrite all descriptions, intros, and notes in original words (no copying)
4. Assign the best-fit category
5. Pick 2-5 relevant tags (check existing tags in `_data/tags.yml` first)
6. Estimate prep/cook times if not stated
7. Set `source` to the recipe origin (website name, cookbook, etc.)
8. Write both `lang-en-content` and `lang-fr-content` sections
