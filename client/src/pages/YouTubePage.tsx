// ----- YouTube video player and frame extraction @ client/src/pages/YouTubePage.tsx -----

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { extractYouTubeFrame, captureYouTubeFrames } from "../lib/youtube-api";
import type { YouTubeFrameRequest, YouTubeFrameResult } from "../types/youtube";
import { SectionHeader, AsyncBoundary } from "../components/ui";
import { IconPlay, IconPlus } from "../components/icons";

const PANEL = "rounded-md border border-slate-200 bg-white";

const extractYouTubeVideoId = (url: string): string | null => {
  const match = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (match) return match[1];

  const shortMatch = url.match(/youtu\.be\/([^&]+)/);
  if (shortMatch) return shortMatch[1];

  return null;
};

export function YouTubePage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState<string>("https://www.youtube.com/watch?v=FWvIPfxK5Jo");
  const [error, setError] = useState<string | null>(null);
  const [extractedFrame, setExtractedFrame] = useState<YouTubeFrameResult | null>(null);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const videoRef = useRef<HTMLIFrameElement>(null);

  const extractFrame = async () => {
    if (!url || !url.includes("youtube.com")) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    setIsExtracting(true);
    setError(null);
    setExtractedFrame(null);
    setExtractionResult(null);

    try {
      const videoId = extractYouTubeVideoId(url);
      if (!videoId) {
        setError("Could not extract YouTube video ID");
        return;
      }

      const request: YouTubeFrameRequest = {
        youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
        timestamp: 30,
        quality: "high",
      };

      const result = await extractYouTubeFrame(request);
      setExtractedFrame(result.frame_result);
      setExtractionResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to extract frame");
    } finally {
      setIsExtracting(false);
    }
  };

  const extractBatchFrames = async () => {
    if (!url || !url.includes("youtube.com")) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    setIsExtracting(true);
    setError(null);
    setExtractedFrame(null);
    setExtractionResult(null);

    try {
      const request = {
        youtube_url: url,
        interval: 30,
        start_time: 0,
        end_time: 60,
      };

      const result = await captureYouTubeFrames(request);
      if (result.frames.length > 0) {
        setExtractedFrame(result.frames[0]);
        setExtractionResult({
          records: result.frames.map(f => f.frame_path),
          preprocess_steps: ["youtube_frame_extraction"],
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to extract frames");
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">YouTube Video Analysis</h1>
        <button
          onClick={() => navigate("/live")}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <IconPlay width={16} height={16} /> Open Live Detection
        </button>
      </div>

      <AsyncBoundary loading={false} error={error} loadingLabel="Loading YouTube video...">
        <div className="space-y-6">
          <div className={`${PANEL} p-6`}>
            <SectionHeader title="YouTube Video Player" />
            <div className="mt-4 space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=FWvIPfxK5Jo)"
                  className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && extractFrame()}
                />
                <button
                  onClick={extractFrame}
                  disabled={isExtracting}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-[#fff] hover:bg-blue-700 disabled:opacity-50"
                >
                  <IconPlay width={16} height={16} /> Extract Frame
                </button>
                <button
                  onClick={extractBatchFrames}
                  disabled={isExtracting}
                  className="inline-flex items-center gap-2 rounded-md bg-slate-600 px-4 py-2 text-sm font-semibold text-[#fff] hover:bg-slate-700 disabled:opacity-50"
                >
                  <IconPlus width={16} height={16} /> Extract Multiple
                </button>
              </div>

              {isExtracting && (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                  <span className="ml-3 text-sm text-slate-600">Extracting from YouTube...</span>
                </div>
              )}

              <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden">
                <iframe
                  ref={videoRef}
                  src={`https://www.youtube.com/embed/${extractYouTubeVideoId(url)}?autoplay=0&controls=1&modestbranding=1`}
                  title="Traffic Violation Detection - YouTube"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
          </div>

          {extractionResult && (
            <div className={`${PANEL} p-6`}>
              <SectionHeader title="Detection Results" />
              <div className="mt-4 space-y-4">
                {extractedFrame && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <img
                        src={extractedFrame.frame_path}
                        alt="Extracted frame"
                        className="w-full rounded-lg border border-slate-200"
                      />
                      <div className="mt-2 text-xs text-slate-500">
                        Timestamp: {extractedFrame.timestamp}s | Resolution: {extractedFrame.resolution}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <h4 className="font-semibold text-slate-900 mb-3">Analysis Results</h4>
                        {extractionResult.records && extractionResult.records.length > 0 ? (
                          <div className="space-y-2">
                            {extractionResult.records.map((_: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-b-0">
                                <span className="text-sm text-slate-700">Frame {idx + 1}</span>
                                <span className="text-sm font-medium text-blue-600">Detected</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500 italic">
                            No violations detected in the extracted frame.
                          </div>
                        )}

                        {extractionResult.preprocess_steps && extractionResult.preprocess_steps.length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-sm font-semibold text-slate-900 mb-2">Processing Steps:</h5>
                            <ul className="text-xs text-slate-600 space-y-1">
                              {extractionResult.preprocess_steps.map((step: string, idx: number) => (
                                <li key={idx}>• {step}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </AsyncBoundary>
    </div>
  );
}
