import re
import unicodedata


def normalize_answer(value):
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return " ".join(re.sub(r"[^a-z0-9]+", " ", normalized.lower()).split())


def grade_answer(user_answer, answer_definition):
    if not user_answer:
        return 0.0

    accepted_answers = [answer_definition["answer"], *answer_definition.get("accepted", [])]
    normalized_answer = normalize_answer(user_answer)
    return 1.0 if normalized_answer in {normalize_answer(answer) for answer in accepted_answers} else 0.0
