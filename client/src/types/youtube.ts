// ----- YouTube-related types @ client/src/types/youtube.ts -----
export interface YouTubeFrameRequest {
  youtube_url: string;
  timestamp?: number;
  quality?: "low" | "medium" | "high";
  start_time?: number;
  end_time?: number;
}

export interface YouTubeFrameResult {
  frame_path: string;
  timestamp: number;
  duration: number;
  file_size: number;
  extraction_method: string;
  video_id: string;
  resolution: string;
  format: string;
}

export interface YouTubeCaptureRequest {
  youtube_url: string;
  interval?: number;
  start_time?: number;
  end_time?: number;
  max_frames?: number;
}

export interface YouTubeCaptureResult {
  frames: YouTubeFrameResult[];
  total_frames: number;
  processing_time: number;
}
