def build_analysis_events(
    video_info: dict,
    detection_summary: dict | None,
    tracking_summary: dict | None,
    ball_summary: dict | None,
) -> dict:
    events = []
    critical_warnings = []
    info_warnings = []

    if not video_info.get("readable", False):
        critical_warnings.append("Video could not be read.")
        return {
            "events_available": True,
            "events": events,
            "critical_warnings": critical_warnings,
            "info_warnings": info_warnings,
            "overall_status": "needs_review",
        }

    events.append("Video is readable.")

    duration_seconds = video_info.get("duration_seconds", 0)

    if duration_seconds < 10:
        critical_warnings.append("Video is very short for match analysis.")
    else:
        events.append("Video duration is acceptable for initial analysis.")

    if detection_summary:
        analysis_quality = detection_summary.get("analysis_quality")

        if analysis_quality == "useful":
            events.append("Player detection quality is useful.")
        elif analysis_quality == "limited":
            critical_warnings.append("Player detection quality is limited.")
        else:
            critical_warnings.append("Player detection quality is poor.")

        goal_area_activity = detection_summary.get("goal_area_activity")

        if goal_area_activity:
            if goal_area_activity.get("activity_detected"):
                events.append("Players were detected near goal areas.")

                left_count = goal_area_activity.get("left_goal_area_detections", 0)
                right_count = goal_area_activity.get("right_goal_area_detections", 0)

                if left_count > 0:
                    events.append("Players were detected near the left goal area.")

                if right_count > 0:
                    events.append("Players were detected near the right goal area.")
            else:
                info_warnings.append("No player activity was detected near goal areas.")

        detected_warnings = detection_summary.get("warnings", [])
        critical_warnings.extend(detected_warnings)
    else:
        info_warnings.append("Player detection was not executed.")

    if tracking_summary:
        unique_track_ids = tracking_summary.get("unique_track_ids", 0)
        max_simultaneous_tracks = tracking_summary.get("max_simultaneous_tracks", 0)

        events.append("Player tracking was executed.")

        if max_simultaneous_tracks > 0 and unique_track_ids > max_simultaneous_tracks * 4:
            info_warnings.append("Tracking may be fragmented because too many track IDs were generated.")
        else:
            events.append("Tracking ID count looks acceptable for a basic analysis.")
    else:
        events.append("Player tracking was not executed.")

    if ball_summary:
        if ball_summary.get("ball_detected"):
            events.append("Ball was detected in the video.")
        else:
            info_warnings.append("Ball was not detected in the analyzed frames.")

        ball_warnings = ball_summary.get("ball_warnings", [])
        info_warnings.extend(ball_warnings)
    else:
        events.append("Ball detection was not executed.")

    overall_status = "ok"

    if critical_warnings:
        overall_status = "needs_review"

    return {
        "events_available": True,
        "events": events,
        "critical_warnings": critical_warnings,
        "info_warnings": info_warnings,
        "overall_status": overall_status,
    }
