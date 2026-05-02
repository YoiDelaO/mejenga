def get_field_zones(video_info: dict) -> dict:
    width = video_info.get("width", 0)
    height = video_info.get("height", 0)

    if width <= 0 or height <= 0:
        return {
            "zones_available": False,
            "error": "Video dimensions are not available.",
            "zones": {},
        }

    left_goal_area_end = int(width * 0.20)
    right_goal_area_start = int(width * 0.80)

    zones = {
        "left_goal_area": {
            "x_min": 0,
            "x_max": left_goal_area_end,
            "y_min": 0,
            "y_max": height,
        },
        "central_area": {
            "x_min": left_goal_area_end,
            "x_max": right_goal_area_start,
            "y_min": 0,
            "y_max": height,
        },
        "right_goal_area": {
            "x_min": right_goal_area_start,
            "x_max": width,
            "y_min": 0,
            "y_max": height,
        },
    }

    return {
        "zones_available": True,
        "method": "approximate_horizontal_split",
        "note": "Initial zone detection based on video width. This does not detect real goalposts yet.",
        "zones": zones,
    }
