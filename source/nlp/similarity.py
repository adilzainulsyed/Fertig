import json
import spacy

# Load SpaCy model
try:
    nlp = spacy.load("en_core_web_lg")
except OSError:
    import os
    os.system("python -m spacy download en_core_web_lg")
    nlp = spacy.load("en_core_web_lg")

# ---------- Load JSON files ----------
with open("data/temp_exam_answers/fertig_test_answers.json", "r", encoding="utf-8") as f1:
    data1 = json.load(f1)

with open("data/testpaperjson/1st year/engtest.json", "r", encoding="utf-8") as f2:
    data2 = json.load(f2)

answers_user = data1.get("answers", [])
answers_expected = data2

# ---------- Build expected lookup ----------
expected_by_index = {}
has_any_index = any(isinstance(e.get("index"), int) for e in answers_expected)

if has_any_index:
    for e in answers_expected:
        idx = e.get("index")
        if isinstance(idx, int):
            expected_by_index[idx] = e
else:
    for pos, e in enumerate(answers_expected, start=1):
        expected_by_index[pos] = e


# ---------- Helper for NLP similarity ----------
def compute_similarity(text1: str, text2: str) -> float:
    """Compute semantic similarity between two text answers."""
    if not text1 or not text2:
        return 0.0
    doc1 = nlp(text1.lower())
    doc2 = nlp(text2.lower())
    return round(doc1.similarity(doc2), 3)  # value between 0 and 1


# ---------- Comparison ----------
for ans_u in answers_user:
    idx = ans_u.get("index")
    q_type = ans_u.get("type", "").lower()
    raw_answer = ans_u.get("answer")

    # Normalize user answer to string for printing, but preserve type
    if isinstance(raw_answer, str):
        user_answer = raw_answer.strip()
    else:
        user_answer = raw_answer  # int, None, etc.

    expected_e = expected_by_index.get(idx)

    print("=" * 70)
    print(f"Question #{idx}  |  Type: {q_type}")
    print(f"User Answer: {repr(user_answer)}")

    if expected_e is None:
        print("Expected Answer: (not found)")
        continue

    exp_answer = expected_e.get("answer")
    exp_type = expected_e.get("type", "").lower() or q_type
    print(f"Expected Answer: {repr(exp_answer)}")

    # ----- TEXT questions -----
    if exp_type == "text":
        similarity = compute_similarity(str(user_answer or ""), str(exp_answer or ""))
        print(f"Similarity Score: {similarity}")

        if similarity >= 0.85:
            print("✅ Very similar (almost correct)")
        elif similarity >= 0.6:
            print("⚠️ Partially similar")
        else:
            print("❌ Weak or unrelated answer")

    # ----- MCQ questions -----
    elif exp_type == "mcq":
        # both should be integers
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
