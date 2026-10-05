import os
import unittest

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SESSION_SECRET_KEY"] = "test-session-secret"
os.environ["ADMIN_EMAIL"] = "admin@example.test"
os.environ["ADMIN_PASSWORD"] = "test-admin-password-123"

from api import ANSWER_KEY, ExamAccess, ScoreOverride, Submission, User, app, db, initialize_database


class ExamApiTests(unittest.TestCase):
    def setUp(self):
        app.config.update(TESTING=True, WTF_CSRF_ENABLED=True)
        self.admin = app.test_client()
        self.student = app.test_client()
        with app.app_context():
            db.drop_all()
            initialize_database()

        self._login(self.admin, "admin@example.test", "test-admin-password-123")
        registration = self._post(
            self.student,
            "/auth/register",
            {
                "displayName": "Test Student",
                "email": "student@example.test",
                "password": "student-test-password-123",
            },
        )
        self.assertEqual(registration.status_code, 201)
        with app.app_context():
            student = User.query.filter_by(email="student@example.test").first()
            self.student_id = student.id

        self._post(
            self.admin,
            f"/admin/users/{self.student_id}/status",
            {"status": "active"},
            method="PATCH",
        )
        self._post(
            self.admin,
            f"/admin/users/{self.student_id}/access",
            {"examIds": ["general-knowledge-01"]},
            method="PUT",
        )
        self._login(self.student, "student@example.test", "student-test-password-123")

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def _post(self, client, path, payload, method="POST"):
        csrf_token = client.get("/auth/csrf").get_json()["csrfToken"]
        return client.open(
            path,
            method=method,
            json=payload,
            headers={"X-CSRF-Token": csrf_token},
        )

    def _login(self, client, email, password):
        response = self._post(client, "/auth/login", {"email": email, "password": password})
        self.assertEqual(response.status_code, 200, response.get_json())
        return response.get_json()["user"]

    def test_mcq_scoring_uses_full_exam_denominator_and_authenticated_student_id(self):
        response = self._post(
            self.student,
            "/submit-exam",
            {
                "examId": "general-knowledge-01",
                "userId": "spoofed-user",
                "answers": [{"id": 1, "answer": "Tokyo"}],
            },
        )

        self.assertEqual(response.status_code, 200)
        result = response.get_json()
        self.assertEqual(result["finalScore"], 4.0)
        self.assertEqual(result["automaticScore"], 4.0)
        self.assertEqual(result["totalScore"], 1.0)
        self.assertEqual(result["questionsAnswered"], 1)
        self.assertEqual(result["correctAnswers"], 1)
        self.assertEqual(result["totalQuestions"], 25)
        self.assertEqual(len(result["results"]), 25)
        with app.app_context():
            saved = Submission.query.filter_by(attempt_id=result["attemptId"]).first()
            self.assertEqual(saved.user_id, self.student_id)

    def test_first_option_is_scored_and_client_cannot_choose_correct_answer(self):
        response = self._post(
            self.student,
            "/submit-exam",
            {
                "examId": "general-knowledge-01",
                "answers": [{"id": 15, "answer": "Mexico City", "correctAnswer": "wrong"}],
            },
        )

        self.assertEqual(response.status_code, 200)
        answer = next(item for item in response.get_json()["results"] if item["questionId"] == 15)
        self.assertEqual(answer["score"], 1.0)

    def test_duplicate_answers_are_rejected(self):
        response = self._post(
            self.student,
            "/submit-exam",
            {
                "examId": "general-knowledge-01",
                "answers": [{"id": 1, "answer": "Tokyo"}, {"id": 1, "answer": "Beijing"}],
            },
        )

        self.assertEqual(response.status_code, 400)
        with app.app_context():
            self.assertEqual(Submission.query.count(), 0)

    def test_access_is_required_and_client_cannot_submit_for_another_student(self):
        with app.app_context():
            ExamAccess.query.filter_by(user_id=self.student_id).delete()
            db.session.commit()
        response = self._post(
            self.student,
            "/submit-exam",
            {"examId": "general-knowledge-01", "answers": []},
        )
        self.assertEqual(response.status_code, 403)
        with app.app_context():
            self.assertEqual(Submission.query.count(), 0)

    def test_student_registration_requires_admin_approval(self):
        pending_client = app.test_client()
        registration = self._post(
            pending_client,
            "/auth/register",
            {
                "displayName": "Pending Student",
                "email": "pending@example.test",
                "password": "pending-student-password",
            },
        )
        self.assertEqual(registration.status_code, 201)
        login_response = self._post(
            pending_client,
            "/auth/login",
            {"email": "pending@example.test", "password": "pending-student-password"},
        )
        self.assertEqual(login_response.status_code, 403)
        self.assertIn("approval", login_response.get_json()["error"].lower())

    def test_admin_score_override_is_reasoned_audited_and_shown_in_student_history(self):
        submit_response = self._post(
            self.student,
            "/submit-exam",
            {
                "examId": "general-knowledge-01",
                "answers": [{"id": 1, "answer": "Tokyo"}],
            },
        )
        attempt_id = submit_response.get_json()["attemptId"]
        override_response = self._post(
            self.admin,
            f"/admin/attempts/{attempt_id}/score",
            {"score": 88.5, "reason": "Manual review accepted an alternative answer."},
        )

        self.assertEqual(override_response.status_code, 200)
        with app.app_context():
            self.assertEqual(ScoreOverride.query.filter_by(attempt_id=attempt_id).count(), 1)
        history = self.student.get("/auth/attempts").get_json()
        self.assertEqual(history[0]["automaticScore"], 4.0)
        self.assertEqual(history[0]["finalScore"], 88.5)
        self.assertTrue(history[0]["isOverridden"])

    def test_score_override_requires_reason_and_valid_range(self):
        attempt_id = self._post(
            self.student,
            "/submit-exam",
            {"examId": "general-knowledge-01", "answers": []},
        ).get_json()["attemptId"]
        missing_reason = self._post(
            self.admin,
            f"/admin/attempts/{attempt_id}/score",
            {"score": 80, "reason": "too short"},
        )
        too_high = self._post(
            self.admin,
            f"/admin/attempts/{attempt_id}/score",
            {"score": 101, "reason": "A valid explanation for this score."},
        )
        self.assertEqual(missing_reason.status_code, 400)
        self.assertEqual(too_high.status_code, 400)
        with app.app_context():
            self.assertEqual(ScoreOverride.query.count(), 0)

    def test_admin_routes_require_admin_role(self):
        response = self.student.get("/admin/users")
        self.assertEqual(response.status_code, 403)

    def test_student_and_admin_login_routes_restrict_account_roles(self):
        student_client = app.test_client()
        admin_client = app.test_client()

        wrong_admin_form = self._post(
            student_client,
            "/auth/admin/login",
            {"email": "student@example.test", "password": "student-test-password-123"},
        )
        wrong_student_form = self._post(
            admin_client,
            "/auth/student/login",
            {"email": "admin@example.test", "password": "test-admin-password-123"},
        )
        student_login = self._post(
            student_client,
            "/auth/student/login",
            {"email": "student@example.test", "password": "student-test-password-123"},
        )
        admin_login = self._post(
            admin_client,
            "/auth/admin/login",
            {"email": "admin@example.test", "password": "test-admin-password-123"},
        )

        self.assertEqual(wrong_admin_form.status_code, 403)
        self.assertEqual(wrong_student_form.status_code, 403)
        self.assertEqual(student_login.status_code, 200)
        self.assertEqual(student_login.get_json()["user"]["role"], "student")
        self.assertEqual(admin_login.status_code, 200)
        self.assertEqual(admin_login.get_json()["user"]["role"], "admin")

    def test_question_reports_are_saved_for_the_logged_in_student(self):
        response = self._post(
            self.student,
            "/question-reports",
            {
                "examId": "general-knowledge-01",
                "questionId": 1,
                "userId": "spoofed-user",
                "message": "The question has a typo in the prompt.",
            },
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["message"], "Thanks. Your question report has been submitted.")

    def test_every_catalog_exam_has_a_server_side_answer_key(self):
        self.assertEqual(set(ANSWER_KEY), {
            "general-knowledge-01",
            "verbal-reasoning-advanced-01",
            "logical-puzzles-01",
        })
        self.assertTrue(all(len(questions) == 25 for questions in ANSWER_KEY.values()))


if __name__ == "__main__":
    unittest.main()
