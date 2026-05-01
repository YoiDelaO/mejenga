def build_analysis_events(
    video_info: dict,
    detection_summary: dict | None,
    tracking_summary: dict | None,
    ball_summary: dict | None,
) -> dict:
    events = []
    warnings = []

    if not video_info.get("readable", False):
        warnings.append("Video could not be read.")
        return {
            "events_available": True,
            "events": events,
            "warnings": warnings,
            "overall_status": "needs_review",
        }

    events.append("Video is readable.")

    duration_seconds = video_info.get("duration_seconds", 0)

    if duration_seconds < 10:
        warnings.append("Video is very short for match analysis.")
    else:
        events.append("Video duration is acceptable for initial analysis.")

    if detection_summary:
        analysis_quality = detection_summary.get("analysis_quality")

        if analysis_quality == "useful":
            events.append("Player detection quality is useful.")
        elif analysis_quality == "limited":
            warnings.append("Player detection quality is limited.")
        else:
            warnings.append("Player detection quality is poor.")

        detected_warnings = detection_summary.get("warnings", [])
        warnings.extend(detected_warnings)
    else:
        warnings.append("Player detection was not executed.")

    if tracking_summary:
        unique_track_ids = tracking_summary.get("unique_track_ids", 0)
        max_simultaneous_tracks = tracking_summary.get("max_simultaneous_tracks", 0)

        events.append("Player tracking was executed.")

        if max_simultaneous_tracks > 0 and unique_track_ids > max_simultaneous_tracks * 4:
            warnings.append("Tracking may be fragmented because too many track IDs were generated.")
        else:
            events.append("Tracking ID count looks acceptable for a basic analysis.")
    else:
        events.append("Player tracking was not executed.")

    if ball_summary:
        if ball_summary.get("ball_detected"):
            events.append("Ball was detected in the video.")
        else:
            warnings.append("Ball was not detected in the analyzed frames.")

        ball_warnings = ball_summary.get("ball_warnings", [])
        warnings.extend(ball_warnings)
    else:
        events.append("Ball detection was not executed.")

    overall_status = "ok"

    if warnings:
        overall_status = "needs_review"

    return {
        "events_available": True,
        "events": events,
        "warnings": warnings,
        "overall_status": overall_status,
    }
