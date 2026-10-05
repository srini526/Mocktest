import math
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from functools import wraps

from dotenv import load_dotenv
from flask import Flask, g, jsonify, request, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

from answer_key import ANSWER_KEY
from grading import grade_answer


basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(os.path.dirname(basedir), ".env"))

app = Flask(__name__)
app.config.update(
    SECRET_KEY=os.environ.get("SESSION_SECRET_KEY"),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE=os.environ.get("SESSION_COOKIE_SAMESITE", "Lax"),
    SESSION_COOKIE_SECURE=os.environ.get("SESSION_COOKIE_SECURE", "false").lower() == "true",
    PERMANENT_SESSION_LIFETIME=timedelta(hours=12),
    MAX_CONTENT_LENGTH=64 * 1024,
    SQLALCHEMY_DATABASE_URI=os.environ.get(
        "DATABASE_URL",
        "sqlite:///" + os.path.join(basedir, "instance", "answers.db"),
    ),
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
)
if not app.config["SECRET_KEY"]:
    raise RuntimeError("SESSION_SECRET_KEY must be configured in the environment or root .env file.")

CORS(
    app,
    supports_credentials=True,
    resources={r"/*": {"origins": [
        origin.strip()
        for origin in os.environ.get("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
        if origin.strip()
    ]}},
)

os.makedirs(os.path.join(basedir, "instance"), exist_ok=True)
db = SQLAlchemy(app)


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(254), unique=True, nullable=False, index=True)
    display_name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(16), nullable=False, default="student")
    status = db.Column(db.String(16), nullable=False, default="pending")
    created_at = db.Column(db.DateTime, default=utc_now, nullable=False)


class ExamAccess(db.Model):
    __tablename__ = "exam_access"
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    exam_id = db.Column(db.String(80), primary_key=True)
    granted_by = db.Column(db.String(36), nullable=False)
    granted_at = db.Column(db.DateTime, default=utc_now, nullable=False)


class Submission(db.Model):
    __tablename__ = "submissions"
    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.String, nullable=False, index=True)
    user_id = db.Column(db.String, nullable=False, index=True)
    exam_id = db.Column(db.String, nullable=False, index=True)
    question_id = db.Column(db.Integer, nullable=False)
    user_answer = db.Column(db.String)
    correct_answer = db.Column(db.String)
    accuracy_score = db.Column(db.Float)
    score = db.Column(db.Float)
    submitted_at = db.Column(db.DateTime, default=utc_now, nullable=False, index=True)


class ScoreOverride(db.Model):
    __tablename__ = "score_overrides"
    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.String, nullable=False, index=True)
    adjusted_score = db.Column(db.Float, nullable=False)
    reason = db.Column(db.String(1000), nullable=False)
    admin_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=utc_now, nullable=False)


class QuestionReport(db.Model):
    __tablename__ = "question_reports"
    id = db.Column(db.Integer, primary_key=True)
    exam_id = db.Column(db.String, nullable=False, index=True)
    question_id = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.String, nullable=False)
    message = db.Column(db.String(1000), nullable=False)
    submitted_at = db.Column(db.DateTime, default=utc_now, nullable=False)


@app.before_request
def require_csrf_token():
    if request.method not in {"POST", "PUT", "PATCH", "DELETE"}:
        return None

    expected = session.get("csrf_token")
    provided = request.headers.get("X-CSRF-Token", "")
    if not expected or not secrets.compare_digest(expected, provided):
        return jsonify({"error": "Your session expired. Refresh the page and try again."}), 403
    return None


def current_user():
    if not hasattr(g, "user"):
        user_id = session.get("user_id")
        g.user = db.session.get(User, user_id) if user_id else None
    return g.user


def login_required(handler):
    @wraps(handler)
    def wrapped(*args, **kwargs):
        if not current_user():
            return jsonify({"error": "Please sign in to continue."}), 401
        return handler(*args, **kwargs)
    return wrapped


def active_student_required(handler):
    @wraps(handler)
    @login_required
    def wrapped(*args, **kwargs):
        user = current_user()
        if user.role != "student":
            return jsonify({"error": "A student account is required."}), 403
        if user.status != "active":
            return jsonify({"error": "Your account is awaiting admin approval."}), 403
        return handler(*args, **kwargs)
    return wrapped


