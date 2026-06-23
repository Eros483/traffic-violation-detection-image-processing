# ----- tests for youtube frame extraction @ tests/test_src/test_youtube_extractor.py -----

from unittest.mock import AsyncMock, MagicMock, patch, PropertyMock

import cv2
import numpy as np
import pytest

from src.youtube_extractor import YouTubeExtractionConfig, YouTubeFrameRequest


@pytest.fixture
def extractor():
    return YouTubeExtractionConfig()


@pytest.mark.asyncio
async def test_extract_single_frame_missing_ffmpeg(extractor):
    """Should raise RuntimeError when ffmpeg is not installed."""
    request = YouTubeFrameRequest(
        youtube_url="https://www.youtube.com/watch?v=test",
        timestamp=30.0,
    )
    with (
        patch.object(
            extractor,
            "_get_video_info",
            return_value={"id": "test", "duration": 120, "is_live": False},
        ),
        patch.object(extractor, "_download_video_segment", return_value="/fake/path.mp4"),
        patch("subprocess.run", side_effect=FileNotFoundError("ffmpeg not found")),
    ):
        with pytest.raises(RuntimeError, match="ffmpeg not found"):
            await extractor.extract_single_frame(request)


@pytest.mark.asyncio
async def test_extract_single_frame_ffmpeg_fails(extractor):
    """Should raise RuntimeError when ffmpeg returns non-zero exit code."""
    request = YouTubeFrameRequest(
        youtube_url="https://www.youtube.com/watch?v=test",
        timestamp=30.0,
    )
    with (
        patch.object(
            extractor,
            "_get_video_info",
            return_value={"id": "test", "duration": 120, "is_live": False},
        ),
        patch.object(extractor, "_download_video_segment", return_value="/fake/path.mp4"),
        patch("subprocess.run") as mock_run,
    ):
        mock_proc = MagicMock()
        mock_proc.returncode = 1
        mock_proc.stderr = "ffmpeg error"
        mock_run.return_value = mock_proc

        with pytest.raises(RuntimeError, match="Failed to extract frame"):
            await extractor.extract_single_frame(request)


def test_get_quality_height(extractor):
    """Should return correct height for each quality setting."""
    assert extractor._get_quality_height("low") == 360
    assert extractor._get_quality_height("medium") == 720
    assert extractor._get_quality_height("high") == 1080
    assert extractor._get_quality_height("unknown") == 1080  # default


def test_get_quality_setting(extractor):
    """Should return correct resolution string for each quality setting."""
    assert extractor._get_quality_setting("low") == "320x240"
    assert extractor._get_quality_setting("medium") == "640x360"
    assert extractor._get_quality_setting("high") == "1920x1080"
    assert extractor._get_quality_setting("unknown") == "1920x1080"


@pytest.mark.asyncio
async def test_get_video_info_success(extractor):
    """Should fetch video info via yt-dlp."""
    mock_info = {"id": "test123", "title": "Test Video", "duration": 120}
    with patch("yt_dlp.YoutubeDL") as mock_ydl:
        mock_ctx = MagicMock()
        mock_ydl.return_value.__enter__.return_value = mock_ctx
        mock_ctx.extract_info.return_value = mock_info

        info = await extractor._get_video_info("https://youtube.com/watch?v=test123")
        assert info["id"] == "test123"
        mock_ctx.extract_info.assert_called_once()


@pytest.mark.asyncio
async def test_get_video_info_failure(extractor):
    """Should propagate yt-dlp errors."""
    with patch("yt_dlp.YoutubeDL") as mock_ydl:
        mock_ctx = MagicMock()
        mock_ydl.return_value.__enter__.return_value = mock_ctx
        mock_ctx.extract_info.side_effect = Exception("Network error")

        with pytest.raises(Exception, match="Network error"):
            await extractor._get_video_info("https://youtube.com/watch?v=test123")


def test_youtube_url_validation():
    """Should accept valid YouTube URLs and reject others."""
    valid = YouTubeFrameRequest(youtube_url="https://www.youtube.com/watch?v=test123")
    assert valid.youtube_url == "https://www.youtube.com/watch?v=test123"

    valid_short = YouTubeFrameRequest(youtube_url="https://youtu.be/test123")
    assert valid_short.youtube_url == "https://youtu.be/test123"

    with pytest.raises(ValueError, match="must be a valid YouTube URL"):
        YouTubeFrameRequest(youtube_url="https://vimeo.com/12345")


def test_request_defaults():
    """Should set sensible defaults for optional fields."""
    req = YouTubeFrameRequest(youtube_url="https://youtube.com/watch?v=abc")
    assert req.timestamp == 0.0
    assert req.quality == "high"
    assert req.start_time is None
    assert req.end_time is None


@pytest.mark.asyncio
async def test_cleanup_removes_temp_files(extractor, tmp_path):
    """cleanup should remove specified frame and temp mp4 files."""
    extractor.output_dir = tmp_path

    frame_file = tmp_path / "frame_30s.jpg"
    frame_file.write_text("fake")
    temp_file = tmp_path / "temp_test.mp4"
    temp_file.write_text("fake")

    await extractor.cleanup(str(frame_file))

    assert not frame_file.exists()
    assert not temp_file.exists()


@pytest.mark.asyncio
async def test_async_context_manager(extractor):
    """__aenter__ and __aexit__ should work without error."""
    async with extractor as e:
        assert e is extractor


@pytest.mark.asyncio
async def test_extract_frames_batch_empty(extractor):
    """Should return empty list when end_time <= start_time."""
    with patch.object(extractor, "_get_video_info", return_value={"id": "test", "duration": 60}):
        results = await extractor.extract_frames_batch(
            "https://youtube.com/watch?v=test", interval=30, start_time=0, end_time=0
        )
        assert results == []
