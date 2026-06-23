# ----- crud endpoints for violations @ api/routes/violations.py -----

import base64
import io
import json
import time
import uuid
from pathlib import Path
from typing import List

import cv2
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse

from api.schemas import (
    PaginatedViolations,
    ProcessRequest,
    ProcessResponse,
    YouTubeFrameRequest,
    YouTubeFrameResponse,
    YouTubeCaptureRequest,
    YouTubeCaptureResult,
)
from src.pipeline import process_image as run_pipeline
from src.youtube_extractor import YouTubeFrameExtractor
from utils.logger import logger

router = APIRouter()
DATA_FILE = Path("outputs/violations.jsonl")


def _load_all_records() -> list[dict]:
    """Loads all violation records from the JSONL file."""
    if not DATA_FILE.exists():
        return []
    records = []
    with open(DATA_FILE) as f:
        for line in f:
            if line.strip():
                records.append(json.loads(line))
    return records


@router.get("", response_model=PaginatedViolations)
def get_violations(page: int = 1, page_size: int = 10):
    """Returns a paginated list of all processed traffic violations."""
    items = _load_all_records()

    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size

    return PaginatedViolations(items=items[start_idx:end_idx], total=len(items), page=page)


@router.get("/{violation_id}")
def get_violation(violation_id: str):
    """Returns a single violation record by its violation_id (UUID)."""
    items = _load_all_records()
    for item in items:
        if item.get("violation_id") == violation_id:
            return item
    raise HTTPException(status_code=404, detail="Violation not found")


@router.post("/process", response_model=ProcessResponse)
def process_image(request: ProcessRequest):
    """Accepts an image path, runs the full detection pipeline, and returns violation records."""
    from src.pipeline import process_image as run_pipeline

    result = run_pipeline(request.image_path)
    if not result:
        raise HTTPException(
            status_code=400,
            detail="Failed to process image. Ensure the file exists and is a valid image.",
        )

    _, buffer = cv2.imencode(".jpg", result["annotated_image"])
    annotated_b64 = base64.b64encode(buffer).decode("utf-8")

    return JSONResponse(
        content={
            "records": result["records"],
            "annotated_image_b64": annotated_b64,
            "preprocess_steps": result["preprocess_steps"],
        }
    )


@router.post("/youtube/upload", response_model=YouTubeFrameResponse)
async def process_youtube_frame(request: YouTubeFrameRequest):
    """Extract frame from YouTube video and run pipeline."""
    start_time = time.time()

    try:
        async with YouTubeFrameExtractor() as extractor:
            frame_result = await extractor.extract_single_frame(request)

            upload_dir = Path("public/outputs/uploads")
            upload_dir.mkdir(parents=True, exist_ok=True)

            frame_filename = Path(frame_result.frame_path).name
            target_path = upload_dir / frame_filename
            import shutil

            shutil.copy2(frame_result.frame_path, str(target_path))

            pipeline_result = run_pipeline(str(target_path))
            if not pipeline_result:
                raise HTTPException(
                    status_code=400,
                    detail="Failed to process extracted frame.",
                )

            _, buffer = cv2.imencode(".jpg", pipeline_result["annotated_image"])
            annotated_b64 = base64.b64encode(buffer).decode("utf-8")

            await extractor.cleanup(frame_result.frame_path)

            processing_time = time.time() - start_time

            return YouTubeFrameResponse(
                records=pipeline_result["records"],
                preprocess_steps=pipeline_result["preprocess_steps"],
                frame_result=frame_result,
                annotated_image_b64=annotated_b64,
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        err_str = str(e)
        if "Sign in" in err_str or "bot" in err_str.lower():
            raise HTTPException(
                status_code=401,
                detail=(
                    "YouTube requires authentication. "
                    "Set YOUTUBE_COOKIES_BROWSER=chrome (or firefox/brave) in .env "
                    "or YOUTUBE_COOKIES_FILE=/path/to/cookies.txt. "
                    "See https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp"
                ),
            )
        raise HTTPException(status_code=502, detail=f"YouTube extraction failed: {err_str[:200]}")


@router.post("/youtube/capture", response_model=YouTubeCaptureResult)
async def capture_youtube_frames(request: YouTubeCaptureRequest):
    """Batch capture frames from YouTube video."""
    start_time = time.time()

    try:
        async with YouTubeFrameExtractor() as extractor:
            frame_results = await extractor.extract_frames_batch(
                request.youtube_url,
                request.interval,
                request.start_time,
                request.end_time,
            )

            processed_frames = []
            for frame_result in frame_results:
                temp_path = frame_result.frame_path
                try:
                    pipeline_result = run_pipeline(temp_path)
                    if pipeline_result:
                        upload_dir = Path("public/outputs/uploads")
                        upload_dir.mkdir(parents=True, exist_ok=True)

                        frame_filename = Path(temp_path).name
                        target_path = upload_dir / f"processed_{frame_filename}"
                        import shutil

                        shutil.copy2(temp_path, str(target_path))

                        processed_frame_result = YouTubeFrameResult(
                            frame_path=str(target_path),
                            timestamp=frame_result.timestamp,
                            duration=frame_result.duration,
                            file_size=frame_result.file_size,
                            extraction_method=frame_result.extraction_method,
                            video_id=frame_result.video_id,
                            resolution=frame_result.resolution,
                            format=frame_result.format,
                        )
                        processed_frames.append(processed_frame_result)

                    await extractor.cleanup(temp_path)
                except Exception as e:
                    logger.error(f"Failed to process frame {temp_path}: {e}")
                    continue

            processing_time = time.time() - start_time

            return YouTubeCaptureResult(
                frames=processed_frames,
                total_frames=len(processed_frames),
                processing_time=processing_time,
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        err_str = str(e)
        if "Sign in" in err_str or "bot" in err_str.lower():
            raise HTTPException(
                status_code=401,
                detail=(
                    "YouTube requires authentication. "
                    "Set YOUTUBE_COOKIES_BROWSER=chrome (or firefox/brave) in .env "
                    "or YOUTUBE_COOKIES_FILE=/path/to/cookies.txt. "
                    "See https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp"
                ),
            )
        raise HTTPException(status_code=502, detail=f"YouTube extraction failed: {err_str[:200]}")


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Accepts an uploaded image, runs the detection pipeline, and returns results with annotated image."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    file_id = str(uuid.uuid4())
    upload_dir = Path("public/outputs/uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)

    input_path = upload_dir / f"{file_id}.jpg"
    contents = await file.read()
    with open(input_path, "wb") as f:
        f.write(contents)

    from src.pipeline import process_image as run_pipeline

    result = run_pipeline(str(input_path))
    if not result:
        raise HTTPException(
            status_code=400,
            detail="Failed to process image. Ensure the file is a valid traffic image.",
        )

    annotated_path = upload_dir / f"{file_id}_annotated.jpg"
    cv2.imwrite(str(annotated_path), result["annotated_image"])

    with open(annotated_path, "rb") as f:
        annotated_b64 = base64.b64encode(f.read()).decode("utf-8")

    return JSONResponse(
        content={
            "records": result["records"],
            "annotated_image_b64": annotated_b64,
            "preprocess_steps": result["preprocess_steps"],
        }
    )
