def get_first_available_value(*values):
    for value in values:
        if value:
            return value

    return None


def extend_warnings(warnings: list, source_warnings):
    if isinstance(source_warnings, list):
        warnings.extend(source_warnings)
        return

    if source_warnings:
        warnings.append(source_warnings)


def build_frontend_match_summary(
    match_multicamera_events: dict,
    match_review_summary: dict,
    match_mode_validation: dict,
    match_summary: dict,
    match_action_required: str,
    needs_review: bool,
) -> dict:
    requires_human_review = match_multicamera_events.get(
        "review_decision_required",
        False,
    )
    review_ready = match_review_summary.get("frontend_ready", False)
    has_review_clips = match_review_summary.get("review_clip_count", 0) > 0
    has_multicamera_event = (
        match_multicamera_events.get("correlated_event_count", 0) > 0
    )

    frontend_status = "analysis_ready"
    main_message = "Match analysis completed."
    primary_action = "none"

    if match_action_required == "fix_camera_setup":
        frontend_status = "camera_setup_required"
        main_message = "Camera setup must be completed before validating the match."
        primary_action = "fix_camera_setup"

    elif requires_human_review:
        frontend_status = "human_review_required"
        main_message = "A multicamera event requires human review."
        primary_action = "review_multicamera_event"

    elif review_ready:
        frontend_status = "review_ready"
        main_message = "Match review clips are ready."
        primary_action = "review_clips"

    elif needs_review is False:
        frontend_status = "no_review_needed"
        main_message = "Match analysis completed. No review is required."

    primary_video_url = get_first_available_value(
        match_multicamera_events.get("review_decision_playback_url"),
        match_multicamera_events.get("primary_recommended_playback_url"),
        match_review_summary.get("recommended_primary_playback_url"),
    )
    primary_camera_id = get_first_available_value(
        match_multicamera_events.get("review_decision_camera_id"),
        match_multicamera_events.get("primary_recommended_camera_id"),
        match_review_summary.get("recommended_primary_camera_id"),
    )
    primary_camera_angle = get_first_available_value(
        match_multicamera_events.get("review_decision_camera_angle"),
        match_multicamera_events.get("primary_recommended_camera_angle"),
        match_review_summary.get("recommended_primary_camera_angle"),
    )

    warnings = []
    extend_warnings(warnings, match_mode_validation.get("warnings"))
    extend_warnings(warnings, match_summary.get("combined_warnings"))
    extend_warnings(warnings, match_multicamera_events.get("warnings"))

    return {
        "summary_available": True,
        "frontend_status": frontend_status,
        "main_message": main_message,
        "primary_action": primary_action,
        "primary_video_url": primary_video_url,
        "primary_camera_id": primary_camera_id,
        "primary_camera_angle": primary_camera_angle,
        "has_review_clips": has_review_clips,
        "has_multicamera_event": has_multicamera_event,
        "requires_human_review": requires_human_review,
        "review_decision_endpoint": (
            "/review-decision" if requires_human_review else None
        ),
        "review_decision_type": match_multicamera_events.get(
            "review_decision_type",
            "none",
        ),
        "review_decision_options": match_multicamera_events.get(
            "review_decision_options",
            [],
        ),
        "match_action_required": match_action_required,
        "needs_review": needs_review,
        "camera_setup_valid": match_mode_validation.get("is_valid_for_mode"),
        "missing_required_angles": match_mode_validation.get(
            "missing_required_angles",
            [],
        ),
        "warnings": warnings,
    }
