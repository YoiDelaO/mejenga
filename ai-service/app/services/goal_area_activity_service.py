def is_point_inside_zone(x: int, y: int, zone: dict) -> bool:
    return (
        zone["x_min"] <= x <= zone["x_max"]
        and zone["y_min"] <= y <= zone["y_max"]
    )


def summarize_goal_area_activity(goal_area_activity: dict) -> dict:
    left_count = goal_area_activity.get("left_goal_area_detections", 0)
    right_count = goal_area_activity.get("right_goal_area_detections", 0)

    left_timestamps = goal_area_activity.get("left_goal_area_timestamps", [])
    right_timestamps = goal_area_activity.get("right_goal_area_timestamps", [])

    total_goal_area_detections = left_count + right_count
    activity_detected = total_goal_area_detections > 0

    events = []

    if left_count > 0:
        events.append(
            {
                "type": "players_near_left_goal_area",
                "detections": left_count,
                "confidence": "basic",
            }
        )

    if right_count > 0:
        events.append(
            {
                "type": "players_near_right_goal_area",
                "detections": right_count,
                "confidence": "basic",
            }
        )

    return {
        "activity_detected": activity_detected,
        "total_goal_area_detections": total_goal_area_detections,
        "left_goal_area_detections": left_count,
        "right_goal_area_detections": right_count,
        "left_goal_area_timestamps": left_timestamps,
        "right_goal_area_timestamps": right_timestamps,
        "events": events,
    }
