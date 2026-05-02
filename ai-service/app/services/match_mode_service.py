VALID_MATCH_MODES = {
    "casual",
    "ranked",
}


MATCH_MODE_RULES = {
    "casual": {
        "requires_video": False,
        "minimum_cameras": 0,
        "recommended_cameras": 0,
        "required_angles": [],
        "description": "Casual match mode. Video analysis is optional.",
    },
    "ranked": {
        "requires_video": True,
        "minimum_cameras": 4,
        "recommended_cameras": 4,
        "required_angles": ["side_left", "side_right", "goal_left", "goal_right"],
        "description": "Ranked match mode. Requires four cameras: two side cameras and two goal cameras.",
    },
}


def normalize_match_mode(match_mode: str | None) -> str:
    if match_mode is None:
        return "ranked"

    clean_mode = match_mode.strip().lower()

    if clean_mode in VALID_MATCH_MODES:
        return clean_mode

    return "ranked"


def validate_match_mode(match_mode: str | None, camera_results: list[dict]) -> dict:
    normalized_mode = normalize_match_mode(match_mode)
    rules = MATCH_MODE_RULES[normalized_mode]

    camera_count = len(camera_results)

    provided_angles = [
        camera.get("camera_angle", "unknown")
        for camera in camera_results
    ]

    missing_required_angles = [
        angle for angle in rules["required_angles"]
        if angle not in provided_angles
    ]

    warnings = []

    if camera_count < rules["minimum_cameras"]:
        warnings.append(
            f"{normalized_mode} requires at least {rules['minimum_cameras']} camera(s). "
            f"Only {camera_count} camera(s) were provided."
        )

    if missing_required_angles:
        warnings.append(
            f"{normalized_mode} is missing required camera angles: "
            f"{', '.join(missing_required_angles)}."
        )

    is_valid_for_mode = len(warnings) == 0

    return {
        "requested_match_mode": match_mode,
        "match_mode": normalized_mode,
        "is_valid_for_mode": is_valid_for_mode,
        "requires_video": rules["requires_video"],
        "camera_count": camera_count,
        "minimum_cameras": rules["minimum_cameras"],
        "recommended_cameras": rules["recommended_cameras"],
        "required_angles": rules["required_angles"],
        "provided_angles": provided_angles,
        "missing_required_angles": missing_required_angles,
        "warnings": warnings,
        "description": rules["description"],
    }


def get_match_mode_metadata() -> dict:
    return {
        "valid_match_modes": sorted(list(VALID_MATCH_MODES)),
        "match_mode_rules": MATCH_MODE_RULES,
    }
