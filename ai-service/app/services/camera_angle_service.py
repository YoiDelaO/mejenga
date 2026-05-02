VALID_CAMERA_ANGLES = {
    "side_left",
    "side_right",
    "goal_left",
    "goal_right",
    "corner_left",
    "corner_right",
    "midfield_left",
    "midfield_right",
    "unknown",
}


CAMERA_ANGLE_DESCRIPTIONS = {
    "side_left": "Side camera on the left side of the field. Useful for general match analysis.",
    "side_right": "Side camera on the right side of the field. Useful for general match analysis.",
    "goal_left": "Camera behind the left goal. Useful for goal validation.",
    "goal_right": "Camera behind the right goal. Useful for goal validation.",
    "corner_left": "Camera placed near a left corner. Useful as an alternative angle.",
    "corner_right": "Camera placed near a right corner. Useful as an alternative angle.",
    "midfield_left": "Camera near midfield on the left side. Useful for tactical movement analysis.",
    "midfield_right": "Camera near midfield on the right side. Useful for tactical movement analysis.",
    "unknown": "Camera angle was not specified or could not be recognized.",
}


RECOMMENDED_RANKED_CAMERA_SETUP = {
    "minimum_ranked": {
        "required_cameras": 1,
        "recommended_angles": ["side_left"],
        "description": "Minimum setup for early testing. Analysis may be limited.",
    },
    "basic_ranked": {
        "required_cameras": 2,
        "recommended_angles": ["side_left", "side_right"],
        "description": "Recommended for better field coverage and player movement analysis.",
    },
    "verified_ranked": {
        "required_cameras": 4,
        "recommended_angles": ["side_left", "side_right", "goal_left", "goal_right"],
        "description": "Ideal setup for Mejengas ranked matches with side coverage and goal validation support.",
    },
}


def normalize_camera_angle(angle: str | None) -> str:
    if angle is None:
        return "unknown"

    clean_angle = angle.strip().lower()

    if clean_angle in VALID_CAMERA_ANGLES:
        return clean_angle

    return "unknown"


def validate_camera_angles(camera_angles: dict) -> dict:
    normalized_angles = {}
    invalid_angles = {}

    for camera_id, angle in camera_angles.items():
        normalized_angle = normalize_camera_angle(angle)
        normalized_angles[camera_id] = normalized_angle

        if angle is not None and normalized_angle == "unknown" and angle.strip().lower() != "unknown":
            invalid_angles[camera_id] = angle

    return {
        "valid_angles": len(invalid_angles) == 0,
        "normalized_angles": normalized_angles,
        "invalid_angles": invalid_angles,
        "allowed_angles": sorted(list(VALID_CAMERA_ANGLES)),
    }


def get_camera_angle_metadata() -> dict:
    return {
        "allowed_angles": sorted(list(VALID_CAMERA_ANGLES)),
        "angle_descriptions": CAMERA_ANGLE_DESCRIPTIONS,
        "recommended_ranked_camera_setup": RECOMMENDED_RANKED_CAMERA_SETUP,
    }
