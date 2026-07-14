ALLOWED_MANUAL_REVIEW_DECISIONS = [
    "confirm_goal",
    "reject_goal",
    "mark_uncertain",
    "confirm_shot",
    "reject_shot",
]


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


def get_manual_goal_status(decision: str) -> str:
    if decision == "confirm_goal":
        return "confirmed_by_human"

    if decision == "reject_goal":
        return "rejected_by_human"

    if decision == "mark_uncertain":
        return "uncertain_by_human"

    return "not_applicable"


def get_manual_event_status(decision: str) -> str:
    if decision in ["confirm_goal", "confirm_shot"]:
        return "confirmed_by_human"

    if decision in ["reject_goal", "reject_shot"]:
        return "rejected_by_human"

    if decision == "mark_uncertain":
        return "uncertain_by_human"

    return "not_applicable"


def validate_manual_review_decision(decision_payload: dict) -> list[str]:
    errors = []
    event_id = decision_payload.get("event_id")
    decision = decision_payload.get("decision")

    if not event_id or not str(event_id).strip():
        errors.append("event_id is required.")

    if not decision or not str(decision).strip():
        errors.append("decision is required.")

    elif decision not in ALLOWED_MANUAL_REVIEW_DECISIONS:
        allowed_decisions = ", ".join(ALLOWED_MANUAL_REVIEW_DECISIONS)
        errors.append(
            f"decision must be one of: {allowed_decisions}."
        )

    return errors


def build_manual_review_decision_response(decision_payload: dict) -> dict:
    decision = decision_payload.get("decision")

    return {
        "decision_received": True,
        "decision_status": "accepted",
        "event_id": decision_payload.get("event_id"),
        "decision": decision,
        "manual_goal_status": get_manual_goal_status(decision),
        "manual_event_status": get_manual_event_status(decision),
        "requires_persistence": True,
        "persistence_status": "not_implemented",
        "message": "Manual review decision received. Persistence is not implemented yet.",
    }


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
