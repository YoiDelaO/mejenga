def calculate_video_needs_review(
    video_info: dict,
    detection_summary: dict | None,
    analysis_events: dict,
) -> bool:
    needs_review = not video_info["readable"]

    if detection_summary and detection_summary.get("needs_admin_review"):
        needs_review = True

    if analysis_events.get("overall_status") == "needs_review":
        needs_review = True

    return needs_review


def calculate_match_needs_review(
    match_mode_validation: dict,
    match_summary: dict,
) -> bool:
    needs_review = False

    if match_mode_validation["match_mode"] == "ranked":
        if match_summary.get("match_status") == "needs_review":
            needs_review = True

        if not match_mode_validation["is_valid_for_mode"]:
            needs_review = True

    if match_mode_validation["match_mode"] == "casual":
        if not match_mode_validation["is_valid_for_mode"]:
            needs_review = True

    return needs_review
