import json
import threading
import unittest
from unittest.mock import call, patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from app import (
    ExtractedRecipe,
    activity_stage,
    build_agent_prompt,
    cancel_recipe,
    clean_review_title,
    create_server,
    dispatch_completed_recipes,
    duplicate_active_recipe,
    enrich_task,
    friendly_recipe_name,
    get_pull_requests,
    is_allowed_origin,
    parse_recipe_text,
    parse_urls,
    publish_reviewed_recipe,
    pull_request_for_task,
    recipe_title,
    submission_pr_number,
    validate_url,
)


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

    @patch("app.ALLOWED_ORIGINS", {"http://recipes.test:8765"})
    def test_allows_local_and_configured_browser_origins(self) -> None:
        self.assertTrue(is_allowed_origin("http://127.0.0.1:8765"))
        self.assertTrue(is_allowed_origin("http://recipes.test:8765"))
        self.assertFalse(is_allowed_origin("https://untrusted.example"))


class RecipeTextTests(unittest.TestCase):
    def test_accepts_pasted_recipe_and_uses_first_line_as_title(self) -> None:
        recipe = parse_recipe_text("# Apple Pie\n\nIngredients\n- 1 apple\n\nDirections\nBake it.")

        self.assertIsNone(recipe.url)
        self.assertEqual(recipe.title, "Apple Pie")
        self.assertIn("Directions", recipe.text)

    def test_rejects_empty_or_oversized_recipe_text(self) -> None:
        with self.assertRaisesRegex(ValueError, "full recipe text"):
            parse_recipe_text("  ")
        with self.assertRaisesRegex(ValueError, "50,000"):
            parse_recipe_text("x" * 50_001)

    def test_detects_same_active_recipe_across_accents_and_generated_task_name(self) -> None:
        recipes = [ExtractedRecipe(url=None, title="Mandioca Assada", text="Mandioca Assada")]
        tasks = [
            {
                "name": "Creating bilingual recipe for Mandioca assada",
                "recipe_name": "Crispy Parmesan Cassava",
                "stage": {"key": "checking"},
            }
        ]

        self.assertEqual(duplicate_active_recipe(recipes, tasks), "Crispy Parmesan Cassava")

    def test_ignores_completed_and_different_active_recipes(self) -> None:
        recipes = [ExtractedRecipe(url=None, title="Apple Pie", text="Apple Pie")]
        tasks = [
            {
                "name": "Creating recipe for Apple Pie",
                "recipe_name": "Apple Pie",
                "stage": {"key": "added"},
            },
            {
                "name": "Creating recipe for Bean Soup",
                "recipe_name": "Bean Soup",
                "stage": {"key": "preparing"},
            },
        ]

        self.assertIsNone(duplicate_active_recipe(recipes, tasks))


