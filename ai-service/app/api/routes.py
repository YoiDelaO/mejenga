from fastapi import APIRouter, UploadFile, File, HTTPException

from app.utils.file_utils import save_uploaded_video, save_analysis_json
from app.services.video_processor import get_video_info
from app.services.video_quality_service import evaluate_video_quality
from app.services.field_zone_service import get_field_zones
from app.services.detection_service import detect_players_in_video
from app.services.tracking_service import track_players_in_video
from app.services.ball_service import detect_ball_in_video
from app.services.event_service import build_analysis_events
from app.services.match_analysis_service import build_match_summary
from app.services.camera_angle_service import validate_camera_angles, get_camera_angle_metadata
from app.services.file_validation_service import validate_video_file
from app.services.match_mode_service import validate_match_mode, get_match_mode_metadata
from app.services.attack_event_service import build_attack_events
from app.services.danger_event_service import build_danger_events
from app.services.shot_event_service import build_shot_events
from app.services.goal_candidate_service import build_goal_candidate_events
from app.services.match_event_summary_service import build_match_event_summary
from app.services.clip_suggestion_service import build_clip_suggestions


router = APIRouter()


@router.get("/health")
def health_check():
    return {"status": "ok"}


@router.get("/metadata")
def get_metadata():
    return {
        "service": "Mejengas AI Service",
        "version": "0.1.0",
        "camera_angles": get_camera_angle_metadata(),
        "match_modes": get_match_mode_metadata(),
        "analysis_options": {
            "run_detection": {
                "default": True,
                "description": "Detect players in the uploaded video.",
            },
            "run_tracking": {
                "default": False,
                "description": "Track detected players and generate player IDs.",
            },
            "run_ball_detection": {
                "default": False,
                "description": "Experimental ball detection.",
            },
        },
        "recommended_ranked_setup": {
            "ideal": ["side_left", "side_right", "goal_left", "goal_right"],
            "description": "For ranked matches, Mejengas requires two side cameras and two goal cameras.",
        },
    }


