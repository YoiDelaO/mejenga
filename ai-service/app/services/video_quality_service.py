def evaluate_video_quality(video_info: dict) -> dict:
    warnings = []
    info = []

    readable = video_info.get("readable", False)
    fps = video_info.get("fps", 0)
    duration_seconds = video_info.get("duration_seconds", 0)
    width = video_info.get("width", 0)
    height = video_info.get("height", 0)

    if not readable:
        return {
            "quality_available": True,
            "quality_status": "unusable",
            "orientation": "unknown",
            "resolution_quality": "unknown",
            "duration_quality": "unknown",
            "fps_quality": "unknown",
            "warnings": ["Video could not be read."],
            "info": [],
        }

    # Orientation
    orientation = "landscape"
    if height > width:
        orientation = "portrait"
        warnings.append("Video is vertical. Landscape video is recommended for match analysis.")
    else:
        info.append("Video is landscape.")

    # Resolution quality
    min_side = min(width, height)
    max_side = max(width, height)

    resolution_quality = "low"

    if max_side >= 1920 and min_side >= 1080:
        resolution_quality = "high"
        info.append("Video resolution is high.")
    elif max_side >= 1280 and min_side >= 720:
        resolution_quality = "medium"
        info.append("Video resolution is acceptable.")
    elif max_side >= 800 and min_side >= 450:
        resolution_quality = "basic"
        warnings.append("Video resolution is basic. Analysis may be limited.")
    else:
        resolution_quality = "low"
        warnings.append("Video resolution is low. Analysis may be unreliable.")

    # Duration quality
    duration_quality = "short"

    if duration_seconds >= 60:
        duration_quality = "match_sample"
        info.append("Video duration is enough for a match sample.")
    elif duration_seconds >= 15:
        duration_quality = "acceptable_sample"
        info.append("Video duration is acceptable for testing.")
    else:
        duration_quality = "too_short"
        warnings.append("Video is too short for reliable match analysis.")

    # FPS quality
    fps_quality = "low"

    if fps >= 30:
        fps_quality = "good"
        info.append("Video FPS is good.")
    elif fps >= 24:
        fps_quality = "acceptable"
        info.append("Video FPS is acceptable.")
    else:
        fps_quality = "low"
        warnings.append("Video FPS is low. Fast actions may be harder to analyze.")

    # Overall quality
    quality_status = "usable"

    critical_conditions = [
        resolution_quality == "low",
        duration_quality == "too_short",
        fps_quality == "low",
    ]

    if any(critical_conditions):
        quality_status = "limited"

    if not readable:
        quality_status = "unusable"

    return {
        "quality_available": True,
        "quality_status": quality_status,
        "orientation": orientation,
        "resolution_quality": resolution_quality,
        "duration_quality": duration_quality,
        "fps_quality": fps_quality,
        "warnings": warnings,
        "info": info,
    }
