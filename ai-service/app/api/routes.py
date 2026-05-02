from fastapi import APIRouter, UploadFile, File

from app.utils.file_utils import save_uploaded_video, save_analysis_json
from app.services.video_processor import get_video_info
from app.services.video_quality_service import evaluate_video_quality
from app.services.field_zone_service import get_field_zones
from app.services.detection_service import detect_players_in_video
from app.services.tracking_service import track_players_in_video
from app.services.ball_service import detect_ball_in_video
from app.services.event_service import build_analysis_events
from app.services.match_analysis_service import build_match_summary


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
    saved_video_path = await save_uploaded_video(file, prefix="single_video")
    video_info = get_video_info(saved_video_path)
    video_quality = evaluate_video_quality(video_info)
    field_zones = get_field_zones(video_info)

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
        "video_quality": video_quality,
        "field_zones": field_zones,
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


@router.post("/analyze-match")
async def analyze_match(
    cam_1: UploadFile = File(...),
    cam_2: UploadFile | None = File(None),
    cam_3: UploadFile | None = File(None),
    cam_4: UploadFile | None = File(None),
    cam_1_angle: str = "side_left",
    cam_2_angle: str = "side_right",
    cam_3_angle: str = "goal_left",
    cam_4_angle: str = "goal_right",
    run_detection: bool = True,
    run_tracking: bool = False,
    run_ball_detection: bool = False,
):
    uploaded_cameras = [
        ("cam_1", cam_1, cam_1_angle),
        ("cam_2", cam_2, cam_2_angle),
        ("cam_3", cam_3, cam_3_angle),
        ("cam_4", cam_4, cam_4_angle),
    ]

    camera_results = []

    for camera_id, file, camera_angle in uploaded_cameras:
        if file is None:
            continue

        saved_video_path = await save_uploaded_video(file, prefix=camera_id)
        video_info = get_video_info(saved_video_path)
        video_quality = evaluate_video_quality(video_info)
        field_zones = get_field_zones(video_info)

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

        analysis_events = build_analysis_events(
            video_info=video_info,
            detection_summary=detection_summary,
            tracking_summary=tracking_summary,
            ball_summary=ball_summary,
        )

        camera_result = {
            "camera_id": camera_id,
            "camera_angle": camera_angle,
            "filename": file.filename,
            "saved_path": str(saved_video_path),
            "video_info": video_info,
            "video_quality": video_quality,
            "field_zones": field_zones,
            "detection_summary": detection_summary,
            "tracking_summary": tracking_summary,
            "ball_summary": ball_summary,
            "analysis_events": analysis_events,
        }

        camera_results.append(camera_result)

    match_summary = build_match_summary(camera_results)

    needs_review = match_summary.get("match_status") == "needs_review"

    analysis_result = {
        "match_analysis": True,
        "options": {
            "run_detection": run_detection,
            "run_tracking": run_tracking,
            "run_ball_detection": run_ball_detection,
            "camera_angles": {
                "cam_1": cam_1_angle,
                "cam_2": cam_2_angle,
                "cam_3": cam_3_angle,
                "cam_4": cam_4_angle,
            },
        },
        "camera_results": camera_results,
        "match_summary": match_summary,
        "needs_review": needs_review,
    }

    json_path = save_analysis_json("match_analysis", analysis_result)
    analysis_result["analysis_json_path"] = str(json_path)

    return analysis_result
