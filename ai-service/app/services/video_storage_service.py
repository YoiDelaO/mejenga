from pathlib import Path


def select_clip_source_video(
    saved_video_path: Path,
    ball_summary: dict | None,
) -> tuple[Path, dict]:
    clip_source_video_path = saved_video_path
    clip_source = {
        "source_type": "original_video",
        "source_path": str(saved_video_path),
        "uses_ball_marker": False,
    }

    if ball_summary and ball_summary.get("processed_ball_video_path"):
        clip_source_video_path = Path(ball_summary.get("processed_ball_video_path"))
        clip_source = {
            "source_type": "processed_ball_video",
            "source_path": ball_summary.get("processed_ball_video_path"),
            "uses_ball_marker": True,
        }

    return clip_source_video_path, clip_source
