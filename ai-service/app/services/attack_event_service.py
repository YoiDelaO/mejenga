def build_attack_events(detection_summary: dict | None) -> dict:
    if not detection_summary:
        return {
            "attack_events_available": False,
            "possible_attack_detected": False,
            "events": [],
            "warnings": ["Player detection summary is required to build attack events."],
        }

    goal_area_activity = detection_summary.get("goal_area_activity")

    if not goal_area_activity:
        return {
            "attack_events_available": False,
            "possible_attack_detected": False,
            "events": [],
            "warnings": ["Goal area activity is required to build attack events."],
        }

    left_count = goal_area_activity.get("left_goal_area_detections", 0)
    right_count = goal_area_activity.get("right_goal_area_detections", 0)
    total_count = goal_area_activity.get("total_goal_area_detections", 0)

    events = []
    warnings = []

    possible_attack_detected = total_count > 0

    if left_count >= 10:
        events.append(
            {
                "type": "left_goal_area_pressure",
                "side": "left",
                "detections": left_count,
                "confidence": "basic",
                "description": "Repeated player activity was detected near the left goal area.",
            }
        )
    elif left_count > 0:
        events.append(
            {
                "type": "left_goal_area_activity",
                "side": "left",
                "detections": left_count,
                "confidence": "low",
                "description": "Some player activity was detected near the left goal area.",
            }
        )

    if right_count >= 10:
        events.append(
            {
                "type": "right_goal_area_pressure",
                "side": "right",
                "detections": right_count,
                "confidence": "basic",
                "description": "Repeated player activity was detected near the right goal area.",
            }
        )
    elif right_count > 0:
        events.append(
            {
                "type": "right_goal_area_activity",
                "side": "right",
                "detections": right_count,
                "confidence": "low",
                "description": "Some player activity was detected near the right goal area.",
            }
        )

    if not events:
        warnings.append("No attack-like activity was detected near goal areas.")

    return {
        "attack_events_available": True,
        "possible_attack_detected": possible_attack_detected,
        "total_goal_area_detections": total_count,
        "left_goal_area_detections": left_count,
        "right_goal_area_detections": right_count,
        "events": events,
        "warnings": warnings,
    }
