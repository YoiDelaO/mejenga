from pathlib import Path
import cv2
import subprocess
import imageio_ffmpeg


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


def format_label_value(value: str | None) -> str:
    if not value:
        return "Unknown"

    return value.replace("_", " ").title()


def draw_review_overlay(frame, moment: dict | None) -> None:
    if not moment:
        return

    main_category = format_label_value(moment.get("main_category"))
    primary_timestamp = moment.get("primary_timestamp_seconds")
    requires_goal_camera_validation = moment.get("requires_goal_camera_validation", False)
    is_confirmed_goal = moment.get("is_confirmed_goal", False)

    side = "unknown"
    events = moment.get("events", [])

    if events:
        side = events[0].get("side", "unknown")

    side_label = format_label_value(side)

    timestamp_label = "Time: unknown"
    if primary_timestamp is not None:
        timestamp_label = f"Time: {primary_timestamp:.2f}s"

    validation_label = "Needs goal camera review"
    if not requires_goal_camera_validation:
        validation_label = "No goal camera review needed"

    goal_status_label = "Confirmed goal"
    if not is_confirmed_goal:
        goal_status_label = "Not confirmed"

    overlay_lines = [
        "REVIEW",
        f"{main_category} | {side_label}",
        timestamp_label,
        validation_label,
        goal_status_label,
    ]

    frame_height, frame_width = frame.shape[:2]

    x = 16
    y = 26
    line_height = 22
    padding_x = 12
    padding_y = 12

    font_scale_title = 0.65
    font_scale_text = 0.52
    title_thickness = 2
    text_thickness = 1

    box_width = min(330, frame_width - 30)
    box_height = padding_y * 2 + (len(overlay_lines) * line_height)

    overlay = frame.copy()

    cv2.rectangle(
        overlay,
        (x, y - 18),
        (x + box_width, y - 18 + box_height),
        (0, 0, 0),
        -1,
    )

    alpha = 0.65
    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)

    for index, line in enumerate(overlay_lines):
        line_y = y + (index * line_height)

        font_scale = font_scale_text
        thickness = text_thickness

        if index == 0:
            font_scale = font_scale_title
            thickness = title_thickness

        cv2.putText(
            frame,
            line,
            (x + padding_x, line_y),
            cv2.FONT_HERSHEY_SIMPLEX,
            font_scale,
            (255, 255, 255),
            thickness,
            cv2.LINE_AA,
        )
        
def convert_clip_to_web_mp4(input_path: Path, output_path: Path) -> dict:
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

    command = [
        ffmpeg_exe,
        "-y",
        "-i",
        str(input_path),
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        "-an",
        str(output_path),
    ]

    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=False,
        )

        if result.returncode != 0:
            return {
                "web_clip_generated": False,
                "web_clip_path": None,
                "web_clip_url": None,
                "error": result.stderr,
            }

        return {
            "web_clip_generated": True,
            "web_clip_path": str(output_path),
            "web_clip_url": f"/output-videos/{output_path.name}",
            "codec": "h264",
            "pixel_format": "yuv420p",
        }

    except Exception as error:
        return {
            "web_clip_generated": False,
            "web_clip_path": None,
            "web_clip_url": None,
            "error": str(error),
        }

def generate_clip_from_video(
    video_path: Path,
    start_time_seconds: float,
    end_time_seconds: float,
    output_path: Path,
    review_moment: dict | None = None,
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

        draw_review_overlay(frame, review_moment)

        writer.write(frame)
        frames_written += 1
        current_frame += 1

    video.release()
    writer.release()

    overlay_applied = review_moment is not None

    overlay_metadata = None

    if overlay_applied:
        overlay_metadata = {
            "style": "compact",
            "background": "semi_transparent",
            "position": "top_left",
            "text_color": "white",
            "includes": [
                "main_category",
                "side",
                "timestamp",
                "goal_camera_validation",
                "goal_status",
            ],
        }

    clip_generated = frames_written > 0
    generated_clip_path = str(output_path) if clip_generated else None
    generated_clip_url = None
    web_clip = None

    if clip_generated:
        generated_clip_url = f"/output-videos/{output_path.name}"

        web_output_path = output_path.with_name(
            f"{output_path.stem}_web.mp4"
        )

        web_clip = convert_clip_to_web_mp4(
            input_path=output_path,
            output_path=web_output_path,
        )

    return {
        "clip_generated": clip_generated,
        "generated_clip_path": generated_clip_path,
        "generated_clip_url": generated_clip_url,
        "web_clip": web_clip,
        "start_frame": start_frame,
        "end_frame": end_frame,
        "frames_written": frames_written,
        "overlay_applied": overlay_applied,
        "overlay_type": "basic_review_moment" if overlay_applied else None,
        "overlay_metadata": overlay_metadata,
    }


def generate_review_clips(
    video_path: Path,
    review_moments: dict | None,
    clip_source: dict | None = None,
) -> dict:
    if not review_moments:
        return {
            "review_clips_available": False,
            "clip_source": clip_source,
            "clip_count": 0,
            "clips": [],
            "warnings": ["Review moments are required to generate review clips."],
        }

    if not review_moments.get("review_moments_available", False):
        return {
            "review_clips_available": False,
            "clip_source": clip_source,
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
            f"{video_path.stem}_{safe_moment_id}_{safe_category}_{safe_side}_overlay.mp4"
        )
        output_path = OUTPUT_VIDEOS_DIR / output_filename

        clip_generation_result = generate_clip_from_video(
            video_path=video_path,
            start_time_seconds=start_time_seconds,
            end_time_seconds=end_time_seconds,
            output_path=output_path,
            review_moment=moment,
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
