def build_shot_events(danger_events: dict | None, ball_summary: dict | None) -> dict:
    events = []
    warnings = []

    if not danger_events:
        return {
            "shot_events_available": False,
            "possible_shot_detected": False,
            "time_correlation_available": False,
            "events": [],
            "warnings": ["Danger events are required to build shot events."],
        }

    if not ball_summary:
        return {
            "shot_events_available": False,
            "possible_shot_detected": False,
            "time_correlation_available": False,
            "events": [],
            "warnings": ["Ball summary is required to build shot events."],
        }

    possible_shot_context = danger_events.get("possible_shot_context", False)
    ball_detected = ball_summary.get("ball_detected", False)
    time_correlation_available = danger_events.get("time_correlation_available", False)

    possible_shot_detected = possible_shot_context and ball_detected

    if not possible_shot_detected:
        warnings.append("No possible shot event was detected.")

    for danger_event in danger_events.get("events", []):
        event_type = danger_event.get("type")
        side = danger_event.get("side", "unknown")

        if event_type in ["possible_left_goal_danger_play", "possible_right_goal_danger_play"]:
            time_correlated = danger_event.get("time_correlated", False)
            confidence = "basic"

            if time_correlated:
                confidence = "time_correlated"

            events.append(
                {
                    "type": "possible_shot_event",
                    "side": side,
                    "confidence": confidence,
                    "time_correlated": time_correlated,
                    "time_correlation_window_seconds": danger_event.get(
                        "time_correlation_window_seconds"
                    ),
                    "time_correlations": danger_event.get("time_correlations", []),
                    "source_event": event_type,
                    "description": f"Possible shot context detected near the {side} goal area.",
                }
            )

    return {
        "shot_events_available": True,
        "possible_shot_detected": possible_shot_detected,
        "time_correlation_available": time_correlation_available,
        "events": events,
        "warnings": warnings,
    }
