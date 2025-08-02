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
year_match = re.search(r'END SEMESTER EXAMINATIONS,\s*(\w+ \d{4})', text)
source_year = year_match.group(1) if year_match else "Unknown"

# === Map marks to difficulty ===
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

# === Guess section by question label (1A, 2B, etc.) ===
def get_section(label):
    if label.startswith("1") or label.startswith("2"):
        return "A"
    elif label.startswith("3") or label.startswith("4"):
        return "B"
    else:
        return "C"

# === Extract questions using regex ===
pattern = re.compile(
    r"(?P<qnum>\d+[A-C]?)\.\s+(?P<qtext>.*?)(?P<marks>\d{1,2})\s*(?=\n\d+[A-C]?\.\s|\Z)", 
    re.DOTALL
)

questions = []

for match in pattern.finditer(text):
    qnum = match.group("qnum").strip()
    qtext = match.group("qtext").strip().replace('\n', ' ')
    marks = int(match.group("marks").strip())

    question_data = {
        "question_text": qtext,
        "source_year": source_year,
        "difficulty": infer_difficulty(marks),
        "section": get_section(qnum),
        "tags": [],
        "date_added": datetime.utcnow()
    }

    questions.append(question_data)

# === Insert into MongoDB ===
def insert_bulk(questions_list):
    result = collection.insert_many(questions_list)
    print("✅ Inserted", len(result.inserted_ids), "questions.")

def get_mock_questions(section="A", limit=5):
    cursor = collection.aggregate([
        {"$match": {"section": section}},
        {"$sample": {"size": limit}}
    ])
    return list(cursor)

# === Run insertion and sample retrieval ===
insert_bulk(questions)

mock = get_mock_questions("A", 3)
for q in mock:
    print("📌", q["question_text"])
