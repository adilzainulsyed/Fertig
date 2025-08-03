import fitz  # PyMuPDF
import re
import json
from datetime import datetime
import os

def clean_text(text):
    """Removes unwanted non-question content from raw PDF text."""
    patterns_to_remove = [
        r"Instructions to Candidates:.*?(?=\n\d+[A-Z]?\.|\Z)",
        r"CSE \d{4}",
        r"Page \d+ of \d+",
        r"\uf076",
        r"",
        r"\n\s*\n",
    ]
    for pat in patterns_to_remove:
        text = re.sub(pat, "", text, flags=re.DOTALL | re.IGNORECASE)
    return text.strip()

def extract_questions_from_pdf(pdf_path, existing_question_texts):
    """Extracts structured questions from a given PDF file."""
    doc = fitz.open(pdf_path)
    text = "".join([page.get_text() for page in doc])
    text = clean_text(text)

    metadata = {
        "department": "B.Tech",
        "date_added": datetime.now().strftime("%Y-%m-%d")
    }

    subject_match = re.search(r"SUBJECT:\s*(.*?)(\[|\()", text, re.IGNORECASE)
    metadata["subject"] = subject_match.group(1).strip().title() if subject_match else "Unknown"

    sem_match = re.search(r"III SEMESTER", text, re.IGNORECASE)
    metadata["acad_year"] = 2 if sem_match else "Unknown"

    metadata["exam_type"] = "end" if "END SEMESTER" in text.upper() else "mid"

    year_match = re.search(r"(JAN|DECEMBER)\s+(\d{4})", text, re.IGNORECASE)
    metadata["source_year"] = int(year_match.group(2)) if year_match else "Unknown"

    # Improved regex to match marks inside (), [], or standalone
    pattern = re.compile(
        r"(\d+[A-Z]?\.)\s+(.*?)(?:\(|\[)?(\d{1,2})(?:\)|\])\s*(?=\n\d+[A-Z]?\.|\n[A-Z]?\d+\.\s+|\Z)",
        re.DOTALL
    )

    matches = pattern.findall(text)
    questions = []

    for match in matches:
        qtext = match[1].strip()
        norm_text = re.sub(r"\s+", " ", qtext.lower())

        if norm_text in existing_question_texts:
            continue  # Skip duplicate

        try:
            marks = int(match[2])
        except ValueError:
            marks = None

        if marks == 1:
            difficulty = "very easy"
        elif marks == 2:
            difficulty = "easy"
        elif marks == 3:
            difficulty = "medium"
        elif marks in [4, 5]:
            difficulty = "hard"
        else:
            difficulty = "unknown"

        question_entry = {
            "department": metadata["department"],
            "acad_year": metadata["acad_year"],
            "exam_type": metadata["exam_type"],
            "subject": metadata["subject"],
            "question_text": qtext,
            "source_year": metadata["source_year"],
            "difficulty": difficulty,
            "date_added": metadata["date_added"]
        }
        questions.append(question_entry)
        existing_question_texts.add(norm_text)

    print(f"Extracted {len(questions)} new questions from: {os.path.basename(pdf_path)}")
    return questions

# === File Output ===
output_file = "data/processed papers/exported_questions.json"
os.makedirs(os.path.dirname(output_file), exist_ok=True)

# Load previous data (append mode)
if os.path.exists(output_file):
    with open(output_file, "r", encoding="utf-8") as f:
        existing_data = json.load(f)
else:
    existing_data = []

# Prepare set for duplicate detection
existing_question_texts = set(
    re.sub(r"\s+", " ", q["question_text"].lower()) for q in existing_data
)

# Process each PDF
pdf_files = [
    "data/raw papers/Data Structures (2103)RCS(Makeup).pdf",
    "data/raw papers/Data Structures & Applications (CSE_2152).pdf"
]

for pdf in pdf_files:
    new_questions = extract_questions_from_pdf(pdf, existing_question_texts)
    existing_data.extend(new_questions)

# Write updated data
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(existing_data, f, indent=4, ensure_ascii=False)

print(f"\n✅ All questions saved. Total now: {len(existing_data)} → {output_file}")
