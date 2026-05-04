TIME_CORRELATION_WINDOW_SECONDS = 1.5


def find_time_correlations(
    player_timestamps: list,
    ball_timestamps: list,
    max_time_difference: float = TIME_CORRELATION_WINDOW_SECONDS,
) -> list:
    correlations = []

    for player_event in player_timestamps:
        player_time = player_event.get("timestamp_seconds")

        if player_time is None:
            continue

        for ball_event in ball_timestamps:
            ball_time = ball_event.get("timestamp_seconds")

            if ball_time is None:
                continue

            time_difference = abs(player_time - ball_time)

            if time_difference <= max_time_difference:
                correlations.append(
                    {
                        "player_timestamp_seconds": player_time,
                        "ball_timestamp_seconds": ball_time,
                        "time_difference_seconds": round(time_difference, 2),
                        "player_frame_index": player_event.get("frame_index"),
                        "ball_frame_index": ball_event.get("frame_index"),
                        "player_position": {
                            "center_x": player_event.get("center_x"),
                            "center_y": player_event.get("center_y"),
                        },
                        "ball_position": {
                            "center_x": ball_event.get("center_x"),
                            "center_y": ball_event.get("center_y"),
                        },
                        "player_confidence": player_event.get("confidence"),
                        "ball_confidence": ball_event.get("confidence"),
                    }
                )

    return correlations


def build_danger_events(
    detection_summary: dict | None,
    ball_summary: dict | None,
    attack_events: dict | None,
) -> dict:
    events = []
    warnings = []

    if not detection_summary:
        return {
            "danger_events_available": False,
            "possible_danger_play": False,
            "possible_shot_context": False,
            "time_correlation_available": False,
            "events": [],
            "warnings": ["Player detection summary is required to build danger events."],
        }

    if not ball_summary:
        return {
            "danger_events_available": False,
            "possible_danger_play": False,
            "possible_shot_context": False,
            "time_correlation_available": False,
            "events": [],
            "warnings": ["Ball summary is required to build danger events."],
        }

    goal_area_activity = detection_summary.get("goal_area_activity", {})
    ball_goal_area_activity = ball_summary.get("ball_goal_area_activity", {})

    players_near_goal = goal_area_activity.get("activity_detected", False)
    ball_near_goal = ball_goal_area_activity.get("ball_near_goal_area_detected", False)

    left_player_count = goal_area_activity.get("left_goal_area_detections", 0)
    right_player_count = goal_area_activity.get("right_goal_area_detections", 0)

    left_ball_count = ball_goal_area_activity.get("left_goal_area_ball_detections", 0)
    right_ball_count = ball_goal_area_activity.get("right_goal_area_ball_detections", 0)

    left_player_timestamps = goal_area_activity.get("left_goal_area_timestamps", [])
    right_player_timestamps = goal_area_activity.get("right_goal_area_timestamps", [])

    left_ball_timestamps = ball_goal_area_activity.get("left_goal_area_timestamps", [])
    right_ball_timestamps = ball_goal_area_activity.get("right_goal_area_timestamps", [])

    left_time_correlations = find_time_correlations(
        player_timestamps=left_player_timestamps,
        ball_timestamps=left_ball_timestamps,
    )

    right_time_correlations = find_time_correlations(
        player_timestamps=right_player_timestamps,
        ball_timestamps=right_ball_timestamps,
    )

    has_left_time_correlation = len(left_time_correlations) > 0
    has_right_time_correlation = len(right_time_correlations) > 0

    time_correlation_available = has_left_time_correlation or has_right_time_correlation

    possible_danger_play = players_near_goal and ball_near_goal
    possible_shot_context = False

    if left_player_count > 0 and left_ball_count > 0:
        possible_shot_context = True

        confidence = "basic"
        if has_left_time_correlation:
            confidence = "time_correlated"

        events.append(
            {
                "type": "possible_left_goal_danger_play",
                "side": "left",
                "player_goal_area_detections": left_player_count,
                "ball_goal_area_detections": left_ball_count,
                "time_correlated": has_left_time_correlation,
                "time_correlation_window_seconds": TIME_CORRELATION_WINDOW_SECONDS,
                "time_correlations": left_time_correlations,
                "confidence": confidence,
                "description": "Players and ball were detected near the left goal area.",
            }
        )

    if right_player_count > 0 and right_ball_count > 0:
        possible_shot_context = True

        confidence = "basic"
        if has_right_time_correlation:
            confidence = "time_correlated"

        events.append(
            {
                "type": "possible_right_goal_danger_play",
                "side": "right",
                "player_goal_area_detections": right_player_count,
                "ball_goal_area_detections": right_ball_count,
                "time_correlated": has_right_time_correlation,
                "time_correlation_window_seconds": TIME_CORRELATION_WINDOW_SECONDS,
                "time_correlations": right_time_correlations,
                "confidence": confidence,
                "description": "Players and ball were detected near the right goal area.",
            }
        )

    if possible_danger_play and not possible_shot_context:
        events.append(
            {
                "type": "possible_general_danger_play",
                "side": "unknown",
                "time_correlated": False,
                "time_correlation_window_seconds": TIME_CORRELATION_WINDOW_SECONDS,
                "time_correlations": [],
                "confidence": "low",
                "description": "Players and ball were detected near goal areas, but not clearly on the same side.",
            }
        )

    if not possible_danger_play:
        warnings.append("No combined player and ball danger context was detected near goal areas.")

    if possible_shot_context and not time_correlation_available:
        warnings.append(
            "Players and ball were detected near goal areas, but no close timestamp correlation was found."
        )

    return {
        "danger_events_available": True,
        "possible_danger_play": possible_danger_play,
        "possible_shot_context": possible_shot_context,
        "time_correlation_available": time_correlation_available,
        "time_correlation_window_seconds": TIME_CORRELATION_WINDOW_SECONDS,
        "players_near_goal_area": players_near_goal,
        "ball_near_goal_area": ball_near_goal,
        "left_goal_area": {
            "player_detections": left_player_count,
            "ball_detections": left_ball_count,
            "time_correlated": has_left_time_correlation,
            "time_correlations": left_time_correlations,
        },
        "right_goal_area": {
            "player_detections": right_player_count,
            "ball_detections": right_ball_count,
            "time_correlated": has_right_time_correlation,
            "time_correlations": right_time_correlations,
        },
        "events": events,
        "warnings": warnings,
    }
