ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
ALLOWED_VIDEO_CONTENT_TYPES = {
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
    "video/webm",
}


def validate_video_file(filename: str, content_type: str | None) -> dict:
    extension = ""

    if "." in filename:
        extension = "." + filename.split(".")[-1].lower()

    valid_extension = extension in ALLOWED_VIDEO_EXTENSIONS
    valid_content_type = content_type in ALLOWED_VIDEO_CONTENT_TYPES

    is_valid_video = valid_extension or valid_content_type

    warnings = []

    if not valid_extension:
        warnings.append(f"File extension '{extension}' is not in the allowed video extensions.")

    if content_type and not valid_content_type:
        warnings.append(f"Content type '{content_type}' is not recognized as an allowed video type.")

    if content_type is None:
        warnings.append("Content type was not provided.")

    return {
        "is_valid_video": is_valid_video,
        "filename": filename,
        "content_type": content_type,
        "extension": extension,
        "valid_extension": valid_extension,
        "valid_content_type": valid_content_type,
        "allowed_extensions": sorted(list(ALLOWED_VIDEO_EXTENSIONS)),
        "allowed_content_types": sorted(list(ALLOWED_VIDEO_CONTENT_TYPES)),
        "warnings": warnings,
    }