def admin_required(handler):
    @wraps(handler)
    @login_required
    def wrapped(*args, **kwargs):
        user = current_user()
        if user.role != "admin" or user.status != "active":
            return jsonify({"error": "Admin access is required."}), 403
        return handler(*args, **kwargs)
    return wrapped


def get_request_data():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else None


def ensure_exam_access(user_id, exam_id):
    return db.session.get(ExamAccess, (user_id, exam_id)) is not None


def latest_score_override(attempt_id):
    return ScoreOverride.query.filter_by(attempt_id=attempt_id).order_by(
        ScoreOverride.created_at.desc(), ScoreOverride.id.desc()
    ).first()


def attempt_summary(submissions, include_answers=False):
    if not submissions:
        return None
    first = submissions[0]
    total_questions = len(submissions)
    raw_points = sum(row.score or 0 for row in submissions)
    automatic_score = round(raw_points / total_questions * 100, 2) if total_questions else 0
    answered_count = sum(bool((row.user_answer or "").strip()) for row in submissions)
    correct_count = sum((row.score or 0) >= 1 for row in submissions)
    override = latest_score_override(first.attempt_id)
    summary = {
        "attemptId": first.attempt_id,
        "userId": first.user_id,
        "examId": first.exam_id,
        "submittedAt": first.submitted_at.strftime("%Y-%m-%d %H:%M:%S"),
        "automaticScore": automatic_score,
        "finalScore": override.adjusted_score if override else automatic_score,
        "isOverridden": override is not None,
        "overrideReason": override.reason if override else None,
        "questionsAnswered": answered_count,
        "correctAnswers": correct_count,
        "totalQuestions": total_questions,
    }
    if include_answers:
        summary["results"] = [
            {
                "questionId": row.question_id,
                "userAnswer": row.user_answer or "",
                "correctAnswer": row.correct_answer,
                "score": row.score or 0,
            }
            for row in sorted(submissions, key=lambda answer: answer.question_id)
        ]
    return summary


def load_attempts_for_user(user_id):
    rows = Submission.query.filter_by(user_id=user_id).order_by(
        Submission.submitted_at.desc(), Submission.id.desc()
    ).all()
    grouped = {}
    for row in rows:
        grouped.setdefault(row.attempt_id, []).append(row)
    return [
        attempt_summary(attempt, include_answers=True)
        for attempt in grouped.values()
    ]


@app.get("/health")
def health_check():
    return jsonify({"status": "ok"})


@app.get("/auth/csrf")
def csrf_token():
    token = session.get("csrf_token")
    if not token:
        token = secrets.token_urlsafe(32)
        session["csrf_token"] = token
    return jsonify({"csrfToken": token})


@app.get("/auth/me")
def get_current_user():
    user = current_user()
    if not user:
        return jsonify({"user": None})
    return jsonify({
        "user": {
            "id": user.id,
            "email": user.email,
            "displayName": user.display_name,
            "role": user.role,
            "status": user.status,
            "examAccess": [
                access.exam_id for access in ExamAccess.query.filter_by(user_id=user.id).all()
            ] if user.role == "student" else [],
        }
    })


@app.post("/auth/register")
def register_student():
    data = get_request_data()
    if data is None:
        return jsonify({"error": "A JSON request body is required."}), 400

    name = data.get("displayName")
    email = data.get("email")
    password = data.get("password")
    if not isinstance(name, str) or not 2 <= len(name.strip()) <= 100:
        return jsonify({"error": "Enter a name between 2 and 100 characters."}), 400
    if not isinstance(email, str) or not 3 <= len(email.strip()) <= 254 or "@" not in email:
        return jsonify({"error": "Enter a valid email address."}), 400
    if not isinstance(password, str) or len(password) < 12:
        return jsonify({"error": "Password must be at least 12 characters."}), 400

    normalized_email = email.strip().lower()
    if User.query.filter_by(email=normalized_email).first():
        return jsonify({"error": "An account with that email already exists."}), 409

    user = User(
        email=normalized_email,
        display_name=name.strip(),
        password_hash=generate_password_hash(password),
        role="student",
        status="pending",
    )
    try:
        db.session.add(user)
        db.session.commit()
    except Exception:
        db.session.rollback()
        app.logger.exception("Failed to register student")
        return jsonify({"error": "Your account could not be created. Please try again."}), 500
    return jsonify({"message": "Account created. An admin must approve your account and test access before you can begin."}), 201


