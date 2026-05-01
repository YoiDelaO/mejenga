from pathlib import Path
import cv2
from app.utils.model_loader import get_yolo_model, MODEL_NAME


MODEL_NAME = "yolov8n.pt"
SPORTS_BALL_CLASS_ID = 32
MIN_BALL_CONFIDENCE = 0.25

BASE_DIR = Path(__file__).resolve().parents[2]
OUTPUT_VIDEOS_DIR = BASE_DIR / "output_videos"


def ensure_output_folder_exists() -> None:
    OUTPUT_VIDEOS_DIR.mkdir(parents=True, exist_ok=True)


def detect_ball_in_video(video_path: Path, frame_interval: int = 5) -> dict:
    model = get_yolo_model()
    video = cv2.VideoCapture(str(video_path))

    if not video.isOpened():
        return {
            "ball_detection_available": False,
            "error": "Video could not be opened for ball detection.",
            "frames_analyzed": 0,
            "frames_with_ball": 0,
            "ball_detection_rate": 0,
            "ball_confidence_average": 0,
            "ball_detected": False,
            "ball_warnings": ["Video could not be opened for ball detection."],
            "processed_ball_video_path": None,
        }

    ensure_output_folder_exists()

    fps = video.get(cv2.CAP_PROP_FPS)
    width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))

    output_filename = f"{video_path.stem}_ball.mp4"
    output_path = OUTPUT_VIDEOS_DIR / output_filename

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))

    frame_index = 0
    frames_analyzed = 0
    frames_with_ball = 0
    confidence_values = []

    while True:
        success, frame = video.read()

        if not success:
            break

        if frame_index % frame_interval == 0:
            results = model(frame, verbose=False)
            ball_found_in_frame = False

            for result in results:
                for box in result.boxes:
                    class_id = int(box.cls[0])
                    confidence = float(box.conf[0])

                    if class_id == SPORTS_BALL_CLASS_ID and confidence >= MIN_BALL_CONFIDENCE:
                        ball_found_in_frame = True
                        confidence_values.append(confidence)

                        x1, y1, x2, y2 = box.xyxy[0]
                        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)

                        center_x = int((x1 + x2) / 2)
                        center_y = int((y1 + y2) / 2)

                        cv2.circle(frame, (center_x, center_y), 12, (0, 0, 255), 3)
                        cv2.putText(
                            frame,
                            f"Ball {confidence:.2f}",
                            (x1, max(y1 - 15, 25)),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.6,
                            (0, 0, 255),
                            2,
                        )

            frames_analyzed += 1

            if ball_found_in_frame:
                frames_with_ball += 1

        writer.write(frame)
        frame_index += 1

    video.release()
    writer.release()

    ball_detection_rate = 0
    if frames_analyzed > 0:
        ball_detection_rate = round(frames_with_ball / frames_analyzed, 2)

    ball_confidence_average = 0
    if confidence_values:
        ball_confidence_average = round(sum(confidence_values) / len(confidence_values), 2)

    ball_detected = frames_with_ball > 0

    ball_warnings = []

    if not ball_detected:
        ball_warnings.append("Ball was not detected in the analyzed frames.")

    if ball_detection_rate < 0.10:
        ball_warnings.append("Ball detection rate is very low.")

    if ball_confidence_average > 0 and ball_confidence_average < 0.35:
        ball_warnings.append("Ball detection confidence is low.")

    return {
        "ball_detection_available": True,
        "model": MODEL_NAME,
        "frame_interval": frame_interval,
        "min_ball_confidence": MIN_BALL_CONFIDENCE,
        "frames_analyzed": frames_analyzed,
        "frames_with_ball": frames_with_ball,
        "ball_detection_rate": ball_detection_rate,
        "ball_confidence_average": ball_confidence_average,
        "ball_detected": ball_detected,
        "ball_warnings": ball_warnings,
        "processed_ball_video_path": str(output_path),
    }
