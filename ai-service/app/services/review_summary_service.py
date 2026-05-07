def build_full_url(base_url: str | None, relative_url: str | None) -> str | None:
    if not base_url or not relative_url:
        return None

    clean_base_url = base_url.rstrip("/")
    clean_relative_url = relative_url

    if not clean_relative_url.startswith("/"):
        clean_relative_url = f"/{clean_relative_url}"

    return f"{clean_base_url}{clean_relative_url}"


def build_review_summary(
    match_event_summary: dict | None,
    review_moments: dict | None,
    review_clips: dict | None,
    base_url: str | None = None,
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
    generated_clip_full_urls = []

    web_clip_paths = []
    web_clip_urls = []
    web_clip_full_urls = []

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

                generated_clip_full_url = build_full_url(
                    base_url=base_url,
                    relative_url=generated_clip_url,
                )

                if generated_clip_full_url:
                    generated_clip_full_urls.append(generated_clip_full_url)

            web_clip = clip_generation.get("web_clip", {})
            web_clip_path = web_clip.get("web_clip_path")
            web_clip_url = web_clip.get("web_clip_url")

            if web_clip_path:
                web_clip_paths.append(web_clip_path)

            if web_clip_url:
                web_clip_urls.append(web_clip_url)

                web_clip_full_url = build_full_url(
                    base_url=base_url,
                    relative_url=web_clip_url,
                )

                if web_clip_full_url:
                    web_clip_full_urls.append(web_clip_full_url)

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

    primary_generated_clip_path = generated_clip_paths[0] if generated_clip_paths else None
    primary_generated_clip_url = generated_clip_urls[0] if generated_clip_urls else None
    primary_generated_clip_full_url = (
        generated_clip_full_urls[0] if generated_clip_full_urls else None
    )

    primary_web_clip_path = web_clip_paths[0] if web_clip_paths else None
    primary_web_clip_url = web_clip_urls[0] if web_clip_urls else None
    primary_web_clip_full_url = web_clip_full_urls[0] if web_clip_full_urls else None

    primary_review_clip_available = primary_web_clip_full_url is not None
    recommended_playback_url = primary_web_clip_full_url
    frontend_ready = recommended_playback_url is not None

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
        "primary_review_clip_available": primary_review_clip_available,
        "frontend_ready": frontend_ready,
        "recommended_playback_url": recommended_playback_url,
        "primary_generated_clip_path": primary_generated_clip_path,
        "primary_generated_clip_url": primary_generated_clip_url,
        "primary_generated_clip_full_url": primary_generated_clip_full_url,
        "primary_web_clip_path": primary_web_clip_path,
        "primary_web_clip_url": primary_web_clip_url,
        "primary_web_clip_full_url": primary_web_clip_full_url,
        "generated_clip_paths": generated_clip_paths,
        "generated_clip_urls": generated_clip_urls,
        "generated_clip_full_urls": generated_clip_full_urls,
        "web_clip_paths": web_clip_paths,
        "web_clip_urls": web_clip_urls,
        "web_clip_full_urls": web_clip_full_urls,
    }