@app.post("/auth/login")
@app.post("/auth/student/login")
@app.post("/auth/admin/login")
def login():
    data = get_request_data()
    if data is None:
        return jsonify({"error": "A JSON request body is required."}), 400
    email = data.get("email")
    password = data.get("password")
    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify({"error": "Enter your email and password."}), 400

    user = User.query.filter_by(email=email.strip().lower()).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Email or password is incorrect."}), 401
    required_role = {
        "/auth/student/login": "student",
        "/auth/admin/login": "admin",
    }.get(request.path)
    if required_role and user.role != required_role:
        return jsonify({"error": f"Use the {user.role} sign-in page for this account."}), 403
    if user.status == "pending":
        return jsonify({"error": "Your account is awaiting admin approval."}), 403
    if user.status != "active":
        return jsonify({"error": "This account has been disabled. Contact the administrator."}), 403

    session.clear()
    session.permanent = True
    session["user_id"] = user.id
    session["csrf_token"] = secrets.token_urlsafe(32)
    return jsonify({
        "message": "Signed in successfully.",
        "csrfToken": session["csrf_token"],
        "user": {
            "id": user.id,
            "email": user.email,
            "displayName": user.display_name,
            "role": user.role,
            "status": user.status,
            "examAccess": [access.exam_id for access in ExamAccess.query.filter_by(user_id=user.id).all()],
        },
    })


@app.post("/auth/logout")
@login_required
def logout():
    session.clear()
    return jsonify({"message": "Signed out."})


@app.get("/auth/attempts")
@active_student_required
def get_student_attempts():
    return jsonify(load_attempts_for_user(current_user().id))


@app.post("/submit-exam")
@active_student_required
def submit_exam_endpoint():
    data = get_request_data()
    if data is None:
        return jsonify({"error": "A JSON request body is required."}), 400

    exam_id = data.get("examId")
    if not isinstance(exam_id, str) or exam_id not in ANSWER_KEY:
        return jsonify({"error": "The requested exam does not exist."}), 404
    if not ensure_exam_access(current_user().id, exam_id):
        return jsonify({"error": "An admin has not granted access to this test."}), 403

    submitted_answers = data.get("answers")
    if not isinstance(submitted_answers, list) or len(submitted_answers) > 100:
        return jsonify({"error": "Answers must be a list containing at most 100 items."}), 400

    answer_definitions = ANSWER_KEY[exam_id]
    submitted_by_question = {}
    for item in submitted_answers:
        if not isinstance(item, dict):
            return jsonify({"error": "Each answer must be an object."}), 400
        question_id = item.get("id")
        if isinstance(question_id, bool) or not isinstance(question_id, int):
            return jsonify({"error": "Each answer must include a valid question ID."}), 400
        if question_id not in answer_definitions:
            return jsonify({"error": f"Question {question_id} is not part of this exam."}), 400
        if question_id in submitted_by_question:
            return jsonify({"error": f"Question {question_id} was submitted more than once."}), 400
        answer = item.get("answer", "")
        if not isinstance(answer, str) or len(answer) > 1000:
            return jsonify({"error": "Answers must be text with at most 1000 characters."}), 400
        submitted_by_question[question_id] = answer.strip()

    attempt_id = str(uuid.uuid4())
    submitted_at = utc_now()
    total_score = 0.0
    questions_answered = 0
    correct_count = 0
    result_details = []

    try:
        for question_id, definition in answer_definitions.items():
            user_answer = submitted_by_question.get(question_id, "")
            score = grade_answer(user_answer, definition)
            questions_answered += bool(user_answer)
            correct_count += score == 1.0
            total_score += score
            db.session.add(Submission(
                attempt_id=attempt_id,
                user_id=current_user().id,
                exam_id=exam_id,
                question_id=question_id,
                user_answer=user_answer,
                correct_answer=definition["answer"],
                accuracy_score=score * 100,
                score=score,
                submitted_at=submitted_at,
            ))
            result_details.append({
                "questionId": question_id,
                "userAnswer": user_answer,
                "correctAnswer": definition["answer"],
                "score": score,
            })
        db.session.commit()
    except Exception:
        db.session.rollback()
        app.logger.exception("Failed to save exam submission")
        return jsonify({"error": "The exam could not be saved. Please try again."}), 500

    total_questions = len(answer_definitions)
    return jsonify({
        "message": "Exam submitted successfully.",
        "attemptId": attempt_id,
        "examId": exam_id,
        "automaticScore": round(total_score / total_questions * 100, 2),
        "finalScore": round(total_score / total_questions * 100, 2),
        "totalScore": round(total_score, 2),
        "questionsAnswered": questions_answered,
        "correctAnswers": correct_count,
        "totalQuestions": total_questions,
        "isOverridden": False,
        "results": result_details,
    })


