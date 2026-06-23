// ----- YouTube API service @ client/src/lib/youtube-api.ts -----
import type { UploadResult } from "../types";
import type { YouTubeFrameRequest, YouTubeFrameResult, YouTubeCaptureRequest, YouTubeCaptureResult } from "../types/youtube";
import { uploadImage } from "./api";

const BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

export interface YouTubeFrameResponse {
  records: any[];
  preprocess_steps: string[];
  frame_result: YouTubeFrameResult;
  annotated_image_b64?: string;
}

export async function extractYouTubeFrame(request: YouTubeFrameRequest): Promise<YouTubeFrameResponse> {
  const response = await fetch(`${BASE}/api/violations/youtube/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }
  
  return (await response.json()) as YouTubeFrameResponse;
}

export async function captureYouTubeFrames(request: YouTubeCaptureRequest): Promise<YouTubeCaptureResult> {
  const response = await fetch(`${BASE}/api/violations/youtube/capture`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }
  
  return (await response.json()) as YouTubeCaptureResult;
}

export async function uploadYouTubeFrame(file: File): Promise<UploadResult> {
  return uploadImage(file);
}
