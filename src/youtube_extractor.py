# ----- YouTube frame extraction service @ src/youtube_extractor.py -----

import asyncio
import json
import os
import subprocess
import tempfile
from pathlib import Path
from typing import List, Dict, Any, Optional

import yt_dlp
from pydantic import BaseModel, Field, validator

from utils.logger import logger


class YouTubeFrameRequest(BaseModel):
    """Request model for extracting a single frame from YouTube."""

    youtube_url: str = Field(..., description="YouTube video URL")
    timestamp: float = Field(default=0.0, description="Timestamp in seconds for frame extraction")
    quality: str = Field(default="high", description="Video quality: low, medium, high")
    start_time: Optional[float] = Field(None, description="Start time for extraction")
    end_time: Optional[float] = Field(None, description="End time for extraction")

    @validator("youtube_url")
    def validate_youtube_url(cls, v):
        if not ("youtube.com" in v or "youtu.be" in v):
            raise ValueError("URL must be a valid YouTube URL")
        return v


class YouTubeFrameResult(BaseModel):
    """Result model for YouTube frame extraction."""

    frame_path: str = Field(..., description="Path to extracted frame image")
    timestamp: float = Field(..., description="Timestamp of extracted frame")
    duration: float = Field(..., description="Duration of video segment")
    file_size: int = Field(..., description="Size of extracted frame in bytes")
    extraction_method: str = Field(..., description="Method used for extraction")
    video_id: str = Field(..., description="YouTube video ID")
    resolution: str = Field(..., description="Video resolution")
    format: str = Field(..., description="Video format")


