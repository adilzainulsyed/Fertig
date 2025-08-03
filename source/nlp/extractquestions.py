import fitz  # PyMuPDF
import re
import json
from datetime import datetime

def extract_questions_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()

    metadata = {}

    # Department
    metadata["department"] = "B.Tech"

    # Subject
    subject_match = re.search(r"SUBJECT:\s*(.*?)(\[|\()", text, re.IGNORECASE)
    metadata["subject"] = subject_match.group(1).strip().title() if subject_match else "Unknown"

    # Semester & Academic Year
    sem_match = re.search(r"III SEMESTER", text, re.IGNORECASE)
    metadata["acad_year"] = 2 if sem_match else "Unknown"

    # Exam Type
    metadata["exam_type"] = "end" if "END SEMESTER" in text.upper() else "mid"

    # Source Year
    year_match = re.search(r"(JAN|DECEMBER)\s+(\d{4})", text, re.IGNORECASE)
    metadata["source_year"] = int(year_match.group(2)) if year_match else "Unknown"

    # Date Added
    metadata["date_added"] = datetime.now().strftime("%Y-%m-%d")

    # Extract questions (e.g., 1A., 1B., etc.)
    pattern = re.compile(r"(\d+[A-Z]?\.\s+)(.*?)(?=(\d+[A-Z]?\.\s+)|$)", re.DOTALL)
    matches = pattern.findall(text)

    questions = []
    for match in matches:
        qtext = match[1].strip()
        # Extract marks if mentioned
        marks_match = re.search(r"\((\d+)\)", qtext)
        marks = int(marks_match.group(1)) if marks_match else None

        # Classify difficulty
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

    return questions


# Process both uploaded PDFs
pdf_files = [
    "data/raw papers/Data Structures & Applications (CSE_2152).pdf"
]

all_questions = []
for pdf_file in pdf_files:
    all_questions.extend(extract_questions_from_pdf(pdf_file))

# Dump to JSON
output_file = "data/proccessed papers/exported_questions.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(all_questions, f, indent=4)

print(f"Extracted {len(all_questions)} questions and saved to {output_file}")
