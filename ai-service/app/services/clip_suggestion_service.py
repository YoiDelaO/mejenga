CLIP_SECONDS_BEFORE_EVENT = 3
CLIP_SECONDS_AFTER_EVENT = 3


def build_clip_suggestions(
    match_event_summary: dict | None,
    video_info: dict | None,
) -> dict:
    if not match_event_summary:
        return {
            "clip_suggestions_available": False,
            "suggestions": [],
            "warnings": ["Match event summary is required to build clip suggestions."],
        }

    if not video_info or not video_info.get("readable", False):
        return {
            "clip_suggestions_available": False,
            "suggestions": [],
            "warnings": ["Readable video information is required to build clip suggestions."],
        }

    duration_seconds = video_info.get("duration_seconds", 0)
    timeline_events = match_event_summary.get("timeline_events", [])

    suggestions = []

    for index, event in enumerate(timeline_events, start=1):
        timestamp = event.get("primary_timestamp_seconds")

        if timestamp is None:
            continue

        start_time_seconds = round(max(timestamp - CLIP_SECONDS_BEFORE_EVENT, 0), 2)
        end_time_seconds = round(min(timestamp + CLIP_SECONDS_AFTER_EVENT, duration_seconds), 2)

        suggestions.append(
            {
                "clip_id": f"clip_{index}",
                "category": event.get("category"),
                "type": event.get("type"),
                "side": event.get("side", "unknown"),
                "confidence": event.get("confidence", "unknown"),
                "primary_timestamp_seconds": timestamp,
                "start_time_seconds": start_time_seconds,
                "end_time_seconds": end_time_seconds,
                "duration_seconds": round(end_time_seconds - start_time_seconds, 2),
                "reason": event.get("description"),
                "requires_goal_camera_validation": event.get("category") == "goal_candidate",
                "is_confirmed_goal": event.get("is_confirmed_goal", False),
            }
        )

    return {
        "clip_suggestions_available": True,
        "seconds_before_event": CLIP_SECONDS_BEFORE_EVENT,
        "seconds_after_event": CLIP_SECONDS_AFTER_EVENT,
        "suggestion_count": len(suggestions),
        "suggestions": suggestions,
        "warnings": [],
    }
