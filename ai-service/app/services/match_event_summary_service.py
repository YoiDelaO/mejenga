def build_match_event_summary(
    attack_events: dict | None,
    danger_events: dict | None,
    shot_events: dict | None,
    goal_candidate_events: dict | None,
) -> dict:
    important_events = []

    has_attack_activity = False
    has_danger_play = False
    has_possible_shot = False
    has_goal_candidate = False
    requires_goal_camera_validation = False
    confirmed_goals = 0

    if attack_events:
        has_attack_activity = attack_events.get("possible_attack_detected", False)

        for event in attack_events.get("events", []):
            important_events.append(
                {
                    "category": "attack",
                    "type": event.get("type"),
                    "side": event.get("side", "unknown"),
                    "confidence": event.get("confidence", "unknown"),
                    "description": event.get("description"),
                }
            )

    if danger_events:
        has_danger_play = danger_events.get("possible_danger_play", False)

        for event in danger_events.get("events", []):
            important_events.append(
                {
                    "category": "danger",
                    "type": event.get("type"),
                    "side": event.get("side", "unknown"),
                    "confidence": event.get("confidence", "unknown"),
                    "description": event.get("description"),
                }
            )

    if shot_events:
        has_possible_shot = shot_events.get("possible_shot_detected", False)

        for event in shot_events.get("events", []):
            important_events.append(
                {
                    "category": "shot",
                    "type": event.get("type"),
                    "side": event.get("side", "unknown"),
                    "confidence": event.get("confidence", "unknown"),
                    "description": event.get("description"),
                }
            )

    if goal_candidate_events:
        has_goal_candidate = goal_candidate_events.get("possible_goal_candidate_detected", False)
        requires_goal_camera_validation = goal_candidate_events.get(
            "requires_goal_camera_validation",
            False,
        )

        for event in goal_candidate_events.get("events", []):
            important_events.append(
                {
                    "category": "goal_candidate",
                    "type": event.get("type"),
                    "side": event.get("side", "unknown"),
                    "confidence": event.get("confidence", "unknown"),
                    "description": event.get("description"),
                    "is_confirmed_goal": goal_candidate_events.get("is_confirmed_goal", False),
                }
            )

        if goal_candidate_events.get("is_confirmed_goal", False):
            confirmed_goals = len(goal_candidate_events.get("events", []))

    summary_status = "normal"

    if has_goal_candidate:
        summary_status = "goal_candidate_review"

    elif has_possible_shot:
        summary_status = "possible_shot"

    elif has_danger_play:
        summary_status = "danger_play"

    elif has_attack_activity:
        summary_status = "attack_activity"

    return {
        "summary_available": True,
        "summary_status": summary_status,
        "has_attack_activity": has_attack_activity,
        "has_danger_play": has_danger_play,
        "has_possible_shot": has_possible_shot,
        "has_goal_candidate": has_goal_candidate,
        "requires_goal_camera_validation": requires_goal_camera_validation,
        "confirmed_goals": confirmed_goals,
        "important_event_count": len(important_events),
        "important_events": important_events,
    }
