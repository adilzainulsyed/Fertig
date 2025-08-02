import json
from bson import json_util
from pymongo import MongoClient

# === Load old JSON (if exists) ===
file_path = "exported_questions.json"
try:
    with open(file_path, "r") as f:
        existing_data = json_util.loads(f.read())
except FileNotFoundError:
    existing_data = []

# === Fetch new data from MongoDB ===
client = MongoClient("mongodb+srv://nameisadil02:PUQKGR8RadHdzQVE@fertig.0pdwrik.mongodb.net/")
db = client["fertig"]
collection = db["quebank"]

# Example filter: fetch only questions added today
from datetime import datetime, timedelta
today = datetime.utcnow().date()
new_questions = list(collection.find({
    "date_added": {"$gte": datetime(today.year, today.month, today.day)}
}))

# === Combine and write back ===
combined = existing_data + new_questions

with open(file_path, "w") as f:
    f.write(json_util.dumps(combined, indent=2))

print(f"✅ Appended {len(new_questions)} new questions to {file_path}")
