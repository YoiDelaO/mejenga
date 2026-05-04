def build_analysis_events(
    video_info: dict,
    detection_summary: dict | None,
    tracking_summary: dict | None,
    ball_summary: dict | None,
    attack_events: dict | None = None,
    danger_events: dict | None = None,
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

    if attack_events:
        if attack_events.get("possible_attack_detected"):
            events.append("Possible attack activity was detected near goal areas.")

            for attack_event in attack_events.get("events", []):
                event_type = attack_event.get("type")

                if event_type == "left_goal_area_pressure":
                    events.append("Possible pressure detected near the left goal area.")

                if event_type == "right_goal_area_pressure":
                    events.append("Possible pressure detected near the right goal area.")

                if event_type == "left_goal_area_activity":
                    events.append("Some attack-like activity was detected near the left goal area.")

                if event_type == "right_goal_area_activity":
                    events.append("Some attack-like activity was detected near the right goal area.")
        else:
            attack_warnings = attack_events.get("warnings", [])
            info_warnings.extend(attack_warnings)

    if danger_events:
        if danger_events.get("possible_danger_play"):
            events.append("Possible danger play detected near goal areas.")

        if danger_events.get("possible_shot_context"):
            events.append("Possible shot context detected near goal areas.")

        for danger_event in danger_events.get("events", []):
            event_type = danger_event.get("type")

            if event_type == "possible_left_goal_danger_play":
                events.append("Possible danger play detected near the left goal area.")

            if event_type == "possible_right_goal_danger_play":
                events.append("Possible danger play detected near the right goal area.")

        danger_warnings = danger_events.get("warnings", [])
        info_warnings.extend(danger_warnings)

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

            ball_goal_area_activity = ball_summary.get("ball_goal_area_activity")

            if ball_goal_area_activity and ball_goal_area_activity.get("ball_near_goal_area_detected"):
                events.append("Ball was detected near goal areas.")

                left_ball_count = ball_goal_area_activity.get("left_goal_area_ball_detections", 0)
                right_ball_count = ball_goal_area_activity.get("right_goal_area_ball_detections", 0)

                if left_ball_count > 0:
                    events.append("Ball was detected near the left goal area.")

                if right_ball_count > 0:
                    events.append("Ball was detected near the right goal area.")
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
