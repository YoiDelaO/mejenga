from pathlib import Path
import cv2


def get_video_info(video_path: Path) -> dict:
    video = cv2.VideoCapture(str(video_path))

    if not video.isOpened():
        return {
            "readable": False,
            "fps": 0,
            "total_frames": 0,
            "duration_seconds": 0,
            "width": 0,
            "height": 0,
        }

    fps = video.get(cv2.CAP_PROP_FPS)
    total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))

    duration_seconds = 0
    if fps > 0:
        duration_seconds = round(total_frames / fps, 2)

    video.release()

    return {
        "readable": True,
        "fps": round(fps, 2),
        "total_frames": total_frames,
        "duration_seconds": duration_seconds,
        "width": width,
        "height": height,
    }