@router.post("/analyze-video")
async def analyze_video(
    file: UploadFile = File(...),
    run_detection: bool = True,
    run_tracking: bool = False,
    run_ball_detection: bool = False,
):
    file_validation = validate_video_file(file.filename, file.content_type)

    if not file_validation["is_valid_video"]:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Uploaded file is not a valid video.",
                "file_validation": file_validation,
            },
        )

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

    attack_events = build_attack_events(detection_summary)

    danger_events = build_danger_events(
        detection_summary=detection_summary,
        ball_summary=ball_summary,
        attack_events=attack_events,
    )

    shot_events = build_shot_events(
        danger_events=danger_events,
        ball_summary=ball_summary,
    )

    goal_candidate_events = build_goal_candidate_events(
        shot_events=shot_events,
        danger_events=danger_events,
        ball_summary=ball_summary,
    )

    match_event_summary = build_match_event_summary(
        attack_events=attack_events,
        danger_events=danger_events,
        shot_events=shot_events,
        goal_candidate_events=goal_candidate_events,
    )

    clip_suggestions = build_clip_suggestions(
        match_event_summary=match_event_summary,
        video_info=video_info,
    )

    analysis_events = build_analysis_events(
        video_info=video_info,
        detection_summary=detection_summary,
        tracking_summary=tracking_summary,
        ball_summary=ball_summary,
        attack_events=attack_events,
        danger_events=danger_events,
        shot_events=shot_events,
        goal_candidate_events=goal_candidate_events,
    )

    needs_review = not video_info["readable"]

    if detection_summary and detection_summary.get("needs_admin_review"):
        needs_review = True

    if analysis_events.get("overall_status") == "needs_review":
        needs_review = True

    analysis_result = {
        "filename": file.filename,
        "saved_path": str(saved_video_path),
        "file_validation": file_validation,
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
        "attack_events": attack_events,
        "danger_events": danger_events,
        "shot_events": shot_events,
        "goal_candidate_events": goal_candidate_events,
        "match_event_summary": match_event_summary,
        "clip_suggestions": clip_suggestions,
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
    match_mode: str = "ranked",
    run_detection: bool = True,
    run_tracking: bool = False,
    run_ball_detection: bool = False,
):
    camera_angle_validation = validate_camera_angles(
        {
            "cam_1": cam_1_angle,
            "cam_2": cam_2_angle,
            "cam_3": cam_3_angle,
            "cam_4": cam_4_angle,
        }
    )

    normalized_angles = camera_angle_validation["normalized_angles"]

    uploaded_cameras = [
        ("cam_1", cam_1, normalized_angles["cam_1"]),
        ("cam_2", cam_2, normalized_angles["cam_2"]),
        ("cam_3", cam_3, normalized_angles["cam_3"]),
        ("cam_4", cam_4, normalized_angles["cam_4"]),
    ]

    camera_results = []

    for camera_id, file, camera_angle in uploaded_cameras:
        if file is None:
            continue

        file_validation = validate_video_file(file.filename, file.content_type)

        if not file_validation["is_valid_video"]:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": f"Uploaded file for {camera_id} is not a valid video.",
                    "camera_id": camera_id,
                    "file_validation": file_validation,
                },
            )

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

        attack_events = build_attack_events(detection_summary)

        danger_events = build_danger_events(
            detection_summary=detection_summary,
            ball_summary=ball_summary,
            attack_events=attack_events,
        )

        shot_events = build_shot_events(
            danger_events=danger_events,
            ball_summary=ball_summary,
        )

        goal_candidate_events = build_goal_candidate_events(
            shot_events=shot_events,
            danger_events=danger_events,
            ball_summary=ball_summary,
        )

        match_event_summary = build_match_event_summary(
            attack_events=attack_events,
            danger_events=danger_events,
            shot_events=shot_events,
            goal_candidate_events=goal_candidate_events,
        )

        clip_suggestions = build_clip_suggestions(
            match_event_summary=match_event_summary,
            video_info=video_info,
        )

        analysis_events = build_analysis_events(
            video_info=video_info,
            detection_summary=detection_summary,
            tracking_summary=tracking_summary,
            ball_summary=ball_summary,
            attack_events=attack_events,
            danger_events=danger_events,
            shot_events=shot_events,
            goal_candidate_events=goal_candidate_events,
        )

        camera_result = {
            "camera_id": camera_id,
            "camera_angle": camera_angle,
            "filename": file.filename,
            "saved_path": str(saved_video_path),
            "file_validation": file_validation,
            "video_info": video_info,
            "video_quality": video_quality,
            "field_zones": field_zones,
            "detection_summary": detection_summary,
            "tracking_summary": tracking_summary,
            "ball_summary": ball_summary,
            "analysis_events": analysis_events,
            "attack_events": attack_events,
            "danger_events": danger_events,
            "shot_events": shot_events,
            "goal_candidate_events": goal_candidate_events,
            "match_event_summary": match_event_summary,
            "clip_suggestions": clip_suggestions,
        }

        camera_results.append(camera_result)

    match_summary = build_match_summary(camera_results)
    match_mode_validation = validate_match_mode(match_mode, camera_results)

    needs_review = False

    if match_mode_validation["match_mode"] == "ranked":
        if match_summary.get("match_status") == "needs_review":
            needs_review = True

        if not match_mode_validation["is_valid_for_mode"]:
            needs_review = True

    if match_mode_validation["match_mode"] == "casual":
        if not match_mode_validation["is_valid_for_mode"]:
            needs_review = True

    analysis_result = {
        "match_analysis": True,
        "options": {
            "match_mode": match_mode_validation["match_mode"],
            "run_detection": run_detection,
            "run_tracking": run_tracking,
            "run_ball_detection": run_ball_detection,
            "camera_angles": normalized_angles,
            "camera_angle_validation": camera_angle_validation,
        },
        "camera_results": camera_results,
        "match_summary": match_summary,
        "match_mode_validation": match_mode_validation,
        "needs_review": needs_review,
    }

    json_path = save_analysis_json("match_analysis", analysis_result)
    analysis_result["analysis_json_path"] = str(json_path)

    return analysis_result
