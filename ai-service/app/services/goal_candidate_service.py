def build_goal_candidate_events(
    shot_events: dict | None,
    danger_events: dict | None,
    ball_summary: dict | None,
) -> dict:
    events = []
    warnings = []

    if not shot_events:
        return {
            "goal_candidate_events_available": False,
            "possible_goal_candidate_detected": False,
            "time_correlation_available": False,
            "events": [],
            "warnings": ["Shot events are required to build goal candidate events."],
        }

    if not danger_events:
        return {
            "goal_candidate_events_available": False,
            "possible_goal_candidate_detected": False,
            "time_correlation_available": False,
            "events": [],
            "warnings": ["Danger events are required to build goal candidate events."],
        }

    if not ball_summary:
        return {
            "goal_candidate_events_available": False,
            "possible_goal_candidate_detected": False,
            "time_correlation_available": False,
            "events": [],
            "warnings": ["Ball summary is required to build goal candidate events."],
        }

    possible_shot_detected = shot_events.get("possible_shot_detected", False)
    possible_shot_context = danger_events.get("possible_shot_context", False)
    time_correlation_available = shot_events.get("time_correlation_available", False)

    ball_goal_area_activity = ball_summary.get("ball_goal_area_activity", {})
    ball_near_goal_area = ball_goal_area_activity.get("ball_near_goal_area_detected", False)

    possible_goal_candidate_detected = (
        possible_shot_detected
        and possible_shot_context
        and ball_near_goal_area
    )

    if not possible_goal_candidate_detected:
        warnings.append("No possible goal candidate was detected.")

    for shot_event in shot_events.get("events", []):
        side = shot_event.get("side", "unknown")
        time_correlated = shot_event.get("time_correlated", False)
        confidence = shot_event.get("confidence", "basic")

        if side == "left":
            left_ball_count = ball_goal_area_activity.get("left_goal_area_ball_detections", 0)

            if left_ball_count > 0:
                events.append(
                    {
                        "type": "possible_goal_candidate",
                        "side": "left",
                        "confidence": confidence,
                        "time_correlated": time_correlated,
                        "time_correlation_window_seconds": shot_event.get(
                            "time_correlation_window_seconds"
                        ),
                        "time_correlations": shot_event.get("time_correlations", []),
                        "source_event": shot_event.get("type"),
                        "description": "Possible goal candidate detected near the left goal area. This is not a confirmed goal.",
                    }
                )

        elif side == "right":
            right_ball_count = ball_goal_area_activity.get("right_goal_area_ball_detections", 0)

            if right_ball_count > 0:
                events.append(
                    {
                        "type": "possible_goal_candidate",
                        "side": "right",
                        "confidence": confidence,
                        "time_correlated": time_correlated,
                        "time_correlation_window_seconds": shot_event.get(
                            "time_correlation_window_seconds"
                        ),
                        "time_correlations": shot_event.get("time_correlations", []),
                        "source_event": shot_event.get("type"),
                        "description": "Possible goal candidate detected near the right goal area. This is not a confirmed goal.",
                    }
                )

        else:
            events.append(
                {
                    "type": "possible_goal_candidate",
                    "side": "unknown",
                    "confidence": "low",
                    "time_correlated": time_correlated,
                    "time_correlation_window_seconds": shot_event.get(
                        "time_correlation_window_seconds"
                    ),
                    "time_correlations": shot_event.get("time_correlations", []),
                    "source_event": shot_event.get("type"),
                    "description": "Possible goal candidate detected, but the goal area side is unclear. This is not a confirmed goal.",
                }
            )

    if possible_goal_candidate_detected and not events:
        warnings.append("A possible goal candidate context exists, but no side-specific event was created.")

    return {
        "goal_candidate_events_available": True,
        "possible_goal_candidate_detected": possible_goal_candidate_detected,
        "requires_goal_camera_validation": True,
        "is_confirmed_goal": False,
        "time_correlation_available": time_correlation_available,
        "events": events,
        "warnings": warnings,
    }
