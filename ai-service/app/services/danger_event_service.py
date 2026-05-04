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
            "events": [],
            "warnings": ["Player detection summary is required to build danger events."],
        }

    if not ball_summary:
        return {
            "danger_events_available": False,
            "possible_danger_play": False,
            "possible_shot_context": False,
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

    possible_danger_play = players_near_goal and ball_near_goal
    possible_shot_context = False

    if left_player_count > 0 and left_ball_count > 0:
        possible_shot_context = True
        events.append(
            {
                "type": "possible_left_goal_danger_play",
                "side": "left",
                "player_goal_area_detections": left_player_count,
                "ball_goal_area_detections": left_ball_count,
                "confidence": "basic",
                "description": "Players and ball were detected near the left goal area.",
            }
        )

    if right_player_count > 0 and right_ball_count > 0:
        possible_shot_context = True
        events.append(
            {
                "type": "possible_right_goal_danger_play",
                "side": "right",
                "player_goal_area_detections": right_player_count,
                "ball_goal_area_detections": right_ball_count,
                "confidence": "basic",
                "description": "Players and ball were detected near the right goal area.",
            }
        )

    if possible_danger_play and not possible_shot_context:
        events.append(
            {
                "type": "possible_general_danger_play",
                "side": "unknown",
                "confidence": "low",
                "description": "Players and ball were detected near goal areas, but not clearly on the same side.",
            }
        )

    if not possible_danger_play:
        warnings.append("No combined player and ball danger context was detected near goal areas.")

    return {
        "danger_events_available": True,
        "possible_danger_play": possible_danger_play,
        "possible_shot_context": possible_shot_context,
        "players_near_goal_area": players_near_goal,
        "ball_near_goal_area": ball_near_goal,
        "left_goal_area": {
            "player_detections": left_player_count,
            "ball_detections": left_ball_count,
        },
        "right_goal_area": {
            "player_detections": right_player_count,
            "ball_detections": right_ball_count,
        },
        "events": events,
        "warnings": warnings,
    }
