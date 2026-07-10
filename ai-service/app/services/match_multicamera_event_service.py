CORRELATION_WINDOW_SECONDS = 2.0
SUPPORTED_EVENT_CATEGORIES = {
    "shot",
    "goal_candidate",
}
GOAL_CAMERA_BY_SIDE = {
    "left": "goal_left",
    "right": "goal_right",
}
SIDE_CAMERA_BY_SIDE = {
    "left": "side_left",
    "right": "side_right",
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


def build_available_review_camera(
    observation: dict,
    camera_result: dict | None,
    preferred_goal_camera_angle: str | None,
    preferred_side_camera_angle: str | None,
) -> dict:
    review_summary = {}
    video_quality = {}

    if camera_result:
        review_summary = camera_result.get("review_summary", {})
        video_quality = camera_result.get("video_quality", {})

    frontend_ready = review_summary.get("frontend_ready", False)
    recommended_playback_url = review_summary.get("recommended_playback_url")
    quality_status = video_quality.get("quality_status")
    camera_angle = observation.get("camera_angle")

    reason_parts = []

    if frontend_ready and recommended_playback_url:
        reason_parts.append("clip ready")
    else:
        reason_parts.append("no clip ready")

    if camera_angle == preferred_goal_camera_angle:
        reason_parts.append("preferred goal camera angle")
    elif camera_angle == preferred_side_camera_angle:
        reason_parts.append("preferred side camera angle")

    if quality_status == "usable":
        reason_parts.append("usable video quality")
    elif quality_status:
        reason_parts.append(f"{quality_status} video quality")
    else:
        reason_parts.append("unknown video quality")

    return {
        "camera_id": observation.get("camera_id"),
        "camera_angle": camera_angle,
        "frontend_ready": frontend_ready,
        "recommended_playback_url": recommended_playback_url,
        "quality_status": quality_status,
        "reason": ", ".join(reason_parts),
    }


def choose_recommended_review_camera(
    available_review_cameras: list[dict],
    side: str,
    has_goal_candidate: bool,
) -> tuple[dict | None, list[str]]:
    if not available_review_cameras:
        return None, ["No participating cameras were available for review recommendation."]

    recommendation_reasons = []
    candidate_pool = [
        camera for camera in available_review_cameras
        if camera.get("frontend_ready") and camera.get("recommended_playback_url")
    ]

    if candidate_pool:
        recommendation_reasons.append("Preferred cameras with a review clip ready.")
    else:
        candidate_pool = available_review_cameras
        recommendation_reasons.append("No participating camera has a review clip ready yet.")

    preferred_goal_camera_angle = GOAL_CAMERA_BY_SIDE.get(side)
    preferred_side_camera_angle = SIDE_CAMERA_BY_SIDE.get(side)

    if has_goal_candidate and preferred_goal_camera_angle:
        goal_camera_candidates = [
            camera for camera in candidate_pool
            if camera.get("camera_angle") == preferred_goal_camera_angle
        ]

        if goal_camera_candidates:
            candidate_pool = goal_camera_candidates
            recommendation_reasons.append(
                f"Preferred {preferred_goal_camera_angle} for a goal candidate on the {side} side."
            )

    if preferred_side_camera_angle:
        side_camera_candidates = [
            camera for camera in candidate_pool
            if camera.get("camera_angle") == preferred_side_camera_angle
        ]

        if side_camera_candidates:
            candidate_pool = side_camera_candidates
            recommendation_reasons.append(
                f"Preferred {preferred_side_camera_angle} for an event on the {side} side."
            )

    usable_camera_candidates = [
        camera for camera in candidate_pool
        if camera.get("quality_status") == "usable"
    ]

    if usable_camera_candidates:
        candidate_pool = usable_camera_candidates
        recommendation_reasons.append("Preferred a camera with usable video quality.")

    selected_camera = candidate_pool[0]
    recommendation_reasons.append(
        f"Selected {selected_camera.get('camera_id')} as the best participating review camera."
    )

    return selected_camera, recommendation_reasons


def build_review_camera_recommendation(
    observations: list[dict],
    camera_result_by_id: dict,
    categories: list[str],
) -> dict:
    side = observations[0]["side"]
    has_goal_candidate = "goal_candidate" in categories
    preferred_goal_camera_angle = None
    if has_goal_candidate:
        preferred_goal_camera_angle = GOAL_CAMERA_BY_SIDE.get(side)

    preferred_side_camera_angle = SIDE_CAMERA_BY_SIDE.get(side)
    available_review_cameras = []

    for observation in observations:
        camera_id = observation.get("camera_id")
        available_review_cameras.append(
            build_available_review_camera(
                observation=observation,
                camera_result=camera_result_by_id.get(camera_id),
                preferred_goal_camera_angle=preferred_goal_camera_angle,
                preferred_side_camera_angle=preferred_side_camera_angle,
            )
        )

    selected_camera, recommendation_reasons = choose_recommended_review_camera(
        available_review_cameras=available_review_cameras,
        side=side,
        has_goal_candidate=has_goal_candidate,
    )

    recommended_camera_id = None
    recommended_camera_angle = None
    recommended_playback_url = None

    if selected_camera:
        recommended_camera_id = selected_camera.get("camera_id")
        recommended_camera_angle = selected_camera.get("camera_angle")

        if selected_camera.get("frontend_ready"):
            recommended_playback_url = selected_camera.get("recommended_playback_url")

    return {
        "recommended_camera_id": recommended_camera_id,
        "recommended_camera_angle": recommended_camera_angle,
        "recommended_playback_url": recommended_playback_url,
        "recommendation_reasons": recommendation_reasons,
        "available_review_camera_count": len(available_review_cameras),
        "available_review_cameras": available_review_cameras,
    }


def build_correlated_event(
    event_id: str,
    observations: list[dict],
    camera_result_by_id: dict,
) -> dict:
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
    review_camera_recommendation = build_review_camera_recommendation(
        observations=observations,
        camera_result_by_id=camera_result_by_id,
        categories=categories,
    )

    correlated_event = {
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
    correlated_event.update(review_camera_recommendation)

    return correlated_event


def build_match_multicamera_events(camera_results: list[dict]) -> dict:
    warnings = [
        "Multicamera correlation assumes all videos start at approximately the same time."
    ]
    observations = extract_event_observations(camera_results)
    camera_ids = {
        camera_result.get("camera_id")
        for camera_result in camera_results
    }
    camera_result_by_id = {
        camera_result.get("camera_id"): camera_result
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
                camera_result_by_id=camera_result_by_id,
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
