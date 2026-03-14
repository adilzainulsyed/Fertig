# Study Materials

Place your study material JSON knowledge-base files here.
The RAG chatbot automatically loads all `*.json` files in this folder at startup.

## File Format

Each JSON file must contain an **array of knowledge chunks**:

```json
[
  {
    "id": "unique-id",
    "subject": "Data Structures",
    "year": "2nd year",
    "chapter": "Trees",
    "title": "Binary Search Trees",
    "content": "Full text content of the chunk...",
    "source": "DS Textbook – Chapter 6"
  }
]
```

### Field Reference

| Field     | Required | Description                                       |
|-----------|----------|---------------------------------------------------|
| `id`      | Yes      | Unique string identifier for this chunk           |
| `subject` | Yes      | Subject name (e.g. "Data Structures", "APE")      |
| `year`    | Yes      | "1st year" or "2nd year"                          |
| `chapter` | Yes      | Chapter / unit name                               |
| `title`   | Yes      | Short title for this chunk                        |
| `content` | Yes      | The actual textual content (any length)           |
| `source`  | Yes      | Human-readable source reference                   |

## Adding PDFs / PPTs

Until PDF/PPT ingestion is automated, convert your study material to JSON chunks
manually (or with a helper script) and drop the resulting JSON file here.

Future work: a document ingestion script (`scripts/ingest_pdf.py`) will parse PDFs
and PPTs from this folder and auto-generate the JSON files.

## Existing Sample File

`sample_notes.json` — contains placeholder notes for all current subjects
(APE, CM1, FE, PPS, DS, DMS, DCSO) to demonstrate the RAG pipeline.
Replace these with real content as study materials become available.
