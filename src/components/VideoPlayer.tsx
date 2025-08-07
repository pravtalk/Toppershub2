import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  description?: string;
  duration?: number;
  isFree?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

const VideoPlayer = ({ 
  videoUrl, 
  title, 
  description, 
  duration, 
  isFree = false,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false
}: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Extract video ID from YouTube URL
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Extract video ID from Vimeo URL
  const getVimeoVideoId = (url: string) => {
    const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // Check if URL is a direct video file
  const isDirectVideo = (url: string) => {
    return /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)(\?.*)?$/i.test(url);
  };

  // Check if URL is an HLS stream
  const isHLSVideo = (url: string) => {
    return /\.m3u8(\?.*)?$/i.test(url);
  };

  const videoId = getYouTubeVideoId(videoUrl);
  const vimeoId = getVimeoVideoId(videoUrl);
  const isDirect = isDirectVideo(videoUrl);
  const isHLS = isHLSVideo(videoUrl);
  
  let embedUrl = videoUrl;
  let videoType = 'custom';
  
  if (videoId) {
    embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`;
    videoType = 'youtube';
  } else if (vimeoId) {
    embedUrl = `https://player.vimeo.com/video/${vimeoId}`;
    videoType = 'vimeo';
  } else if (isHLS) {
    videoType = 'hls';
  } else if (isDirect) {
    videoType = 'direct';
  }

  // Initialize HLS player
  useEffect(() => {
    if (videoType === 'hls' && videoRef.current && videoUrl) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        
        hls.loadSource(videoUrl);
        hls.attachMedia(videoRef.current);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest loaded');
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data);
        });
        
        hlsRef.current = hls;
        
        return () => {
          hls.destroy();
        };
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS support
        videoRef.current.src = videoUrl;
      }
    }
  }, [videoUrl, videoType]);

  // Cleanup HLS on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl line-clamp-2">{title}</CardTitle>
            {isFree && <Badge variant="secondary">Free Preview</Badge>}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Video Container */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {videoType === 'youtube' && videoId ? (
              <iframe
                src={embedUrl}
                title={title}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : videoType === 'vimeo' && vimeoId ? (
              <iframe
                src={embedUrl}
                title={title}
                className="w-full h-full"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : videoType === 'hls' ? (
              <video
                ref={videoRef}
                controls
                className="w-full h-full"
                poster=""
                preload="metadata"
                crossOrigin="anonymous"
              >
                Your browser does not support HLS video playback.
              </video>
            ) : videoType === 'direct' ? (
              <video
                controls
                className="w-full h-full"
                poster=""
                preload="metadata"
              >
                <source src={videoUrl} />
                Your browser does not support the video tag.
              </video>
            ) : videoUrl ? (
              // Fallback: try as iframe for other embedded content
              <iframe
                src={videoUrl}
                title={title}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onError={() => {
                  console.error('Failed to load video:', videoUrl);
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white">
                  <Play className="h-16 w-16 mx-auto mb-4 opacity-70" />
                  <p className="text-lg">No video available</p>
                  <p className="text-sm opacity-70">Please check the video URL</p>
                </div>
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="text-center text-sm text-muted-foreground">
            {videoType === 'youtube' && <span>🎥 YouTube Video</span>}
            {videoType === 'vimeo' && <span>🎬 Vimeo Video</span>}
            {videoType === 'hls' && <span>📺 HLS Live Stream</span>}
            {videoType === 'direct' && <span>📹 Direct Video</span>}
            {videoType === 'custom' && videoUrl && <span>🔗 External Video Link</span>}
          </div>

          {/* Video Controls */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div className="flex items-center gap-2">
              {duration && (
                <span className="text-sm text-muted-foreground">
                  Duration: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')} min
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {hasPrevious && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrevious}
                  className="flex items-center gap-1"
                >
                  <SkipBack className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
              )}
              
              {hasNext && (
                <Button
                  size="sm"
                  onClick={onNext}
                  className="flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <SkipForward className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoPlayer;