from pymongo import MongoClient
from datetime import datetime
import fitz  # PyMuPDF
import re

# === MongoDB Connection ===
client = MongoClient("mongodb+srv://nameisadil02:PUQKGR8RadHdzQVE@fertig.0pdwrik.mongodb.net/")
db = client["fertig"]
collection = db["quebank"]

# === Load and extract text from PDF ===
pdf_path = "data/raw papers/Data Structures & Applications (CSE_2152).pdf"
doc = fitz.open(pdf_path)
text = "\n".join(page.get_text() for page in doc)

# === Extract source year from header ===
year_match = re.search(r'END SEMESTER.*?(\w+\s+\d{4})', text)
source_year = year_match.group(1).strip() if year_match else "Unknown"

# === Difficulty mapping ===
def infer_difficulty(marks):
    if marks == 1:
        return "very easy"
    elif marks == 2:
        return "easy"
    elif marks == 3:
        return "medium"
    elif marks in [4, 5]:
        return "hard"
    else:
        return "unknown"

def get_section(label):
    if label.startswith("1") or label.startswith("2"):
        return "A"
    elif label.startswith("3") or label.startswith("4"):
        return "B"
    else:
        return "C"

# === Custom robust question extraction ===
lines = text.splitlines()
questions = []
current_q = None

for i, line in enumerate(lines):
    # Match question start: 1A. or 2B. etc.
    qstart = re.match(r'^(\d+[A-C]?)\.\s*(.*)', line.strip())
    if qstart:
        if current_q:  # Save the previous question before starting new
            questions.append(current_q)
        qnum = qstart.group(1)
        qtext = qstart.group(2).strip()
        current_q = {
            "qnum": qnum,
            "question_lines": [qtext]
        }
    elif current_q:
        current_q["question_lines"].append(line.strip())

# Append last question
if current_q:
    questions.append(current_q)

# === Extract final fields: question_text, marks, etc. ===
final_questions = []

for q in questions:
    full_text = " ".join(q["question_lines"]).strip()

    # Try to extract marks from (x)
    mark_match = re.search(r'\((\d+)\)', full_text)
    marks = int(mark_match.group(1)) if mark_match else 0

    # Remove marks from question text
    clean_text = re.sub(r'\(\d+\)', '', full_text).strip()

    # Check for duplicates
    if collection.find_one({"question_text": clean_text}):
        continue  # Skip if already exists

    question_data = {
        "question_text": clean_text,
        "source_year": source_year,
        "difficulty": infer_difficulty(marks),
        "section": get_section(q["qnum"]),
        "tags": [],
        "date_added": datetime.utcnow()
    }

    final_questions.append(question_data)

# === Insert non-duplicates ===
if final_questions:
    result = collection.insert_many(final_questions)
    print(f"✅ Inserted {len(result.inserted_ids)} new questions.")
else:
    print("⚠️ No new questions to insert.")

# === Sample fetch ===
def get_mock_questions(section="A", limit=3):
    return list(collection.aggregate([
        {"$match": {"section": section}},
        {"$sample": {"size": limit}}
    ]))

mock = get_mock_questions("A")
for q in mock:
    print("📌", q["question_text"])
