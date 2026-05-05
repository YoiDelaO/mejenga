def build_review_summary(
    match_event_summary: dict | None,
    review_moments: dict | None,
    review_clips: dict | None,
) -> dict:
    summary_status = "normal"
    requires_goal_camera_validation = False
    confirmed_goals = 0
    has_goal_candidate = False
    has_possible_shot = False
    has_danger_play = False

    if match_event_summary:
        summary_status = match_event_summary.get("summary_status", "normal")
        requires_goal_camera_validation = match_event_summary.get(
            "requires_goal_camera_validation",
            False,
        )
        confirmed_goals = match_event_summary.get("confirmed_goals", 0)
        has_goal_candidate = match_event_summary.get("has_goal_candidate", False)
        has_possible_shot = match_event_summary.get("has_possible_shot", False)
        has_danger_play = match_event_summary.get("has_danger_play", False)

    review_moment_count = 0

    if review_moments:
        review_moment_count = review_moments.get("moment_count", 0)

    clip_count = 0
    has_overlay_clip = False
    uses_ball_marker = False

    generated_clip_paths = []
    generated_clip_urls = []
    web_clip_paths = []
    web_clip_urls = []

    if review_clips:
        clip_count = review_clips.get("clip_count", 0)

        clip_source = review_clips.get("clip_source", {})
        uses_ball_marker = clip_source.get("uses_ball_marker", False)

        for clip in review_clips.get("clips", []):
            clip_generation = clip.get("clip_generation", {})

            if clip_generation.get("overlay_applied", False):
                has_overlay_clip = True

            generated_clip_path = clip_generation.get("generated_clip_path")
            if generated_clip_path:
                generated_clip_paths.append(generated_clip_path)

            generated_clip_url = clip_generation.get("generated_clip_url")
            if generated_clip_url:
                generated_clip_urls.append(generated_clip_url)

            web_clip = clip_generation.get("web_clip", {})
            web_clip_path = web_clip.get("web_clip_path")
            web_clip_url = web_clip.get("web_clip_url")

            if web_clip_path:
                web_clip_paths.append(web_clip_path)

            if web_clip_url:
                web_clip_urls.append(web_clip_url)

    review_required = (
        has_goal_candidate
        or has_possible_shot
        or has_danger_play
        or review_moment_count > 0
        or clip_count > 0
    )

    main_reason = "normal"

    if has_goal_candidate:
        main_reason = "goal_candidate"

    elif has_possible_shot:
        main_reason = "possible_shot"

    elif has_danger_play:
        main_reason = "danger_play"

    elif review_moment_count > 0:
        main_reason = "review_moment"

    return {
        "review_summary_available": True,
        "review_required": review_required,
        "main_reason": main_reason,
        "summary_status": summary_status,
        "review_moment_count": review_moment_count,
        "clip_count": clip_count,
        "has_overlay_clip": has_overlay_clip,
        "uses_ball_marker": uses_ball_marker,
        "requires_goal_camera_validation": requires_goal_camera_validation,
        "confirmed_goals": confirmed_goals,
        "generated_clip_paths": generated_clip_paths,
        "generated_clip_urls": generated_clip_urls,
        "web_clip_paths": web_clip_paths,
        "web_clip_urls": web_clip_urls,
    }