class ImportApiTests(unittest.TestCase):
    @patch("app.get_tasks", return_value=[])
    @patch("app.extract_recipes")
    @patch("app.submit_agent_task", return_value="https://github.com/SamChaps/monmanger/agent-sessions/1")
    def test_submits_pasted_recipe_without_url_extraction(
        self,
        submit_agent_task,
        extract_recipes,
        get_tasks,
    ) -> None:
        server = create_server("127.0.0.1", 0)
        server_thread = threading.Thread(target=server.serve_forever)
        server_thread.start()
        try:
            request = Request(
                f"http://127.0.0.1:{server.server_address[1]}/api/import",
                data=json.dumps({
                    "mode": "text",
                    "recipeText": "Apple Pie\n\nIngredients\n- 4 apples\n\nDirections\nBake it.",
                }).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urlopen(request) as response:
                payload = json.load(response)
        finally:
            server.shutdown()
            server.server_close()
            server_thread.join()

        self.assertEqual(response.status, 202)
        self.assertEqual(payload["recipes"], [{"url": None, "title": "Apple Pie"}])
        extract_recipes.assert_not_called()
        get_tasks.assert_called_once_with()
        self.assertIn('"source_type": "pasted_text"', submit_agent_task.call_args.args[0])

    @patch("app.get_tasks")
    @patch("app.submit_agent_task")
    def test_rejects_duplicate_active_recipe(self, submit_agent_task, get_tasks) -> None:
        get_tasks.return_value = [
            {
                "name": "Creating a bilingual recipe for Apple Pie",
                "recipe_name": "Apple Pie",
                "stage": {"key": "checking"},
            }
        ]
        server = create_server("127.0.0.1", 0)
        server_thread = threading.Thread(target=server.serve_forever)
        server_thread.start()
        try:
            request = Request(
                f"http://127.0.0.1:{server.server_address[1]}/api/import",
                data=json.dumps({
                    "mode": "text",
                    "recipeText": "Apple Pie\n\nIngredients\n- 4 apples",
                }).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with self.assertRaises(HTTPError) as raised:
                urlopen(request)
            payload = json.load(raised.exception)
        finally:
            server.shutdown()
            server.server_close()
            server_thread.join()

        self.assertEqual(raised.exception.code, 409)
        self.assertEqual(
            payload["error"],
            "Apple Pie is already being added. Cancel it before trying again.",
        )
        submit_agent_task.assert_not_called()


class PromptTests(unittest.TestCase):
    def setUp(self) -> None:
        self.recipe = ExtractedRecipe(
            url="https://example.com/pie",
            title="Apple Pie",
            text="Source: https://example.com/pie\n\nApple Pie\n\nIngredients:\n - 1 apple",
        )

    def test_marks_extracted_content_as_untrusted(self) -> None:
        prompt = build_agent_prompt([self.recipe], notes="Use six servings.")

        self.assertTrue(prompt.startswith("Create a bilingual Mon Manger recipe for Apple Pie."))
        self.assertIn("untrusted recipe data", prompt)
        self.assertIn('"url": "https://example.com/pie"', prompt)
        self.assertIn('"source_type": "url"', prompt)
        self.assertIn("Use six servings.", prompt)
        self.assertIn("ready for review", prompt)
        self.assertIn("use only tags already present", prompt)
        self.assertIn("Do not modify _data/tags.yml", prompt)

    def test_labels_pasted_recipe_text_without_a_source_url(self) -> None:
        prompt = build_agent_prompt([parse_recipe_text("Apple Pie\n\nIngredients\n- 1 apple")])

        self.assertIn('"source_type": "pasted_text"', prompt)
        self.assertNotIn('"url"', prompt)
        self.assertIn("Do not run the extraction script", prompt)
        self.assertIn('use "Personal recipe" as the source', prompt)

    def test_review_mode_requests_a_wip_draft(self) -> None:
        prompt = build_agent_prompt([self.recipe], pause_for_review=True)

        self.assertIn("[WIP]", prompt)
        self.assertIn("draft", prompt)

    def test_extracts_title_from_recipe_text(self) -> None:
        self.assertEqual(recipe_title(self.recipe.text, self.recipe.url), "Apple Pie")


class ActivityTests(unittest.TestCase):
    def setUp(self) -> None:
        self.task = {
            "name": "Creating bilingual Mon Manger recipe for apple pie",
            "state": "completed",
            "html_url": "https://github.com/example/tasks/1",
        }
        self.pull_request = {
            "number": 12,
            "title": "Add Apple Pie recipe from Example",
            "url": "https://github.com/example/pull/12",
            "state": "MERGED",
            "isDraft": False,
            "mergedAt": "2026-08-31T12:00:00Z",
            "files": {"nodes": [{"path": "_recipes/apple-pie.md"}]},
        }

    def test_uses_pull_recipe_name_and_marks_deployed_recipe_added(self) -> None:
        deploy_runs = [
            {
                "created_at": "2026-08-31T12:01:00Z",
                "status": "completed",
                "conclusion": "success",
            },
            {
                "created_at": "2026-08-31T14:00:00Z",
                "status": "in_progress",
                "conclusion": None,
            }
        ]
        enriched = enrich_task(self.task, self.pull_request, deploy_runs)

        self.assertEqual(enriched["recipe_name"], "Apple Pie")
        self.assertEqual(enriched["recipe_url"], "https://monmanger.com/recipes/apple-pie/")
        self.assertEqual(enriched["stage"]["key"], "added")

    def test_marks_merged_recipe_as_publishing_until_deploy_finishes(self) -> None:
        stage = activity_stage(self.task, self.pull_request, [])

        self.assertEqual(stage, {"key": "publishing", "label": "Publishing", "step": 4, "tone": "progress"})

    def test_marks_wip_recipe_ready_for_review(self) -> None:
        pull_request = {**self.pull_request, "state": "OPEN", "title": "[WIP] Add Apple Pie"}

        stage = activity_stage(self.task, pull_request, [])

        self.assertEqual(stage["key"], "review")
        self.assertEqual(stage["label"], "Ready for review")

    def test_marks_conflicting_recipe_as_blocked(self) -> None:
        pull_request = {**self.pull_request, "state": "OPEN", "mergeable": "CONFLICTING"}

        stage = activity_stage(self.task, pull_request, [])

        self.assertEqual(stage, {"key": "blocked", "label": "Blocked", "step": 3, "tone": "error"})

    def test_marks_closed_unmerged_recipe_as_canceled(self) -> None:
        pull_request = {**self.pull_request, "state": "CLOSED", "mergedAt": None}

        stage = activity_stage(self.task, pull_request, [])

        self.assertEqual(stage, {"key": "cancelled", "label": "Canceled", "step": 2, "tone": "cancelled"})

    def test_cleans_generated_task_and_pull_titles(self) -> None:
        examples = {
            "Add Vegan Smash Burger Tacos recipe from Radio-Canada Mordu": "Vegan Smash Burger Tacos",
            "Creating bilingual Mon Manger recipe for tacos smash burgers": "tacos smash burgers",
            "Adding recipe from Ti-Breiz restaurant": "Ti-Breiz",
            "Creating bilingual Mon Manger recipes from provided data": "New recipe",
            "Add lime loaf cake recipe and tag metadata": "Lime Loaf Cake",
            'Add "The 5-Minute Oreo Protein Mug Cake" recipe': "The 5-Minute Oreo Protein Mug Cake",
            "Add bilingual recipe: Pain au zucchini, à l'orange et au chocolat": "Pain au zucchini, à l'orange et au chocolat",
            "Add bilingual Homemade Labneh recipe": "Homemade Labneh",
        }

        for value, expected in examples.items():
            with self.subTest(value=value):
                self.assertEqual(friendly_recipe_name(value), expected)

    def test_extracts_submission_pr_number_and_cleans_wip_title(self) -> None:
        submission = "https://github.com/SamChaps/monmanger/pull/42/agent-sessions/example"

        self.assertEqual(submission_pr_number(submission), 42)
        self.assertEqual(clean_review_title("[WIP] Add Apple Pie recipe"), "Add Apple Pie recipe")

    @patch("app.run_command")
    def test_finds_pull_request_by_branch_when_global_id_is_missing(self, run_command) -> None:
        task = {
            "artifacts": [
                {"type": "pull", "data": {"global_id": ""}},
                {"type": "branch", "data": {"head_ref": "copilot/add-apple-pie"}},
            ]
        }
        run_command.return_value = json.dumps([
            {
                "number": 42,
                "title": "Add Apple Pie recipe",
                "url": "https://github.com/example/pull/42",
                "state": "OPEN",
                "isDraft": True,
                "mergedAt": None,
                "headRefName": "copilot/add-apple-pie",
                "files": [{"path": "_recipes/apple-pie.md"}],
            }
        ])

        pull_requests = get_pull_requests([task])
        pull_request = pull_request_for_task(task, pull_requests)

        self.assertEqual(pull_request["number"], 42)
        self.assertEqual(pull_request["files"]["nodes"], [{"path": "_recipes/apple-pie.md"}])

    @patch("app.dispatch_publish_workflow")
    def test_dispatches_completed_non_review_recipe_once(self, dispatch_publish_workflow) -> None:
        task = {
            "state": "completed",
            "artifacts": [{"type": "branch", "data": {"head_ref": "copilot/add-apple-pie"}}],
        }
        pull_requests = {
            "copilot/add-apple-pie": {"number": 42, "state": "OPEN", "title": "Add Apple Pie recipe"}
        }

        dispatch_completed_recipes([task], pull_requests)

        dispatch_publish_workflow.assert_called_once_with(42)

    @patch("app.dispatch_publish_workflow")
    def test_does_not_dispatch_incomplete_or_review_recipe(self, dispatch_publish_workflow) -> None:
        tasks = [
            {
                "state": "in_progress",
                "artifacts": [{"type": "branch", "data": {"head_ref": "copilot/active"}}],
            },
            {
                "state": "completed",
                "artifacts": [{"type": "branch", "data": {"head_ref": "copilot/review"}}],
            },
        ]
        pull_requests = {
            "copilot/active": {"number": 41, "state": "OPEN", "title": "Add Active Recipe"},
            "copilot/review": {"number": 42, "state": "OPEN", "title": "[WIP] Add Review Recipe"},
        }

        dispatch_completed_recipes(tasks, pull_requests)

        dispatch_publish_workflow.assert_not_called()

    @patch("app.run_command")
    def test_publishing_a_reviewed_recipe_removes_wip_and_dispatches_workflow(self, run_command) -> None:
        run_command.side_effect = [
            '{"author":{"login":"app/copilot-swe-agent"},"state":"OPEN","title":"[WIP] Add Apple Pie"}',
            "",
            "",
        ]

        publish_reviewed_recipe(42)

        self.assertEqual(
            run_command.call_args_list,
            [
                call(
                    [
                        "gh", "pr", "view", "42", "--repo", "SamChaps/monmanger",
                        "--json", "author,state,title",
                    ],
                    timeout=30,
                ),
                call(
                    [
                        "gh", "pr", "edit", "42", "--repo", "SamChaps/monmanger",
                        "--title", "Add Apple Pie",
                    ],
                    timeout=30,
                ),
                call(
                    [
                        "gh", "workflow", "run", "auto-merge.yml", "--repo",
                        "SamChaps/monmanger", "--ref", "main", "-f", "pr_number=42",
                    ],
                    timeout=30,
                ),
            ],
        )

    @patch("app.get_tasks")
    @patch("app.run_command")
    def test_cancel_closes_trusted_task_pull_request(self, run_command, get_tasks) -> None:
        get_tasks.return_value = [
            {
                "id": "task-1",
                "pull_number": 42,
                "stage": {"key": "checking"},
            }
        ]
        run_command.side_effect = [
            '{"author":{"login":"app/copilot-swe-agent"},"state":"OPEN"}',
            "",
        ]

        cancel_recipe("task-1", 42)

        get_tasks.assert_called_once_with(dispatch=False)
        self.assertEqual(
            run_command.call_args_list,
            [
                call(
                    [
                        "gh", "pr", "view", "42", "--repo", "SamChaps/monmanger",
                        "--json", "author,state",
                    ],
                    timeout=30,
                ),
                call(
                    [
                        "gh", "pr", "close", "42", "--repo", "SamChaps/monmanger",
                        "--delete-branch", "--comment", "Canceled from Add Recipes.",
                    ],
                    timeout=30,
                ),
            ],
        )


if __name__ == "__main__":
    unittest.main()