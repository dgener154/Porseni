import { VideoKegiatan } from '../types';

export interface ParsedVideo {
  type: 'youtube' | 'drive' | 'direct' | 'iframe';
  embedUrl: string;
  directUrl?: string;
}

/**
 * Parses user input video URLs into an embeddable format
 * Supports YouTube (watch, youtu.be, embed, shorts), Google Drive, and direct video links (.mp4, .webm).
 */
export function parseVideoUrl(rawUrl: string): ParsedVideo {
  const url = (rawUrl || '').trim();

  // 1. YouTube
  // Matches: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`,
    };
  }

  // 2. Google Drive
  // Matches: drive.google.com/file/d/FILE_ID/view...
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    return {
      type: 'drive',
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
    };
  }

  // 3. Direct video format (.mp4, .webm, .ogg)
  if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
    return {
      type: 'direct',
      embedUrl: url,
      directUrl: url,
    };
  }

  // Default fallback (assume iframe-embeddable or direct)
  return {
    type: 'iframe',
    embedUrl: url,
  };
}

/**
 * Returns a high-quality thumbnail image for a video
 */
export function getVideoThumbnail(video: VideoKegiatan): string {
  if (video.thumbnailUrl && video.thumbnailUrl.trim()) {
    return video.thumbnailUrl;
  }

  // Check if YouTube ID can be extracted
  const ytMatch = video.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }

  // Fallback high-res sports/arts images
  const fallbacks = [
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
  ];
  return fallbacks[0];
}
