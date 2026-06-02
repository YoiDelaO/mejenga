def build_match_action_summary(
    match_mode_validation: dict,
    match_review_summary: dict,
) -> dict:
    match_action_required = "none"
    match_action_message = "No match action is required."

    if not match_mode_validation.get("is_valid_for_mode", False):
        match_action_required = "fix_camera_setup"
        match_action_message = (
            "Match camera setup is incomplete for the selected match mode. "
            "Please fix the camera setup before validating the match."
        )
    elif match_review_summary.get("frontend_ready", False):
        match_action_required = "review_clips"
        match_action_message = "Match review clips are available. Please review the clips before final validation."

    match_action_details = {
        "match_mode": match_mode_validation.get("match_mode"),
        "is_valid_for_mode": match_mode_validation.get("is_valid_for_mode"),
        "camera_count": match_mode_validation.get("camera_count"),
        "minimum_cameras": match_mode_validation.get("minimum_cameras"),
        "recommended_cameras": match_mode_validation.get("recommended_cameras"),
        "missing_required_angles": match_mode_validation.get("missing_required_angles", []),
        "match_review_status": match_review_summary.get("match_review_status"),
        "frontend_ready": match_review_summary.get("frontend_ready"),
        "review_clip_count": match_review_summary.get("review_clip_count"),
        "recommended_playback_url_count": match_review_summary.get("recommended_playback_url_count"),
        "recommended_primary_playback_url": match_review_summary.get("recommended_primary_playback_url"),
    }

    return {
        "match_action_required": match_action_required,
        "match_action_message": match_action_message,
        "match_action_details": match_action_details,
    }
