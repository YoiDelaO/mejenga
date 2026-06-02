def build_match_review_summary(camera_results: list[dict]) -> dict:
    recommended_playback_urls = []
    cameras_with_review_clips = []
    review_clip_count = 0
    goal_candidate_camera_count = 0
    requires_goal_camera_validation = False

    for camera_result in camera_results:
        camera_id = camera_result.get("camera_id")
        camera_angle = camera_result.get("camera_angle")
        review_summary = camera_result.get("review_summary", {})

        if review_summary.get("clip_count", 0) > 0:
            review_clip_count += review_summary.get("clip_count", 0)

        if review_summary.get("main_reason") == "goal_candidate":
            goal_candidate_camera_count += 1

        if review_summary.get("requires_goal_camera_validation", False):
            requires_goal_camera_validation = True

        recommended_playback_url = review_summary.get("recommended_playback_url")

        if recommended_playback_url:
            recommended_playback_urls.append(
                {
                    "camera_id": camera_id,
                    "camera_angle": camera_angle,
                    "url": recommended_playback_url,
                    "main_reason": review_summary.get("main_reason"),
                    "summary_status": review_summary.get("summary_status"),
                    "frontend_message": review_summary.get("frontend_message"),
                }
            )

            cameras_with_review_clips.append(
                {
                    "camera_id": camera_id,
                    "camera_angle": camera_angle,
                }
            )

    frontend_ready = len(recommended_playback_urls) > 0

    match_review_status = "no_clips"
    frontend_message = "No match review clips available for playback."

    if frontend_ready:
        match_review_status = "ready"
        frontend_message = "Match review clips ready for playback."

    recommended_primary_playback_url = None
    recommended_primary_camera_id = None
    recommended_primary_camera_angle = None

    if recommended_playback_urls:
        primary_playback = recommended_playback_urls[0]
        recommended_primary_playback_url = primary_playback.get("url")
        recommended_primary_camera_id = primary_playback.get("camera_id")
        recommended_primary_camera_angle = primary_playback.get("camera_angle")


    return {
        "match_review_summary_available": True,
        "frontend_ready": frontend_ready,
        "match_review_status": match_review_status,
        "frontend_message": frontend_message,
        "recommended_playback_urls": recommended_playback_urls,
        "recommended_primary_playback_url": recommended_primary_playback_url,
        "recommended_primary_camera_id": recommended_primary_camera_id,
        "recommended_primary_camera_angle": recommended_primary_camera_angle,
        "recommended_playback_url_count": len(recommended_playback_urls),
        "review_clip_count": review_clip_count,
        "cameras_with_review_clips": cameras_with_review_clips,
        "cameras_with_review_clips_count": len(cameras_with_review_clips),
        "goal_candidate_camera_count": goal_candidate_camera_count,
        "requires_goal_camera_validation": requires_goal_camera_validation,
    }