@app.post("/question-reports")
@active_student_required
def submit_question_report():
    data = get_request_data()
    if data is None:
        return jsonify({"error": "A JSON request body is required."}), 400

    exam_id = data.get("examId")
    question_id = data.get("questionId")
    message = data.get("message")
    if not isinstance(exam_id, str) or exam_id not in ANSWER_KEY:
        return jsonify({"error": "The requested exam does not exist."}), 404
    if not isinstance(question_id, int) or isinstance(question_id, bool) or question_id not in ANSWER_KEY[exam_id]:
        return jsonify({"error": "The requested question does not exist."}), 400
    if not ensure_exam_access(current_user().id, exam_id):
        return jsonify({"error": "An admin has not granted access to this test."}), 403
    if not isinstance(message, str) or not 10 <= len(message.strip()) <= 1000:
        return jsonify({"error": "Please provide a report between 10 and 1000 characters."}), 400

    try:
        db.session.add(QuestionReport(
            exam_id=exam_id,
            question_id=question_id,
            user_id=current_user().id,
            message=message.strip(),
        ))
        db.session.commit()
    except Exception:
        db.session.rollback()
        app.logger.exception("Failed to save question report")
        return jsonify({"error": "Your report could not be saved. Please try again."}), 500
    return jsonify({"message": "Thanks. Your question report has been submitted."}), 201


@app.get("/admin/users")
@admin_required
def get_admin_users():
    students = User.query.filter_by(role="student").order_by(User.created_at.desc()).all()
    return jsonify([
        {
            "id": student.id,
            "email": student.email,
            "displayName": student.display_name,
            "status": student.status,
            "createdAt": student.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "examAccess": [
                access.exam_id for access in ExamAccess.query.filter_by(user_id=student.id).all()
            ],
        }
        for student in students
    ])


@app.patch("/admin/users/<user_id>/status")
@admin_required
def update_student_status(user_id):
    data = get_request_data()
    student = db.session.get(User, user_id)
    if not student or student.role != "student":
        return jsonify({"error": "Student account not found."}), 404
    status = data.get("status") if data else None
    if status not in {"pending", "active", "suspended"}:
        return jsonify({"error": "Status must be pending, active, or suspended."}), 400
    student.status = status
    db.session.commit()
    return jsonify({"message": f"Student account is now {status}.", "status": status})


@app.put("/admin/users/<user_id>/access")
@admin_required
def update_student_exam_access(user_id):
    data = get_request_data()
    student = db.session.get(User, user_id)
    if not student or student.role != "student":
        return jsonify({"error": "Student account not found."}), 404
    exam_ids = data.get("examIds") if data else None
    if not isinstance(exam_ids, list) or any(
        not isinstance(exam_id, str) or exam_id not in ANSWER_KEY for exam_id in exam_ids
    ):
        return jsonify({"error": "Choose valid exam IDs."}), 400
    if len(set(exam_ids)) != len(exam_ids):
        return jsonify({"error": "An exam can only be assigned once."}), 400
    try:
        ExamAccess.query.filter_by(user_id=student.id).delete()
        for exam_id in exam_ids:
            db.session.add(ExamAccess(
                user_id=student.id,
                exam_id=exam_id,
                granted_by=current_user().id,
            ))
        db.session.commit()
    except Exception:
        db.session.rollback()
        app.logger.exception("Failed to update student test access")
        return jsonify({"error": "Test access could not be updated. Please try again."}), 500
    return jsonify({"message": "Test access updated.", "examAccess": exam_ids})


