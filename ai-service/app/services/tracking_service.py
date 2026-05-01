from pathlib import Path
import cv2
from ultralytics import YOLO


MODEL_NAME = "yolov8n.pt"
PERSON_CLASS_ID = 0
MIN_CONFIDENCE = 0.45

BASE_DIR = Path(__file__).resolve().parents[2]
OUTPUT_VIDEOS_DIR = BASE_DIR / "output_videos"


def ensure_output_folder_exists() -> None:
    OUTPUT_VIDEOS_DIR.mkdir(parents=True, exist_ok=True)


def track_players_in_video(video_path: Path, frame_interval: int = 5) -> dict:
    model = YOLO(MODEL_NAME)
    video = cv2.VideoCapture(str(video_path))

    if not video.isOpened():
        return {
            "tracking_available": False,
            "error": "Video could not be opened for tracking.",
            "frames_tracked": 0,
            "unique_track_ids": 0,
            "max_simultaneous_tracks": 0,
            "average_tracks_per_frame": 0,
            "processed_tracking_video_path": None,
        }

    ensure_output_folder_exists()

    fps = video.get(cv2.CAP_PROP_FPS)
    width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))

    output_filename = f"{video_path.stem}_tracked.mp4"
    output_path = OUTPUT_VIDEOS_DIR / output_filename

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))

    frame_index = 0
    frames_tracked = 0
    total_tracks_detected = 0
    max_simultaneous_tracks = 0
    track_ids_seen = set()

    while True:
        success, frame = video.read()

        if not success:
            break

        if frame_index % frame_interval == 0:
            results = model.track(frame, persist=True, verbose=False)

            tracks_in_frame = 0

            for result in results:
                if result.boxes is None:
                    continue

                for box in result.boxes:
                    class_id = int(box.cls[0])
                    confidence = float(box.conf[0])

                    if class_id == PERSON_CLASS_ID and confidence >= MIN_CONFIDENCE:
                        track_id = None

                        if box.id is not None:
                            track_id = int(box.id[0])
                            track_ids_seen.add(track_id)

                        tracks_in_frame += 1

                        x1, y1, x2, y2 = box.xyxy[0]
                        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)

                        label = f"Player"
                        if track_id is not None:
                            label = f"Player ID {track_id}"

                        cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
                        cv2.putText(
                            frame,
                            label,
                            (x1, max(y1 - 15, 25)),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.6,
                            (255, 0, 0),
                            2,
                        )

            frames_tracked += 1
            total_tracks_detected += tracks_in_frame
            max_simultaneous_tracks = max(max_simultaneous_tracks, tracks_in_frame)

        writer.write(frame)
        frame_index += 1

    video.release()
    writer.release()

    average_tracks_per_frame = 0
    if frames_tracked > 0:
        average_tracks_per_frame = round(total_tracks_detected / frames_tracked, 2)

    return {
        "tracking_available": True,
        "model": MODEL_NAME,
        "frame_interval": frame_interval,
        "min_confidence": MIN_CONFIDENCE,
        "frames_tracked": frames_tracked,
        "unique_track_ids": len(track_ids_seen),
        "max_simultaneous_tracks": max_simultaneous_tracks,
        "average_tracks_per_frame": average_tracks_per_frame,
        "processed_tracking_video_path": str(output_path),
    }
