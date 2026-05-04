from pathlib import Path
import cv2
from ultralytics import YOLO

from app.services.field_zone_service import get_field_zones
from app.services.goal_area_activity_service import (
    is_point_inside_zone,
    summarize_goal_area_activity,
)


MODEL_NAME = "yolov8n.pt"
PERSON_CLASS_ID = 0
MIN_CONFIDENCE = 0.45

BASE_DIR = Path(__file__).resolve().parents[2]
OUTPUT_VIDEOS_DIR = BASE_DIR / "output_videos"


def ensure_output_folder_exists() -> None:
    OUTPUT_VIDEOS_DIR.mkdir(parents=True, exist_ok=True)


def get_timestamp_seconds(frame_index: int, fps: float) -> float:
    if fps <= 0:
        return 0

    return round(frame_index / fps, 2)


def detect_players_in_video(video_path: Path, frame_interval: int = 30) -> dict:
    model = YOLO(MODEL_NAME)
    video = cv2.VideoCapture(str(video_path))

    if not video.isOpened():
        return {
            "detection_available": False,
            "error": "Video could not be opened for detection.",
            "frames_analyzed": 0,
            "average_players_detected": 0,
            "max_players_detected": 0,
            "detection_confidence_average": 0,
            "processed_video_path": None,
        }

    ensure_output_folder_exists()

    fps = video.get(cv2.CAP_PROP_FPS)
    width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))

    field_zones = get_field_zones({"width": width, "height": height})
    zones = field_zones.get("zones", {})

    left_goal_area = zones.get("left_goal_area")
    right_goal_area = zones.get("right_goal_area")

    goal_area_activity = {
        "left_goal_area_detections": 0,
        "right_goal_area_detections": 0,
        "left_goal_area_timestamps": [],
        "right_goal_area_timestamps": [],
    }

    output_filename = f"{video_path.stem}_detected.mp4"
    output_path = OUTPUT_VIDEOS_DIR / output_filename

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))

    frame_index = 0
    frames_analyzed = 0
    total_players_detected = 0
    max_players_detected = 0
    confidence_values = []

    while True:
        success, frame = video.read()

        if not success:
            break

        if frame_index % frame_interval == 0:
            results = model(frame, verbose=False)
            players_in_frame = 0
            timestamp_seconds = get_timestamp_seconds(frame_index, fps)

            for result in results:
                for box in result.boxes:
                    class_id = int(box.cls[0])
                    confidence = float(box.conf[0])

                    if class_id == PERSON_CLASS_ID and confidence >= MIN_CONFIDENCE:
                        players_in_frame += 1
                        confidence_values.append(confidence)

                        x1, y1, x2, y2 = box.xyxy[0]
                        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)

                        center_x = int((x1 + x2) / 2)
                        center_y = int((y1 + y2) / 2)

                        if left_goal_area and is_point_inside_zone(center_x, center_y, left_goal_area):
                            goal_area_activity["left_goal_area_detections"] += 1
                            goal_area_activity["left_goal_area_timestamps"].append(
                                {
                                    "frame_index": frame_index,
                                    "timestamp_seconds": timestamp_seconds,
                                    "center_x": center_x,
                                    "center_y": center_y,
                                    "confidence": round(confidence, 2),
                                }
                            )

                        if right_goal_area and is_point_inside_zone(center_x, center_y, right_goal_area):
                            goal_area_activity["right_goal_area_detections"] += 1
                            goal_area_activity["right_goal_area_timestamps"].append(
                                {
                                    "frame_index": frame_index,
                                    "timestamp_seconds": timestamp_seconds,
                                    "center_x": center_x,
                                    "center_y": center_y,
                                    "confidence": round(confidence, 2),
                                }
                            )

                        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                        cv2.putText(
                            frame,
                            f"Player {confidence:.2f}",
                            (x1, max(y1 - 15, 25)),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.6,
                            (0, 255, 0),
                            2,
                        )

            frames_analyzed += 1
            total_players_detected += players_in_frame
            max_players_detected = max(max_players_detected, players_in_frame)

        writer.write(frame)
        frame_index += 1

    video.release()
    writer.release()

    average_players_detected = 0
    if frames_analyzed > 0:
        average_players_detected = round(total_players_detected / frames_analyzed, 2)

    detection_confidence_average = 0
    if confidence_values:
        detection_confidence_average = round(sum(confidence_values) / len(confidence_values), 2)

    warnings = []

    if frames_analyzed == 0:
        warnings.append("No frames were analyzed.")

    if average_players_detected < 2:
        warnings.append("Low number of players detected.")

    if detection_confidence_average < 0.40:
        warnings.append("Low detection confidence.")

    if max_players_detected < 5:
        warnings.append("Video may not show enough players for a ranked match.")

    analysis_quality = "poor"

    if average_players_detected >= 4 and detection_confidence_average >= 0.50:
        analysis_quality = "useful"
    elif average_players_detected >= 2 and detection_confidence_average >= 0.40:
        analysis_quality = "limited"

    needs_admin_review = analysis_quality != "useful" or len(warnings) > 0
    goal_area_activity_summary = summarize_goal_area_activity(goal_area_activity)

    return {
        "detection_available": True,
        "model": MODEL_NAME,
        "frame_interval": frame_interval,
        "min_confidence": MIN_CONFIDENCE,
        "frames_analyzed": frames_analyzed,
        "average_players_detected": average_players_detected,
        "max_players_detected": max_players_detected,
        "detection_confidence_average": detection_confidence_average,
        "analysis_quality": analysis_quality,
        "warnings": warnings,
        "needs_admin_review": needs_admin_review,
        "processed_video_path": str(output_path),
        "goal_area_activity": goal_area_activity_summary,
    }
