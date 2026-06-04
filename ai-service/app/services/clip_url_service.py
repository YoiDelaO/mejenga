def build_full_url(base_url: str, relative_url: str | None) -> str | None:
    if not relative_url:
        return None

    clean_base_url = base_url.rstrip("/")
    clean_relative_url = relative_url

    if not clean_relative_url.startswith("/"):
        clean_relative_url = f"/{clean_relative_url}"

    return f"{clean_base_url}{clean_relative_url}"


def enrich_review_clips_with_full_urls(
    review_clips: dict | None,
    base_url: str,
) -> dict | None:
    if not review_clips:
        return review_clips

    for clip in review_clips.get("clips", []):
        clip_generation = clip.get("clip_generation", {})

        generated_clip_url = clip_generation.get("generated_clip_url")
        clip_generation["generated_clip_full_url"] = build_full_url(
            base_url=base_url,
            relative_url=generated_clip_url,
        )

        web_clip = clip_generation.get("web_clip")

        if web_clip:
            web_clip_url = web_clip.get("web_clip_url")
            web_clip["web_clip_full_url"] = build_full_url(
                base_url=base_url,
                relative_url=web_clip_url,
            )

    return review_clips
