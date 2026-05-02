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
