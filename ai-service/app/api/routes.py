from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, Request

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
from app.services.review_moment_service import build_review_moments
from app.services.clip_generation_service import generate_review_clips
from app.services.review_summary_service import build_review_summary


router = APIRouter()


def build_full_url(base_url: str, relative_url: str | None) -> str | None:
    if not relative_url:
        return None

    clean_base_url = base_url.rstrip("/")
    clean_relative_url = relative_url

    if not clean_relative_url.startswith("/"):
        clean_relative_url = f"/{clean_relative_url}"

    return f"{clean_base_url}{clean_relative_url}"


def enrich_review_clips_with_full_urls(
    review_clips: dict | None,
    base_url: str,
) -> dict | None:
    if not review_clips:
        return review_clips

    for clip in review_clips.get("clips", []):
        clip_generation = clip.get("clip_generation", {})

        generated_clip_url = clip_generation.get("generated_clip_url")
        clip_generation["generated_clip_full_url"] = build_full_url(
            base_url=base_url,
            relative_url=generated_clip_url,
        )

        web_clip = clip_generation.get("web_clip")

        if web_clip:
            web_clip_url = web_clip.get("web_clip_url")
            web_clip["web_clip_full_url"] = build_full_url(
                base_url=base_url,
                relative_url=web_clip_url,
            )

    return review_clips

def build_match_review_summary(camera_results: list[dict]) -> dict:
    recommended_playback_urls = []
    cameras_with_review_clips = []
    review_clip_count = 0
    goal_candidate_camera_count = 0
    requires_goal_camera_validation = False

    for camera_result in camera_results:
        camera_id = camera_result.get("camera_id")
        camera_angle = camera_result.get("camera_angle")
        review_summary = camera_result.get("review_summary", {})

        if review_summary.get("clip_count", 0) > 0:
            review_clip_count += review_summary.get("clip_count", 0)

        if review_summary.get("main_reason") == "goal_candidate":
            goal_candidate_camera_count += 1

        if review_summary.get("requires_goal_camera_validation", False):
            requires_goal_camera_validation = True

        recommended_playback_url = review_summary.get("recommended_playback_url")

        if recommended_playback_url:
            recommended_playback_urls.append(
                {
                    "camera_id": camera_id,
                    "camera_angle": camera_angle,
                    "url": recommended_playback_url,
                    "main_reason": review_summary.get("main_reason"),
                    "summary_status": review_summary.get("summary_status"),
                    "frontend_message": review_summary.get("frontend_message"),
                }
            )

            cameras_with_review_clips.append(
                {
                    "camera_id": camera_id,
                    "camera_angle": camera_angle,
                }
            )

    frontend_ready = len(recommended_playback_urls) > 0

    frontend_message = "No match review clips available for playback."

    if frontend_ready:
        frontend_message = "Match review clips ready for playback."

    recommended_primary_playback_url = None
    recommended_primary_camera_id = None
    recommended_primary_camera_angle = None

    if recommended_playback_urls:
        primary_playback = recommended_playback_urls[0]
        recommended_primary_playback_url = primary_playback.get("url")
        recommended_primary_camera_id = primary_playback.get("camera_id")
        recommended_primary_camera_angle = primary_playback.get("camera_angle")


    return {
        "match_review_summary_available": True,
        "frontend_ready": frontend_ready,
        "frontend_message": frontend_message,
        "recommended_playback_urls": recommended_playback_urls,
        "recommended_primary_playback_url": recommended_primary_playback_url,
        "recommended_primary_camera_id": recommended_primary_camera_id,
        "recommended_primary_camera_angle": recommended_primary_camera_angle,
        "recommended_playback_url_count": len(recommended_playback_urls),
        "review_clip_count": review_clip_count,
        "cameras_with_review_clips": cameras_with_review_clips,
        "cameras_with_review_clips_count": len(cameras_with_review_clips),
        "goal_candidate_camera_count": goal_candidate_camera_count,
        "requires_goal_camera_validation": requires_goal_camera_validation,
    }


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
    request: Request,
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

    review_moments = build_review_moments(clip_suggestions)

    clip_source_video_path = saved_video_path
    clip_source = {
        "source_type": "original_video",
        "source_path": str(saved_video_path),
        "uses_ball_marker": False,
    }

    if ball_summary and ball_summary.get("processed_ball_video_path"):
        clip_source_video_path = Path(ball_summary.get("processed_ball_video_path"))
        clip_source = {
            "source_type": "processed_ball_video",
            "source_path": ball_summary.get("processed_ball_video_path"),
            "uses_ball_marker": True,
        }

    review_clips = generate_review_clips(
        video_path=clip_source_video_path,
        review_moments=review_moments,
        clip_source=clip_source,
    )

    review_clips = enrich_review_clips_with_full_urls(
        review_clips=review_clips,
        base_url=str(request.base_url),
    )

    review_summary = build_review_summary(
        match_event_summary=match_event_summary,
        review_moments=review_moments,
        review_clips=review_clips,
        base_url=str(request.base_url),
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
        "review_moments": review_moments,
        "review_clips": review_clips,
        "review_summary": review_summary,
        "needs_review": needs_review,
    }

    json_path = save_analysis_json(file.filename, analysis_result)
    analysis_result["analysis_json_path"] = str(json_path)

    return analysis_result


@router.post("/analyze-match")
async def analyze_match(
    request: Request,
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

        review_moments = build_review_moments(clip_suggestions)

        clip_source_video_path = saved_video_path
        clip_source = {
            "source_type": "original_video",
            "source_path": str(saved_video_path),
            "uses_ball_marker": False,
        }

        if ball_summary and ball_summary.get("processed_ball_video_path"):
            clip_source_video_path = Path(ball_summary.get("processed_ball_video_path"))
            clip_source = {
                "source_type": "processed_ball_video",
                "source_path": ball_summary.get("processed_ball_video_path"),
                "uses_ball_marker": True,
            }

        review_clips = generate_review_clips(
            video_path=clip_source_video_path,
            review_moments=review_moments,
            clip_source=clip_source,
        )

        review_clips = enrich_review_clips_with_full_urls(
            review_clips=review_clips,
            base_url=str(request.base_url),
        )

        review_summary = build_review_summary(
            match_event_summary=match_event_summary,
            review_moments=review_moments,
            review_clips=review_clips,
            base_url=str(request.base_url),
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
            "review_moments": review_moments,
            "review_clips": review_clips,
            "review_summary": review_summary,
        }

        camera_results.append(camera_result)

    match_summary = build_match_summary(camera_results)
    match_mode_validation = validate_match_mode(match_mode, camera_results)
    match_review_summary = build_match_review_summary(camera_results)

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
        "match_review_summary": match_review_summary,
        "needs_review": needs_review,
    }

    json_path = save_analysis_json("match_analysis", analysis_result)
    analysis_result["analysis_json_path"] = str(json_path)

    return analysis_result
