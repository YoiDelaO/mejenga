from pathlib import Path
from datetime import datetime
from uuid import uuid4
import json
import re

from fastapi import UploadFile


BASE_DIR = Path(__file__).resolve().parents[2]
INPUT_VIDEOS_DIR = BASE_DIR / "input_videos"
OUTPUT_JSON_DIR = BASE_DIR / "output_json"


def ensure_folder_exists(folder_path: Path) -> None:
    folder_path.mkdir(parents=True, exist_ok=True)


def clean_filename(filename: str) -> str:
    name = Path(filename).stem
    clean_name = re.sub(r"[^a-zA-Z0-9_-]", "_", name)
    return clean_name.lower()


def build_unique_video_filename(original_filename: str, prefix: str | None = None) -> str:
    original_path = Path(original_filename)
    clean_name = clean_filename(original_filename)
    extension = original_path.suffix.lower() or ".mp4"
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    short_id = uuid4().hex[:8]

    if prefix:
        return f"{prefix}_{clean_name}_{timestamp}_{short_id}{extension}"

    return f"{clean_name}_{timestamp}_{short_id}{extension}"


async def save_uploaded_video(file: UploadFile, prefix: str | None = None) -> Path:
    ensure_folder_exists(INPUT_VIDEOS_DIR)

    unique_filename = build_unique_video_filename(file.filename, prefix)
    file_path = INPUT_VIDEOS_DIR / unique_filename

    content = await file.read()

    with open(file_path, "wb") as video_file:
        video_file.write(content)

    return file_path


def save_analysis_json(original_filename: str, analysis_data: dict) -> Path:
    ensure_folder_exists(OUTPUT_JSON_DIR)

    clean_name = clean_filename(original_filename)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    short_id = uuid4().hex[:8]
    json_filename = f"{clean_name}_{timestamp}_{short_id}.json"
    json_path = OUTPUT_JSON_DIR / json_filename

    with open(json_path, "w", encoding="utf-8") as json_file:
        json.dump(analysis_data, json_file, indent=2, ensure_ascii=False)

    return json_path
