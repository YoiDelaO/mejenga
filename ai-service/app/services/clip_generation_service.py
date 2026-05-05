from pathlib import Path
import cv2


BASE_DIR = Path(__file__).resolve().parents[2]
OUTPUT_VIDEOS_DIR = BASE_DIR / "output_videos"


def ensure_output_folder_exists() -> None:
    OUTPUT_VIDEOS_DIR.mkdir(parents=True, exist_ok=True)


def sanitize_clip_name(value: str) -> str:
    safe_value = value.lower().strip()
    safe_value = safe_value.replace(" ", "_")
    safe_value = safe_value.replace("/", "_")
    safe_value = safe_value.replace("\\", "_")
    safe_value = safe_value.replace(":", "_")
    safe_value = safe_value.replace(".", "_")

    return safe_value


def generate_clip_from_video(
    video_path: Path,
    start_time_seconds: float,
    end_time_seconds: float,
    output_path: Path,
) -> dict:
    video = cv2.VideoCapture(str(video_path))

    if not video.isOpened():
        return {
            "clip_generated": False,
            "generated_clip_path": None,
            "error": "Video could not be opened for clip generation.",
        }

    fps = video.get(cv2.CAP_PROP_FPS)
    width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))

    if fps <= 0:
        video.release()
        return {
            "clip_generated": False,
            "generated_clip_path": None,
            "error": "Invalid FPS for clip generation.",
        }

    start_frame = int(start_time_seconds * fps)
    end_frame = int(end_time_seconds * fps)

    start_frame = max(start_frame, 0)
    end_frame = min(end_frame, total_frames - 1)

    if end_frame <= start_frame:
        video.release()
        return {
            "clip_generated": False,
            "generated_clip_path": None,
            "error": "Invalid clip time range.",
        }

    ensure_output_folder_exists()

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))

    video.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

    current_frame = start_frame
    frames_written = 0

    while current_frame <= end_frame:
        success, frame = video.read()

        if not success:
            break

        writer.write(frame)
        frames_written += 1
        current_frame += 1

    video.release()
    writer.release()

    return {
        "clip_generated": frames_written > 0,
        "generated_clip_path": str(output_path) if frames_written > 0 else None,
        "start_frame": start_frame,
        "end_frame": end_frame,
        "frames_written": frames_written,
    }


def generate_review_clips(
    video_path: Path,
    review_moments: dict | None,
    clip_source: dict | None = None,
) -> dict:
    if not review_moments:
        return {
            "review_clips_available": False,
            "clip_count": 0,
            "clips": [],
            "warnings": ["Review moments are required to generate review clips."],
        }

    if not review_moments.get("review_moments_available", False):
        return {
            "review_clips_available": False,
            "clip_count": 0,
            "clips": [],
            "warnings": ["Review moments are not available."],
        }

    clips = []
    warnings = []

    for moment in review_moments.get("moments", []):
        start_time_seconds = moment.get("start_time_seconds")
        end_time_seconds = moment.get("end_time_seconds")

        if start_time_seconds is None or end_time_seconds is None:
            warnings.append(
                f"Review moment {moment.get('review_moment_id')} does not have a valid time range."
            )
            continue

        review_moment_id = moment.get("review_moment_id", "review_moment")
        main_category = moment.get("main_category", "unknown")
        side = "unknown"

        events = moment.get("events", [])
        if events:
            side = events[0].get("side", "unknown")

        safe_moment_id = sanitize_clip_name(review_moment_id)
        safe_category = sanitize_clip_name(main_category)
        safe_side = sanitize_clip_name(side)

        output_filename = (
            f"{video_path.stem}_{safe_moment_id}_{safe_category}_{safe_side}.mp4"
        )
        output_path = OUTPUT_VIDEOS_DIR / output_filename

        clip_generation_result = generate_clip_from_video(
            video_path=video_path,
            start_time_seconds=start_time_seconds,
            end_time_seconds=end_time_seconds,
            output_path=output_path,
        )

        clips.append(
            {
                "review_moment_id": review_moment_id,
                "main_category": main_category,
                "side": side,
                "primary_timestamp_seconds": moment.get("primary_timestamp_seconds"),
                "start_time_seconds": start_time_seconds,
                "end_time_seconds": end_time_seconds,
                "duration_seconds": moment.get("duration_seconds"),
                "requires_goal_camera_validation": moment.get(
                    "requires_goal_camera_validation",
                    False,
                ),
                "is_confirmed_goal": moment.get("is_confirmed_goal", False),
                "clip_generation": clip_generation_result,
            }
        )

    return {
        "review_clips_available": True,
        "clip_source": clip_source,
        "clip_count": len(clips),
        "clips": clips,
        "warnings": warnings,
    }
