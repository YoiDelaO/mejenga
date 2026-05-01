from fastapi import APIRouter, UploadFile, File

from app.utils.file_utils import save_uploaded_video, save_analysis_json
from app.services.video_processor import get_video_info
from app.services.detection_service import detect_players_in_video
from app.services.tracking_service import track_players_in_video
from app.services.ball_service import detect_ball_in_video
from app.services.event_service import build_analysis_events


router = APIRouter()


@router.get("/health")
def health_check():
    return {"status": "ok"}


@router.post("/analyze-video")
async def analyze_video(
    file: UploadFile = File(...),
    run_detection: bool = True,
    run_tracking: bool = False,
    run_ball_detection: bool = False,
):
    saved_video_path = await save_uploaded_video(file)
    video_info = get_video_info(saved_video_path)

    detection_summary = None
    tracking_summary = None
    ball_summary = None

    if video_info["readable"]:
        if run_detection:
            detection_summary = detect_players_in_video(saved_video_path)

        if run_tracking:
            tracking_summary = track_players_in_video(saved_video_path)

        if run_ball_detection:
            ball_summary = detect_ball_in_video(saved_video_path)

    needs_review = not video_info["readable"]

    if detection_summary and detection_summary.get("needs_admin_review"):
        needs_review = True

    analysis_events = build_analysis_events(
        video_info=video_info,
        detection_summary=detection_summary,
        tracking_summary=tracking_summary,
        ball_summary=ball_summary,
    )

    if analysis_events.get("overall_status") == "needs_review":
        needs_review = True

    analysis_result = {
        "filename": file.filename,
        "saved_path": str(saved_video_path),
        "video_info": video_info,
        "options": {
            "run_detection": run_detection,
            "run_tracking": run_tracking,
            "run_ball_detection": run_ball_detection,
        },
        "detection_summary": detection_summary,
        "tracking_summary": tracking_summary,
        "ball_summary": ball_summary,
        "analysis_events": analysis_events,
        "needs_review": needs_review,
    }

    json_path = save_analysis_json(file.filename, analysis_result)
    analysis_result["analysis_json_path"] = str(json_path)

    return analysis_result
