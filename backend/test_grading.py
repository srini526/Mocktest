import json
import unittest
from pathlib import Path
import re

from answer_key import ANSWER_KEY
from grading import grade_answer, normalize_answer


class GradingTests(unittest.TestCase):
    def test_normalization_ignores_case_punctuation_and_accents(self):
        self.assertEqual(normalize_answer("  BRASÍLIA! "), "brasilia")

    def test_multiple_choice_accepts_only_the_server_answer(self):
        definition = ANSWER_KEY["general-knowledge-01"][1]
        self.assertEqual(grade_answer("Tokyo", definition), 1.0)
        self.assertEqual(grade_answer("Beijing", definition), 0.0)

    def test_text_answers_accept_configured_variants(self):
        definition = ANSWER_KEY["logical-puzzles-01"][11]
        self.assertEqual(grade_answer("an hour", definition), 1.0)
        self.assertEqual(grade_answer("30 minutes", definition), 0.0)

    def test_empty_answer_receives_no_credit(self):
        definition = ANSWER_KEY["general-knowledge-01"][1]
        self.assertEqual(grade_answer("", definition), 0.0)

    def test_answer_key_covers_every_question_in_the_frontend_catalog(self):
        catalog_path = Path(__file__).parents[1] / "frontend" / "src" / "data" / "exams.js"
        catalog = catalog_path.read_text(encoding="utf-8")
        question_ids = re.findall(r"\{ id: (\d+), '?type'?: '(?:mcq|text)'", catalog)
        self.assertEqual(len(question_ids), sum(len(questions) for questions in ANSWER_KEY.values()))
        self.assertEqual(len(ANSWER_KEY), 3)
        for questions in ANSWER_KEY.values():
            self.assertEqual(set(questions), set(range(1, 26)))

    def test_multiple_choice_keys_match_the_frontend_options(self):
        catalog_path = Path(__file__).parents[1] / "frontend" / "src" / "data" / "exams.js"
        catalog = catalog_path.read_text(encoding="utf-8")
        for exam_id, answer_definitions in ANSWER_KEY.items():
            exam = re.search(
                rf"id: '{re.escape(exam_id)}',[\s\S]*?questions: \[([\s\S]*?)\n    \]",
                catalog,
            )
            self.assertIsNotNone(exam, exam_id)
            question_lines = re.findall(
                r"\{ id: (\d+), '?type'?: '(mcq|text)', (.*)\}",
                exam.group(1),
            )
            for question_id, question_type, question_body in question_lines:
                definition = answer_definitions[int(question_id)]
                self.assertEqual(question_type, definition["type"], f"{exam_id} question {question_id}")
                if question_type == "mcq":
                    options_match = re.search(r"options: (\[.*\])", question_body)
                    self.assertIsNotNone(options_match, f"{exam_id} question {question_id}")
                    options = json.loads(options_match.group(1))
                    self.assertIn(definition["answer"], options, f"{exam_id} question {question_id}")


if __name__ == "__main__":
    unittest.main()
