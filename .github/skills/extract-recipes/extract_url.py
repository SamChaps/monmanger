"""Extract recipe text from a website URL using recipe-scrapers.

Falls back to JSON-LD structured data if the site isn't supported.

Usage: py -3 extract_url.py <URL> [output_folder]

  output_folder defaults to the current directory.

Requires: pip install recipe-scrapers requests beautifulsoup4
"""
import json
import os
import re
import sys
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

try:
    from recipe_scrapers import scrape_me
    HAS_SCRAPERS = True
except ImportError:
    HAS_SCRAPERS = False

if len(sys.argv) < 2:
    print("Usage: py -3 extract_url.py <URL> [output_folder]")
    sys.exit(1)

URL = sys.argv[1]
OUT_DIR = sys.argv[2] if len(sys.argv) > 2 else "."
os.makedirs(OUT_DIR, exist_ok=True)

# Derive a filename from the URL path
slug = urlparse(URL).path.strip("/").split("/")[-1] or "recipe"
slug = re.sub(r"[^\w\-]", "-", slug).strip("-")
out_path = os.path.join(OUT_DIR, slug + ".txt")


def iso_duration(iso):
    """Convert ISO 8601 duration (PT1H30M) to readable text."""
    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", str(iso))
    if not m:
        return str(iso)
    parts = []
    if m.group(1):
        parts.append(f"{m.group(1)} hr")
    if m.group(2):
        parts.append(f"{m.group(2)} min")
    if m.group(3):
        parts.append(f"{m.group(3)} sec")
    return " ".join(parts) if parts else str(iso)


def extract_with_scrapers(url):
    """Try recipe-scrapers first (supports 400+ sites)."""
    scraper = scrape_me(url)
    lines = [f"Source: {url}", "", scraper.title(), ""]

    meta = []
    if scraper.prep_time():
        meta.append(f"Prep: {scraper.prep_time()} min")
    if scraper.cook_time():
        meta.append(f"Cook: {scraper.cook_time()} min")
    if scraper.total_time():
        meta.append(f"Total: {scraper.total_time()} min")
    if scraper.yields():
        meta.append(f"Servings: {scraper.yields()}")
    if meta:
        lines.append(" | ".join(meta))
        lines.append("")

    if scraper.ingredients():
        lines.append("Ingredients:")
        for ing in scraper.ingredients():
            lines.append(f"  - {ing}")
        lines.append("")

    if scraper.instructions_list():
        lines.append("Instructions:")
        for i, step in enumerate(scraper.instructions_list(), 1):
            lines.append(f"  {i}. {step}")
        lines.append("")

    return "\n".join(lines)


def extract_with_jsonld(url):
    """Fallback: fetch page and parse JSON-LD Recipe schema."""
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    recipe = None
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string)
        except (json.JSONDecodeError, TypeError):
            continue
        items = data if isinstance(data, list) else [data]
        for item in items:
            if item.get("@type") == "Recipe":
                recipe = item
                break
            if "@graph" in item:
                for node in item["@graph"]:
                    if node.get("@type") == "Recipe":
                        recipe = node
                        break
        if recipe:
            break

    if not recipe:
        return None

    lines = [f"Source: {url}", "", recipe.get("name", "Untitled"), ""]

    if recipe.get("description"):
        lines.append(recipe["description"])
        lines.append("")

    meta = []
    if recipe.get("prepTime"):
        meta.append(f"Prep: {iso_duration(recipe['prepTime'])}")
    if recipe.get("cookTime"):
        meta.append(f"Cook: {iso_duration(recipe['cookTime'])}")
    if recipe.get("totalTime"):
        meta.append(f"Total: {iso_duration(recipe['totalTime'])}")
    if recipe.get("recipeYield"):
        yield_val = recipe["recipeYield"]
        if isinstance(yield_val, list):
            yield_val = yield_val[0]
        meta.append(f"Servings: {yield_val}")
    if meta:
        lines.append(" | ".join(meta))
        lines.append("")

    if recipe.get("recipeIngredient"):
        lines.append("Ingredients:")
        for ing in recipe["recipeIngredient"]:
            lines.append(f"  - {ing}")
        lines.append("")

    if recipe.get("recipeInstructions"):
        lines.append("Instructions:")
        step_num = 1
        for step in recipe["recipeInstructions"]:
            if isinstance(step, str):
                lines.append(f"  {step_num}. {step}")
                step_num += 1
            elif isinstance(step, dict):
                if step.get("@type") == "HowToSection":
                    for sub in step.get("itemListElement", []):
                        text = sub.get("text", str(sub)) if isinstance(sub, dict) else str(sub)
                        lines.append(f"  {step_num}. {text}")
                        step_num += 1
                else:
                    lines.append(f"  {step_num}. {step.get('text', str(step))}")
                    step_num += 1
        lines.append("")

    return "\n".join(lines)


# Try recipe-scrapers first, fall back to JSON-LD
content = None

if HAS_SCRAPERS:
    try:
        content = extract_with_scrapers(URL)
        print("Extracted with recipe-scrapers.")
    except Exception:
        pass

if not content:
    content = extract_with_jsonld(URL)
    if content:
        print("Extracted with JSON-LD fallback.")
    else:
        print("Error: Could not extract recipe data from this URL.")
        sys.exit(1)

with open(out_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Saved to: {out_path}")
