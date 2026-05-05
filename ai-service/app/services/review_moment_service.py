REVIEW_MOMENT_GROUP_WINDOW_SECONDS = 1.0


def get_highest_priority_category(categories: list[str]) -> str:
    priority_order = [
        "goal_candidate",
        "shot",
        "danger",
        "attack",
    ]

    for category in priority_order:
        if category in categories:
            return category

    return "unknown"


def build_review_moments(
    clip_suggestions: dict | None,
) -> dict:
    if not clip_suggestions:
        return {
            "review_moments_available": False,
            "moment_count": 0,
            "moments": [],
            "warnings": ["Clip suggestions are required to build review moments."],
        }

    suggestions = clip_suggestions.get("suggestions", [])

    if not suggestions:
        return {
            "review_moments_available": True,
            "moment_count": 0,
            "moments": [],
            "warnings": [],
        }

    sorted_suggestions = sorted(
        suggestions,
        key=lambda suggestion: suggestion.get("primary_timestamp_seconds", 0),
    )

    grouped_moments = []

    for suggestion in sorted_suggestions:
        timestamp = suggestion.get("primary_timestamp_seconds")

        if timestamp is None:
            continue

        added_to_existing_group = False

        for group in grouped_moments:
            group_timestamp = group["primary_timestamp_seconds"]

            if abs(timestamp - group_timestamp) <= REVIEW_MOMENT_GROUP_WINDOW_SECONDS:
                group["events"].append(suggestion)
                group["categories"].append(suggestion.get("category"))
                group["types"].append(suggestion.get("type"))
                group["requires_goal_camera_validation"] = (
                    group["requires_goal_camera_validation"]
                    or suggestion.get("requires_goal_camera_validation", False)
                )
                group["is_confirmed_goal"] = (
                    group["is_confirmed_goal"]
                    or suggestion.get("is_confirmed_goal", False)
                )
                group["start_time_seconds"] = min(
                    group["start_time_seconds"],
                    suggestion.get("start_time_seconds", group["start_time_seconds"]),
                )
                group["end_time_seconds"] = max(
                    group["end_time_seconds"],
                    suggestion.get("end_time_seconds", group["end_time_seconds"]),
                )
                added_to_existing_group = True
                break

        if not added_to_existing_group:
            grouped_moments.append(
                {
                    "primary_timestamp_seconds": timestamp,
                    "start_time_seconds": suggestion.get("start_time_seconds"),
                    "end_time_seconds": suggestion.get("end_time_seconds"),
                    "categories": [suggestion.get("category")],
                    "types": [suggestion.get("type")],
                    "requires_goal_camera_validation": suggestion.get(
                        "requires_goal_camera_validation",
                        False,
                    ),
                    "is_confirmed_goal": suggestion.get("is_confirmed_goal", False),
                    "events": [suggestion],
                }
            )

    review_moments = []

    for index, group in enumerate(grouped_moments, start=1):
        unique_categories = list(dict.fromkeys(group["categories"]))
        unique_types = list(dict.fromkeys(group["types"]))
        main_category = get_highest_priority_category(unique_categories)

        start_time = group["start_time_seconds"]
        end_time = group["end_time_seconds"]

        review_moments.append(
            {
                "review_moment_id": f"review_moment_{index}",
                "primary_timestamp_seconds": group["primary_timestamp_seconds"],
                "start_time_seconds": start_time,
                "end_time_seconds": end_time,
                "duration_seconds": round(end_time - start_time, 2),
                "main_category": main_category,
                "categories": unique_categories,
                "event_types": unique_types,
                "event_count": len(group["events"]),
                "requires_goal_camera_validation": group["requires_goal_camera_validation"],
                "is_confirmed_goal": group["is_confirmed_goal"],
                "events": group["events"],
            }
        )

    return {
        "review_moments_available": True,
        "group_window_seconds": REVIEW_MOMENT_GROUP_WINDOW_SECONDS,
        "moment_count": len(review_moments),
        "moments": review_moments,
        "warnings": [],
    }
