import unittest

from app import ExtractedRecipe, build_agent_prompt, parse_urls, recipe_title, validate_url


class UrlValidationTests(unittest.TestCase):
    def test_accepts_recipe_urls_and_removes_duplicates(self) -> None:
        urls = parse_urls("https://example.com/a\nhttps://example.com/a\nhttps://example.org/b")

        self.assertEqual(urls, ["https://example.com/a", "https://example.org/b"])

    def test_rejects_local_addresses(self) -> None:
        for url in ("http://localhost/recipe", "http://127.0.0.1/recipe", "file:///recipe"):
            with self.subTest(url=url), self.assertRaises(ValueError):
                validate_url(url)

    def test_limits_batch_size(self) -> None:
        urls = "\n".join(f"https://example.com/{position}" for position in range(6))

        with self.assertRaisesRegex(ValueError, "at most 5"):
            parse_urls(urls)


class PromptTests(unittest.TestCase):
    def setUp(self) -> None:
        self.recipe = ExtractedRecipe(
            url="https://example.com/pie",
            title="Apple Pie",
            text="Source: https://example.com/pie\n\nApple Pie\n\nIngredients:\n - 1 apple",
        )

    def test_marks_extracted_content_as_untrusted(self) -> None:
        prompt = build_agent_prompt([self.recipe], notes="Use six servings.")

        self.assertIn("untrusted recipe data", prompt)
        self.assertIn('"url": "https://example.com/pie"', prompt)
        self.assertIn("Use six servings.", prompt)
        self.assertIn("ready for review", prompt)

    def test_review_mode_requests_a_wip_draft(self) -> None:
        prompt = build_agent_prompt([self.recipe], pause_for_review=True)

        self.assertIn("[WIP]", prompt)
        self.assertIn("draft", prompt)

    def test_extracts_title_from_recipe_text(self) -> None:
        self.assertEqual(recipe_title(self.recipe.text, self.recipe.url), "Apple Pie")


if __name__ == "__main__":
    unittest.main()