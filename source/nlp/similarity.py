import json
from pathlib import Path

import spacy


BASE_DIR = Path(__file__).resolve().parents[2]
USER_ANSWERS_PATH = BASE_DIR / "data" / "temp_exam_answers" / "fertig_test_answers.json"
EXPECTED_ANSWERS_PATH = BASE_DIR / "data" / "testpaperjson" / "1st year" / "engtest.json"


def load_nlp():
    try:
        nlp = spacy.load("en_core_web_lg")
    except OSError as exc:
        raise RuntimeError(
            "SpaCy model 'en_core_web_lg' is not installed. "
            "Install it before running this script: python -m spacy download en_core_web_lg"
        ) from exc

    if nlp.pipe_names:
        nlp.disable_pipes(*nlp.pipe_names)
    return nlp


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def build_expected_lookup(answers_expected):
    expected_by_index = {}
    has_any_index = any(isinstance(item.get("index"), int) for item in answers_expected)

    if has_any_index:
        for item in answers_expected:
            idx = item.get("index")
            if isinstance(idx, int):
                expected_by_index[idx] = item
    else:
        for pos, item in enumerate(answers_expected, start=1):
            expected_by_index[pos] = item

    return expected_by_index


def make_doc_cache(nlp):
    cache = {}

    def get_doc(text: str):
        normalized = (text or "").strip().lower()
        if not normalized:
            return None
        if normalized not in cache:
            cache[normalized] = nlp.make_doc(normalized)
        return cache[normalized]

    return get_doc


def compute_similarity(get_doc, text1: str, text2: str) -> float:
    doc1 = get_doc(text1)
    doc2 = get_doc(text2)
    if doc1 is None or doc2 is None:
        return 0.0
    return round(doc1.similarity(doc2), 3)


def main():
    nlp = load_nlp()
    get_doc = make_doc_cache(nlp)

    data_user = load_json(USER_ANSWERS_PATH)
    answers_user = data_user.get("answers", [])
    answers_expected = load_json(EXPECTED_ANSWERS_PATH)
    expected_by_index = build_expected_lookup(answers_expected)

    expected_text_docs = {}
    for idx, expected in expected_by_index.items():
        exp_type = (expected.get("type") or "").lower()
        if exp_type == "text":
            expected_text_docs[idx] = get_doc(str(expected.get("answer") or ""))

    for ans_u in answers_user:
        idx = ans_u.get("index")
        q_type = (ans_u.get("type") or "").lower()
        raw_answer = ans_u.get("answer")

        if isinstance(raw_answer, str):
            user_answer = raw_answer.strip()
        else:
            user_answer = raw_answer

        expected_e = expected_by_index.get(idx)

        print("=" * 70)
        print(f"Question #{idx}  |  Type: {q_type}")
        print(f"User Answer: {repr(user_answer)}")

        if expected_e is None:
            print("Expected Answer: (not found)")
            continue

        exp_answer = expected_e.get("answer")
        exp_type = (expected_e.get("type") or "").lower() or q_type
        print(f"Expected Answer: {repr(exp_answer)}")

        if exp_type == "text":
            expected_doc = expected_text_docs.get(idx)
            user_doc = get_doc(str(user_answer or ""))
            if user_doc is None or expected_doc is None:
                similarity = 0.0
            else:
                similarity = round(user_doc.similarity(expected_doc), 3)

            print(f"Similarity Score: {similarity}")

            if similarity >= 0.85:
                print("✅ Very similar (almost correct)")
            elif similarity >= 0.6:
                print("⚠️ Partially similar")
            else:
                print("❌ Weak or unrelated answer")

        elif exp_type == "mcq":
            try:
                u_ans = int(user_answer) if user_answer is not None else None
                e_ans = int(exp_answer) if exp_answer is not None else None
            except ValueError:
                print("⚠️ Invalid format for MCQ answer")
                continue

            if u_ans is None or e_ans is None:
                print("⚠️ Missing MCQ answer(s)")
            elif u_ans == e_ans:
                print("✅ Correct Option")
            else:
                print(f"❌ Incorrect (expected {e_ans}, got {u_ans})")

        else:
            print(f"⚠️ Unsupported question type: {exp_type}")

    print("=" * 70)


if __name__ == "__main__":
    main()