@app.get("/admin/attempts")
@admin_required
def get_admin_attempts():
    rows = Submission.query.order_by(Submission.submitted_at.desc(), Submission.id.desc()).all()
    grouped = {}
    for row in rows:
        grouped.setdefault(row.attempt_id, []).append(row)
    attempts = [attempt_summary(group, include_answers=True) for group in grouped.values()]
    user_ids = {attempt["userId"] for attempt in attempts}
    users = {user.id: user for user in User.query.filter(User.id.in_(user_ids)).all()} if user_ids else {}
    for attempt in attempts:
        user = users.get(attempt["userId"])
        attempt["studentName"] = user.display_name if user else "Legacy attempt"
        attempt["studentEmail"] = user.email if user else ""
        override = latest_score_override(attempt["attemptId"])
        attempt["overrideHistory"] = [
            {
                "score": record.adjusted_score,
                "reason": record.reason,
                "adminEmail": (db.session.get(User, record.admin_id).email if db.session.get(User, record.admin_id) else "Admin"),
                "createdAt": record.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            }
            for record in ScoreOverride.query.filter_by(attempt_id=attempt["attemptId"]).order_by(
                ScoreOverride.created_at.desc(), ScoreOverride.id.desc()
            ).all()
        ]
        attempt["hasOverride"] = override is not None
    return jsonify(attempts)


@app.post("/admin/attempts/<attempt_id>/score")
@admin_required
def override_attempt_score(attempt_id):
    data = get_request_data()
    score = data.get("score") if data else None
    reason = data.get("reason") if data else None
    if isinstance(score, bool) or not isinstance(score, (int, float)) or not math.isfinite(score) or not 0 <= score <= 100:
        return jsonify({"error": "Score must be a number between 0 and 100."}), 400
    if not isinstance(reason, str) or not 10 <= len(reason.strip()) <= 1000:
        return jsonify({"error": "Enter a reason between 10 and 1000 characters."}), 400
    if not Submission.query.filter_by(attempt_id=attempt_id).first():
        return jsonify({"error": "Test attempt not found."}), 404
    try:
        db.session.add(ScoreOverride(
            attempt_id=attempt_id,
            adjusted_score=round(float(score), 2),
            reason=reason.strip(),
            admin_id=current_user().id,
        ))
        db.session.commit()
    except Exception:
        db.session.rollback()
        app.logger.exception("Failed to override test score")
        return jsonify({"error": "Score override could not be saved. Please try again."}), 500
    return jsonify({"message": "Score override saved with an audit record."})


@app.get("/admin/question-reports")
@admin_required
def get_question_reports():
    reports = QuestionReport.query.order_by(QuestionReport.submitted_at.desc()).all()
    return jsonify([
        {
            "id": report.id,
            "examId": report.exam_id,
            "questionId": report.question_id,
            "userId": report.user_id,
            "message": report.message,
            "submittedAt": report.submitted_at.strftime("%Y-%m-%d %H:%M:%S"),
        }
        for report in reports
    ])


def initialize_database():
    db.create_all()
    admin_email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "")
    if not admin_email and not admin_password:
        app.logger.warning("ADMIN_EMAIL and ADMIN_PASSWORD are not configured; no admin account was bootstrapped.")
        return
    if not admin_email or len(admin_password) < 12:
        raise RuntimeError("Configure both ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters.")
    admin = User.query.filter_by(email=admin_email).first()
    if admin:
        if admin.role != "admin":
            raise RuntimeError("ADMIN_EMAIL belongs to a non-admin account.")
        return
    db.session.add(User(
        email=admin_email,
        display_name="Administrator",
        password_hash=generate_password_hash(admin_password),
        role="admin",
        status="active",
    ))
    db.session.commit()


with app.app_context():
    initialize_database()


if __name__ == "__main__":
    app.run(
        debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true",
        port=int(os.environ.get("PORT", "5000")),
    )
