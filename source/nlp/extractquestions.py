import fitz  # PyMuPDF
import re
import os
from datetime import datetime
import json
from bson import json_util
import uuid

# === Settings ===
pdf_path = "data/raw papers/Engineer Mathematics(MAT 2155).pdf"
output_json_path = "data/processed papers/exported_questions.json"
images_folder = "question_images"
os.makedirs(images_folder, exist_ok=True)

# === Load existing JSON ===
try:
    with open(output_json_path, "r", encoding="utf-8") as f:
        existing_data = json_util.loads(f.read())
except FileNotFoundError:
    existing_data = []

existing_qtexts = set(doc["question_text"] for doc in existing_data)

# === Open PDF ===
doc = fitz.open(pdf_path)
full_text = "\n".join(page.get_text() for page in doc)

# === Extract metadata ===
year_match = re.search(r'FINAL EXAMINATIONS.*?(\w+\s+\d{4})', full_text)
source_year = year_match.group(1).strip() if year_match else None

subject_match = re.search(r'SUBJECT:\s*([^\n]+)', full_text)
subject = subject_match.group(1).strip() if subject_match else None

exam_type_match = re.search(r'FINAL EXAMINATIONS|MAKEUP EXAMINATIONS|END SEMESTER EXAMINATIONS', full_text)
exam_type = exam_type_match.group(0).strip() if exam_type_match else None

department_match = re.search(r'III SEMESTER\s*B\.TECH\.\s*\(([^)]+)\)', full_text)
department = department_match.group(1).strip() if department_match else None

# === Difficulty Mapping ===
def infer_difficulty(marks):
    if marks == 1:
        return "very easy"
    elif marks == 2:
        return "easy"
    elif marks == 3:
        return "medium"
    elif marks in [4, 5, 6, 7, 8, 9]:
        return "hard"
    else:
        return "unknown"

# === Section guessing ===
def get_section(label):
    if label.startswith("1") or label.startswith("2"):
        return "A"
    elif label.startswith("3") or label.startswith("4"):
        return "B"
    else:
        return "C"

# === Extract Questions ===
lines = full_text.splitlines()
questions = []
current_q = None

for line in lines:
    qstart = re.match(r'^(\d+[A-C]?)\.\s*(.*)', line.strip())
    if qstart:
        if current_q:
            questions.append(current_q)
        qnum = qstart.group(1)
        qtext = qstart.group(2).strip()
        current_q = {"qnum": qnum, "question_lines": [qtext]}
    elif current_q:
        current_q["question_lines"].append(line.strip())

if current_q:
    questions.append(current_q)

# === Process questions and extract images ===
new_questions = []

for page_num, page in enumerate(doc):
    page_images = page.get_images(full=True)
    for q in questions:
        full_text_q = " ".join(q["question_lines"]).strip()

        # Extract marks like (4), (4+3), (4+3+3)
        mark_match = re.search(r'\((\d+(?:\+\d+)*)\)', full_text_q)
        marks = 0
        if mark_match:
            try:
                marks = sum(map(int, mark_match.group(1).split('+')))
            except:
                pass

        clean_text = re.sub(r'\(\d+(?:\+\d+)*\)', '', full_text_q).strip()

        if clean_text in existing_qtexts:
            continue  # skip duplicates

        # Check for images but skip logo-like images
        image_paths = []
        if page_images:
            for img_index, img in enumerate(page_images, start=1):
                xref = img[0]
                pix = fitz.Pixmap(doc, xref)

                # Skip images that are too small or look like the logo
                if pix.width > 100 and pix.height > 50 and not (300 < pix.width < 900 and 50 < pix.height < 200):
                    img_filename = f"{uuid.uuid4().hex}.png"
                    img_path = os.path.join(images_folder, img_filename)
                    if pix.n < 5:
                        pix.save(img_path)
                    else:
                        pix = fitz.Pixmap(fitz.csRGB, pix)
                        pix.save(img_path)
                    image_paths.append(img_path)
                pix = None

        question_data = {
            "department": department,
            "acad_year": None,
            "exam_type": exam_type,
            "subject": subject,
            "question_text": clean_text,
            "source_year": source_year,
            "difficulty": infer_difficulty(marks),
            "date_added": datetime.utcnow(),
            "images": image_paths
        }

        new_questions.append(question_data)

# === Save to JSON ===
combined_data = existing_data + new_questions
with open(output_json_path, "w", encoding="utf-8") as f:
    f.write(json_util.dumps(combined_data, indent=2))

print(f"✅ Extracted {len(new_questions)} new questions and saved images to '{images_folder}'")
