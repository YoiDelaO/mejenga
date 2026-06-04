from app.services.detection_service import detect_players_in_video
from app.services.tracking_service import track_players_in_video
from app.services.ball_service import detect_ball_in_video
from app.services.video_processor import get_video_info
from app.services.video_quality_service import evaluate_video_quality
from app.services.field_zone_service import get_field_zones


def build_video_analysis_context(saved_video_path):
    video_info = get_video_info(saved_video_path)
    video_quality = evaluate_video_quality(video_info)
    field_zones = get_field_zones(video_info)

    return video_info, video_quality, field_zones


def run_optional_video_analysis(
    saved_video_path,
    video_info,
    run_detection,
    run_tracking,
    run_ball_detection,
):
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

    return detection_summary, tracking_summary, ball_summary
