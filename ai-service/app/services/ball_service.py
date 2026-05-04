from pathlib import Path
import cv2

from app.utils.model_loader import get_yolo_model, MODEL_NAME
from app.services.field_zone_service import get_field_zones
from app.services.goal_area_activity_service import is_point_inside_zone


SPORTS_BALL_CLASS_ID = 32
MIN_BALL_CONFIDENCE = 0.25
BALL_MARKER_PERSISTENCE_FRAMES = 12

BASE_DIR = Path(__file__).resolve().parents[2]
OUTPUT_VIDEOS_DIR = BASE_DIR / "output_videos"


def ensure_output_folder_exists() -> None:
    OUTPUT_VIDEOS_DIR.mkdir(parents=True, exist_ok=True)


def draw_ball_marker(frame, center_x: int, center_y: int, confidence: float | None = None) -> None:
    # Círculo grande exterior
    cv2.circle(frame, (center_x, center_y), 28, (0, 0, 255), 4)

    # Círculo interno
    cv2.circle(frame, (center_x, center_y), 8, (0, 0, 255), -1)

    # Cruz para ubicar mejor la bola
    cv2.line(frame, (center_x - 35, center_y), (center_x + 35, center_y), (0, 0, 255), 3)
    cv2.line(frame, (center_x, center_y - 35), (center_x, center_y + 35), (0, 0, 255), 3)

    label = "BALL"
    if confidence is not None:
        label = f"BALL {confidence:.2f}"

    text_x = max(center_x - 50, 10)
    text_y = max(center_y - 45, 30)

    # Fondo oscuro para que el texto se vea mejor
    cv2.rectangle(frame, (text_x - 5, text_y - 25), (text_x + 120, text_y + 8), (0, 0, 0), -1)

    cv2.putText(
        frame,
        label,
        (text_x, text_y),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.75,
        (0, 0, 255),
        3,
    )


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
            "ball_goal_area_activity": None,
            "ball_warnings": ["Video could not be opened for ball detection."],
            "processed_ball_video_path": None,
        }

    ensure_output_folder_exists()

    fps = video.get(cv2.CAP_PROP_FPS)
    width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))

    field_zones = get_field_zones({"width": width, "height": height})
    zones = field_zones.get("zones", {})

    left_goal_area = zones.get("left_goal_area")
    right_goal_area = zones.get("right_goal_area")

    ball_goal_area_activity = {
        "left_goal_area_ball_detections": 0,
        "right_goal_area_ball_detections": 0,
    }

    output_filename = f"{video_path.stem}_ball.mp4"
    output_path = OUTPUT_VIDEOS_DIR / output_filename

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))

    frame_index = 0
    frames_analyzed = 0
    frames_with_ball = 0
    confidence_values = []

    last_ball_position = None
    last_ball_confidence = None
    persistence_counter = 0

    while True:
        success, frame = video.read()

        if not success:
            break

        if frame_index % frame_interval == 0:
            results = model(frame, verbose=False)
            ball_found_in_frame = False
            best_ball = None

            for result in results:
                for box in result.boxes:
                    class_id = int(box.cls[0])
                    confidence = float(box.conf[0])

                    if class_id == SPORTS_BALL_CLASS_ID and confidence >= MIN_BALL_CONFIDENCE:
                        x1, y1, x2, y2 = box.xyxy[0]
                        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)

                        center_x = int((x1 + x2) / 2)
                        center_y = int((y1 + y2) / 2)

                        if best_ball is None or confidence > best_ball["confidence"]:
                            best_ball = {
                                "center_x": center_x,
                                "center_y": center_y,
                                "confidence": confidence,
                            }

            if best_ball:
                ball_found_in_frame = True
                confidence_values.append(best_ball["confidence"])

                center_x = best_ball["center_x"]
                center_y = best_ball["center_y"]
                confidence = best_ball["confidence"]

                last_ball_position = (center_x, center_y)
                last_ball_confidence = confidence
                persistence_counter = BALL_MARKER_PERSISTENCE_FRAMES

                if left_goal_area and is_point_inside_zone(center_x, center_y, left_goal_area):
                    ball_goal_area_activity["left_goal_area_ball_detections"] += 1

                if right_goal_area and is_point_inside_zone(center_x, center_y, right_goal_area):
                    ball_goal_area_activity["right_goal_area_ball_detections"] += 1

            frames_analyzed += 1

            if ball_found_in_frame:
                frames_with_ball += 1

        # Mantener la marca visible por varios frames después de detectar la bola
        if last_ball_position and persistence_counter > 0:
            center_x, center_y = last_ball_position
            draw_ball_marker(frame, center_x, center_y, last_ball_confidence)
            persistence_counter -= 1

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

    left_ball_count = ball_goal_area_activity["left_goal_area_ball_detections"]
    right_ball_count = ball_goal_area_activity["right_goal_area_ball_detections"]
    total_goal_area_ball_detections = left_ball_count + right_ball_count

    ball_goal_area_summary = {
        "ball_near_goal_area_detected": total_goal_area_ball_detections > 0,
        "total_goal_area_ball_detections": total_goal_area_ball_detections,
        "left_goal_area_ball_detections": left_ball_count,
        "right_goal_area_ball_detections": right_ball_count,
    }

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
        "marker_persistence_frames": BALL_MARKER_PERSISTENCE_FRAMES,
        "frames_analyzed": frames_analyzed,
        "frames_with_ball": frames_with_ball,
        "ball_detection_rate": ball_detection_rate,
        "ball_confidence_average": ball_confidence_average,
        "ball_detected": ball_detected,
        "ball_goal_area_activity": ball_goal_area_summary,
        "ball_warnings": ball_warnings,
        "processed_ball_video_path": str(output_path),
    }
