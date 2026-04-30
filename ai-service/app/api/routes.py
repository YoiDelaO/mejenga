from fastapi import APIRouter, UploadFile, File

from app.utils.file_utils import save_uploaded_video, save_analysis_json
from app.services.video_processor import get_video_info


router = APIRouter()


@router.get("/health")
def health_check():
    return {"status": "ok"}


@router.post("/analyze-video")
async def analyze_video(file: UploadFile = File(...)):
    saved_video_path = await save_uploaded_video(file)
    video_info = get_video_info(saved_video_path)

    analysis_result = {
        "filename": file.filename,
        "saved_path": str(saved_video_path),
        "video_info": video_info,
        "needs_review": not video_info["readable"],
    }

    json_path = save_analysis_json(file.filename, analysis_result)
    analysis_result["analysis_json_path"] = str(json_path)

    return analysis_result
