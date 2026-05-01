from ultralytics import YOLO


MODEL_NAME = "yolov8n.pt"

_model_instance = None


def get_yolo_model():
    global _model_instance

    if _model_instance is None:
        _model_instance = YOLO(MODEL_NAME)

    return _model_instance
