def build_match_summary(camera_results: list[dict]) -> dict:
    camera_count = len(camera_results)

    usable_cameras = 0
    limited_cameras = 0
    unusable_cameras = 0

    side_cameras = 0
    goal_cameras = 0
    unknown_angle_cameras = 0

    cameras_with_detection = 0
    cameras_with_tracking = 0
    cameras_with_ball = 0

    combined_warnings = []
    combined_info = []

    for camera_result in camera_results:
        camera_id = camera_result.get("camera_id")
        camera_angle = camera_result.get("camera_angle", "unknown")

        video_quality = camera_result.get("video_quality", {})
        detection_summary = camera_result.get("detection_summary")
        tracking_summary = camera_result.get("tracking_summary")
        ball_summary = camera_result.get("ball_summary")
        analysis_events = camera_result.get("analysis_events", {})

        quality_status = video_quality.get("quality_status")

        if quality_status == "usable":
            usable_cameras += 1
        elif quality_status == "limited":
            limited_cameras += 1
        else:
            unusable_cameras += 1

        if camera_angle in ["side_left", "side_right"]:
            side_cameras += 1
        elif camera_angle in ["goal_left", "goal_right"]:
            goal_cameras += 1
        else:
            unknown_angle_cameras += 1

        if detection_summary:
            cameras_with_detection += 1

        if tracking_summary:
            cameras_with_tracking += 1

        if ball_summary and ball_summary.get("ball_detected"):
            cameras_with_ball += 1

        critical_warnings = analysis_events.get("critical_warnings", [])
        info_warnings = analysis_events.get("info_warnings", [])

        for warning in critical_warnings:
            combined_warnings.append(f"{camera_id}: {warning}")

        for warning in info_warnings:
            combined_info.append(f"{camera_id}: {warning}")

    if side_cameras == 0:
        combined_info.append("No side cameras were provided. Tactical movement analysis may be limited.")

    if goal_cameras == 0:
        combined_info.append("No goal cameras were provided. Goal validation may be limited.")

    if unknown_angle_cameras > 0:
        combined_info.append("Some cameras have unknown angles.")

    match_status = "ok"

    if camera_count == 0:
        match_status = "needs_review"
        combined_warnings.append("No camera videos were uploaded.")

    elif usable_cameras == 0:
        match_status = "needs_review"
        combined_warnings.append("No usable camera videos were found.")

    elif cameras_with_detection == 0:
        match_status = "needs_review"
        combined_warnings.append("No player detection was available from any camera.")

    return {
        "match_analysis_available": True,
        "camera_count": camera_count,
        "usable_cameras": usable_cameras,
        "limited_cameras": limited_cameras,
        "unusable_cameras": unusable_cameras,
        "side_cameras": side_cameras,
        "goal_cameras": goal_cameras,
        "unknown_angle_cameras": unknown_angle_cameras,
        "cameras_with_detection": cameras_with_detection,
        "cameras_with_tracking": cameras_with_tracking,
        "cameras_with_ball_detected": cameras_with_ball,
        "match_status": match_status,
        "combined_warnings": combined_warnings,
        "combined_info": combined_info,
    }
