def get_primary_timestamp_from_event(event: dict) -> float | None:
    time_correlations = event.get("time_correlations", [])

    if not time_correlations:
        return None

    first_correlation = time_correlations[0]

    ball_timestamp = first_correlation.get("ball_timestamp_seconds")
    player_timestamp = first_correlation.get("player_timestamp_seconds")

    if ball_timestamp is not None:
        return ball_timestamp

    return player_timestamp


def build_important_event(category: str, event: dict, extra_fields: dict | None = None) -> dict:
    important_event = {
        "category": category,
        "type": event.get("type"),
        "side": event.get("side", "unknown"),
        "confidence": event.get("confidence", "unknown"),
        "description": event.get("description"),
        "time_correlated": event.get("time_correlated", False),
        "primary_timestamp_seconds": get_primary_timestamp_from_event(event),
        "time_correlation_window_seconds": event.get("time_correlation_window_seconds"),
        "time_correlation_count": len(event.get("time_correlations", [])),
    }

    if extra_fields:
        important_event.update(extra_fields)

    return important_event


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
                build_important_event(
                    category="attack",
                    event=event,
                )
            )

    if danger_events:
        has_danger_play = danger_events.get("possible_danger_play", False)

        for event in danger_events.get("events", []):
            important_events.append(
                build_important_event(
                    category="danger",
                    event=event,
                )
            )

    if shot_events:
        has_possible_shot = shot_events.get("possible_shot_detected", False)

        for event in shot_events.get("events", []):
            important_events.append(
                build_important_event(
                    category="shot",
                    event=event,
                )
            )

    if goal_candidate_events:
        has_goal_candidate = goal_candidate_events.get("possible_goal_candidate_detected", False)
        requires_goal_camera_validation = goal_candidate_events.get(
            "requires_goal_camera_validation",
            False,
        )

        for event in goal_candidate_events.get("events", []):
            important_events.append(
                build_important_event(
                    category="goal_candidate",
                    event=event,
                    extra_fields={
                        "is_confirmed_goal": goal_candidate_events.get("is_confirmed_goal", False),
                    },
                )
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

    timeline_events = [
        event for event in important_events
        if event.get("primary_timestamp_seconds") is not None
    ]

    timeline_events = sorted(
        timeline_events,
        key=lambda event: event["primary_timestamp_seconds"],
    )

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
        "timeline_event_count": len(timeline_events),
        "timeline_events": timeline_events,
    }