class YouTubeExtractionConfig:
    """Configuration for YouTube frame extraction."""

    def __init__(self):
        self.output_dir = Path("public/outputs/youtube_frames")
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.supported_formats = ["mp4", "webm"]
        self.quality_settings = {
            "low": "360p",
            "medium": "720p",
            "high": "1080p",
        }

        self.max_video_duration = 3600
        self.frame_rate = 1.0
        self.max_retries = 3
        self.retry_delay = 2.0

        from utils.config import config

        self._cookies_from_browser = config.get_yaml("youtube.cookies_from_browser", "") or ""
        self._cookies_file = config.get_yaml("youtube.cookies_file", "") or ""

    def _add_cookies(self, opts: dict) -> dict:
        """Inject cookie authentication options into yt-dlp opts."""
        if self._cookies_file:
            opts["cookiefile"] = self._cookies_file
        elif self._cookies_from_browser:
            opts["cookiesfrombrowser"] = (self._cookies_from_browser,)
        return opts

    async def extract_single_frame(self, request: YouTubeFrameRequest) -> YouTubeFrameResult:
        """Extract a single frame from YouTube video at given timestamp."""

        logger.info(
            f"Extracting frame from {request.youtube_url} at timestamp {request.timestamp}s"
        )

        try:
            # Get video information
            video_info = await self._get_video_info(request.youtube_url)

            # Download video segment
            video_segment_path = await self._download_video_segment(request, video_info)

            # Extract frame at specified timestamp
            frame_path = await self._extract_frame_from_video(
                video_segment_path, request.timestamp, request.quality
            )

            # Get frame information
            frame_result = await self._analyze_extracted_frame(frame_path, request.timestamp)

            # Clean up temporary video file
            if video_segment_path and video_segment_path != frame_path:
                try:
                    os.remove(video_segment_path)
                except Exception as e:
                    logger.warning(f"Failed to clean up temporary video file: {e}")

            logger.info(f"Successfully extracted frame: {frame_result.frame_path}")
            return frame_result

        except Exception as e:
            logger.error(f"Failed to extract frame from {request.youtube_url}: {e}")
            raise

    async def extract_frames_batch(
        self, youtube_url: str, interval: int = 30, start_time: int = 0, end_time: int = None
    ) -> List[YouTubeFrameResult]:
        """Extract multiple frames at specified intervals."""

        logger.info(f"Starting batch extraction from {youtube_url}")

        try:
            # Get video information
            video_info = await self._get_video_info(youtube_url)

            # Validate time range
            if end_time is None:
                end_time = min(video_info["duration"], start_time + interval * 10)

            # Generate timestamps for frame extraction
            timestamps = []
            current_time = start_time
            while current_time < end_time:
                timestamps.append(current_time)
                current_time += interval

            logger.info(f"Extracting {len(timestamps)} frames at intervals of {interval}s")

            # Extract frames concurrently
            tasks = [
                self.extract_single_frame(
                    YouTubeFrameRequest(youtube_url=youtube_url, timestamp=ts)
                )
                for ts in timestamps
            ]

            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Filter out exceptions and log them
            successful_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.error(f"Frame extraction failed for timestamp {timestamps[i]}: {result}")
                else:
                    successful_results.append(result)

            logger.info(
                f"Successfully extracted {len(successful_results)} frames out of {len(timestamps)}"
            )
            return successful_results

        except Exception as e:
            logger.error(f"Failed to extract frames batch from {youtube_url}: {e}")
            raise

    async def _get_video_info(self, youtube_url: str) -> Dict[str, Any]:
        """Get video information using yt-dlp."""

        ydl_opts = self._add_cookies(
            {
                "quiet": True,
                "no_warnings": True,
                "extract_flat": "in_playlist",
            }
        )

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(youtube_url, download=False)
                logger.info(f"Video info: {json.dumps(info, indent=2)}")
                return info
        except Exception as e:
            logger.error(f"Failed to get video info from {youtube_url}: {e}")
            raise

    async def _download_video_segment(
        self, request: YouTubeFrameRequest, video_info: Dict[str, Any]
    ) -> str:
        """Download video segment or full video for frame extraction."""

        video_id = video_info.get("id")
        duration = video_info.get("duration", 0)
        is_live = video_info.get("is_live", False) or video_info.get("live_status") == "is_live"

        if not is_live and duration > self.max_video_duration:
            raise ValueError(
                f"Video duration ({duration}s) exceeds maximum allowed ({self.max_video_duration}s)"
            )

        quality_height = self._get_quality_height(request.quality)

        # Use yt-dlp to download video
        ydl_opts = self._add_cookies(
            {
                "format": (
                    f"bestvideo[height<={quality_height}]+bestaudio/best[height<={quality_height}]"
                    if not is_live
                    else f"best[height<={quality_height}]/best"
                ),
                "outtmpl": str(self.output_dir / f"temp_{video_id}.%(ext)s"),
                "quiet": True,
                "no_warnings": True,
                "ignore_no_formats_error": True,
                "socket_timeout": 30,
            }
        )

        # download_ranges must be a callable per yt-dlp API
        if is_live:
            ts = int(request.timestamp)
            seg_start = max(0, ts - 5)
            seg_end = ts + 5
            segment_opts = ydl_opts.copy()
            segment_opts["live_from_start"] = False
            segment_opts["download_ranges"] = lambda _info, _ydl: [
                {"start_time": seg_start, "end_time": seg_end}
            ]
        elif request.start_time is not None or request.end_time is not None:
            seg_start = int(request.start_time or 0)
            seg_end = int(request.end_time or duration)
            segment_opts = ydl_opts.copy()
            segment_opts["download_ranges"] = lambda _info, _ydl: [
                {"start_time": seg_start, "end_time": seg_end}
            ]
        else:
            segment_opts = ydl_opts

        try:
            with yt_dlp.YoutubeDL(segment_opts) as ydl:
                info = ydl.extract_info(request.youtube_url, download=True)
                # Use actual downloaded file path from yt-dlp if available
                if "requested_downloads" in info and info["requested_downloads"]:
                    downloaded_path = info["requested_downloads"][0]["filepath"]
                else:
                    downloaded_path = ydl.prepare_filename(info)
                return downloaded_path
        except Exception as e:
            logger.error(f"Failed to download video segment from {request.youtube_url}: {e}")
            raise

    def _get_quality_height(self, quality: str) -> int:
        """Get video height for quality setting."""

        quality_map = {
            "low": 360,
            "medium": 720,
            "high": 1080,
        }
        return quality_map.get(quality, 1080)

    async def _extract_frame_from_video(
        self, video_path: str, timestamp: float, quality: str
    ) -> str:
        """Extract frame from video using ffmpeg."""

        # Generate output filename
        frame_filename = f"frame_{timestamp}s.jpg"
        frame_path = str(self.output_dir / frame_filename)

        # Build ffmpeg command — seek to timestamp then grab 1 frame
        cmd = [
            "ffmpeg",
            "-y",
            "-ss",
            str(timestamp),
            "-i",
            video_path,
            "-vframes",
            "1",
            "-q:v",
            "2",
            "-s",
            self._get_quality_setting(quality),
            frame_path,
        ]

        try:
            # Run ffmpeg command
            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode != 0:
                logger.error(f"ffmpeg failed: {result.stderr}")
                raise RuntimeError(f"Failed to extract frame: {result.stderr}")

            # Verify frame was created
            if not os.path.exists(frame_path):
                raise RuntimeError(f"Frame extraction failed: {frame_path} not created")

            logger.info(f"Successfully extracted frame: {frame_path}")
            return frame_path

        except FileNotFoundError:
            raise RuntimeError("ffmpeg not found. Please install ffmpeg.")
        except Exception as e:
            logger.error(f"Failed to extract frame from {video_path}: {e}")
            raise

    def _get_quality_setting(self, quality: str) -> str:
        """Get quality setting for ffmpeg."""

        quality_settings = {
            "low": "320x240",
            "medium": "640x360",
            "high": "1920x1080",
        }
        return quality_settings.get(quality, "1920x1080")

    async def _analyze_extracted_frame(
        self, frame_path: str, timestamp: float
    ) -> YouTubeFrameResult:
        """Analyze extracted frame and return metadata."""

        import cv2

        # Read frame with OpenCV
        frame = cv2.imread(frame_path)
        if frame is None:
            raise RuntimeError(f"Failed to read extracted frame: {frame_path}")

        # Get frame dimensions
        height, width, channels = frame.shape

        # Get file size
        file_size = os.path.getsize(frame_path)

        # Extract video ID from filename
        video_id = (
            Path(frame_path).stem.split("_")[-1] if "_" in Path(frame_path).stem else "unknown"
        )

        # Create result object
        result = YouTubeFrameResult(
            frame_path=frame_path,
            timestamp=timestamp,
            duration=1.0,  # Frame duration for single frame
            file_size=file_size,
            extraction_method="ffmpeg_at",
            video_id=video_id,
            resolution=f"{width}x{height}",
            format="jpg",
        )

        logger.info(f"Frame analysis completed: {result.resolution}, {file_size} bytes")
        return result

    async def cleanup(self, frame_path: str = None):
        """Clean up extracted frames."""

        if frame_path:
            try:
                if os.path.exists(frame_path):
                    os.remove(frame_path)
                    logger.info(f"Cleaned up frame: {frame_path}")
            except Exception as e:
                logger.warning(f"Failed to cleanup frame {frame_path}: {e}")

        # Clean up temporary files
        temp_files = list(self.output_dir.glob("temp_*.mp4"))
        for temp_file in temp_files:
            try:
                os.remove(temp_file)
                logger.info(f"Cleaned up temp file: {temp_file}")
            except Exception as e:
                logger.warning(f"Failed to cleanup temp file {temp_file}: {e}")

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.cleanup()


YouTubeFrameExtractor = YouTubeExtractionConfig
