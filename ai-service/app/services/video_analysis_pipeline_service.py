from app.services.detection_service import detect_players_in_video
from app.services.tracking_service import track_players_in_video
from app.services.ball_service import detect_ball_in_video
from app.services.video_processor import get_video_info
from app.services.video_quality_service import evaluate_video_quality
from app.services.field_zone_service import get_field_zones
from app.services.attack_event_service import build_attack_events
from app.services.danger_event_service import build_danger_events
from app.services.shot_event_service import build_shot_events
from app.services.goal_candidate_service import build_goal_candidate_events
from app.services.match_event_summary_service import build_match_event_summary


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


def build_video_event_analysis(
    detection_summary,
    ball_summary,
):
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

    return attack_events, danger_events, shot_events, goal_candidate_events, match_event_summary
