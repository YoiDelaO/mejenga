CORRELATION_WINDOW_SECONDS = 2.0
SUPPORTED_EVENT_CATEGORIES = {
    "shot",
    "goal_candidate",
}


def build_event_observation(
    camera_id,
    camera_angle,
    event: dict,
) -> dict:
    observation = {
        "camera_id": camera_id,
        "camera_angle": camera_angle,
        "category": event.get("category"),
        "type": event.get("type"),
        "side": event.get("side", "unknown"),
        "primary_timestamp_seconds": event.get("primary_timestamp_seconds"),
        "confidence": event.get("confidence", "unknown"),
        "time_correlated": event.get("time_correlated", False),
    }

    if "requires_goal_camera_validation" in event:
        observation["requires_goal_camera_validation"] = event.get(
            "requires_goal_camera_validation",
            False,
        )

    if "is_confirmed_goal" in event or event.get("category") == "goal_candidate":
        observation["is_confirmed_goal"] = False

    return observation


def extract_event_observations(camera_results: list[dict]) -> list[dict]:
    observations = []

    for camera_result in camera_results:
        camera_id = camera_result.get("camera_id")
        camera_angle = camera_result.get("camera_angle")
        match_event_summary = camera_result.get("match_event_summary", {})

        for event in match_event_summary.get("timeline_events", []):
            if event.get("category") not in SUPPORTED_EVENT_CATEGORIES:
                continue

            if event.get("primary_timestamp_seconds") is None:
                continue

            observations.append(
                build_event_observation(
                    camera_id=camera_id,
                    camera_angle=camera_angle,
                    event=event,
                )
            )

    return sorted(
        observations,
        key=lambda observation: observation["primary_timestamp_seconds"],
    )


def build_correlated_event(event_id: str, observations: list[dict]) -> dict:
    timestamps = [
        observation["primary_timestamp_seconds"]
        for observation in observations
    ]
    categories = list(
        dict.fromkeys(
            observation["category"]
            for observation in observations
        )
    )
    event_types = list(
        dict.fromkeys(
            observation["type"]
            for observation in observations
        )
    )
    camera_ids = list(
        dict.fromkeys(
            observation["camera_id"]
            for observation in observations
        )
    )
    camera_angles = list(
        dict.fromkeys(
            observation["camera_angle"]
            for observation in observations
        )
    )

    return {
        "multicamera_event_id": event_id,
        "side": observations[0]["side"],
        "primary_timestamp_seconds": min(timestamps),
        "start_timestamp_seconds": min(timestamps),
        "end_timestamp_seconds": max(timestamps),
        "time_difference_seconds": round(max(timestamps) - min(timestamps), 2),
        "categories": categories,
        "event_types": event_types,
        "camera_count": len(camera_ids),
        "camera_ids": camera_ids,
        "camera_angles": camera_angles,
        "has_goal_candidate": "goal_candidate" in categories,
        "requires_goal_camera_validation": (
            "goal_candidate" in categories
            or any(
                observation.get("requires_goal_camera_validation", False)
                for observation in observations
            )
        ),
        "is_confirmed_goal": False,
        "observations": observations,
    }


def build_match_multicamera_events(camera_results: list[dict]) -> dict:
    warnings = [
        "Multicamera correlation assumes all videos start at approximately the same time."
    ]
    observations = extract_event_observations(camera_results)
    camera_ids = {
        camera_result.get("camera_id")
        for camera_result in camera_results
    }

    if len(camera_ids) == 1:
        warnings.append("At least two cameras are required to correlate multicamera events.")

    if not observations:
        warnings.append("No shot or goal candidate events with timestamps were available.")

    grouped_observations = []

    for observation in observations:
        added_to_group = False

        for group in grouped_observations:
            group_camera_ids = {
                grouped_observation["camera_id"]
                for grouped_observation in group
            }
            group_timestamp = group[0]["primary_timestamp_seconds"]

            if observation["camera_id"] in group_camera_ids:
                continue

            if observation["side"] != group[0]["side"]:
                continue

            if abs(observation["primary_timestamp_seconds"] - group_timestamp) > CORRELATION_WINDOW_SECONDS:
                continue

            group.append(observation)
            added_to_group = True
            break

        if not added_to_group:
            grouped_observations.append([observation])

    correlated_events = []

    for group in grouped_observations:
        group_camera_ids = {
            observation["camera_id"]
            for observation in group
        }

        if len(group_camera_ids) < 2:
            continue

        correlated_events.append(
            build_correlated_event(
                event_id=f"multicamera_event_{len(correlated_events) + 1}",
                observations=group,
            )
        )

    return {
        "multicamera_events_available": True,
        "assumes_synchronized_video_start": True,
        "correlation_window_seconds": CORRELATION_WINDOW_SECONDS,
        "observation_count": len(observations),
        "correlated_event_count": len(correlated_events),
        "events": correlated_events,
        "warnings": warnings,
    }
