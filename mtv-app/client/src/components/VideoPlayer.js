import React, { useEffect, useRef, useState } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ video, onVideoEnd, onSkip, userHasInteracted }) => {
  const videoRef = useRef(null);
  const youtubePlayerRef = useRef(null);
  const [player, setPlayer] = useState(null);
  const [playerType, setPlayerType] = useState('html5'); // 'html5' or 'youtube'
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
  const hideControlsTimer = useRef(null);
  const [userInteracting, setUserInteracting] = useState(false);

  useEffect(() => {
    if (video) {
      setHasTriedFallback(false);
      determinePlayerType();
    }

    // Cleanup function
    return () => {
      cleanup();
    };
  }, [video]);

  const cleanup = () => {
    if (player && playerType === 'youtube') {
      try {
        player.destroy();
      } catch (e) {
        console.warn('Error destroying YouTube player:', e);
      }
    }
    if (videoRef.current) {
      const videoElement = videoRef.current;
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('error', handleVideoError);
    }
  };

  const determinePlayerType = () => {
    if (!video) return;

    // Always use HTML5 for demo videos or when URL is provided
    // Only try YouTube embedding if explicitly marked as YouTube AND no direct URL provided
    const shouldUseYouTube = video.isYouTube === true &&
                            !video.url &&
                            !video.usingDemoVideo &&
                            (video.youtubeId || video.id);

    if (shouldUseYouTube) {
      console.log('Attempting YouTube player for video:', video.title);
      setPlayerType('youtube');
      loadYouTubePlayer();
    } else {
      console.log('Using HTML5 player for video:', video.title,
                  video.usingDemoVideo ? '(demo video with real metadata)' : '');
      setPlayerType('html5');
      loadHTML5Video();
    }
  };

  const loadYouTubePlayer = () => {
    if (!window.YT) {
      // Load YouTube API
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(script);
      window.onYouTubeIframeAPIReady = initializeYouTubePlayer;
    } else {
      initializeYouTubePlayer();
    }
  };

  const initializeYouTubePlayer = () => {
    if (!youtubePlayerRef.current || !video) return;

    try {
      const videoId = video.youtubeId || video.id;
      const newPlayer = new window.YT.Player(youtubePlayerRef.current, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          showinfo: 0
        },
        events: {
          onReady: (event) => {
            setPlayer(event.target);
            setIsLoading(false);
            event.target.playVideo();
          },
          onStateChange: handleYouTubePlayerStateChange,
          onError: (event) => {
            console.error('YouTube player error:', event.data);
            handleYouTubeError(event.data);
          }
        }
      });
    } catch (error) {
      console.error('Error creating YouTube player:', error);
      fallbackToHTML5();
    }
  };

  const handleYouTubePlayerStateChange = (event) => {
    const state = event.data;

    if (state === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      setDuration(event.target.getDuration());
      startYouTubeTimeUpdater(event.target);
    } else if (state === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
    } else if (state === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
      console.log('🔚 STV YouTube video ended - advancing to next rad jam!');
      onVideoEnd();
    }
  };

  const startYouTubeTimeUpdater = (ytPlayer) => {
    const updateTime = () => {
      if (ytPlayer && playerType === 'youtube') {
        try {
          setCurrentTime(ytPlayer.getCurrentTime());
          if (isPlaying) {
            requestAnimationFrame(updateTime);
          }
        } catch (e) {
          // Player might be destroyed
        }
      }
    };
    requestAnimationFrame(updateTime);
  };

  const handleYouTubeError = (errorCode) => {
    console.error('YouTube error code:', errorCode);
    let errorMessage = 'YouTube video unavailable';

    switch (errorCode) {
      case 2:
        errorMessage = 'Invalid video ID';
        break;
      case 5:
        errorMessage = 'HTML5 player error';
        break;
      case 100:
        errorMessage = 'Video not found';
        break;
      case 101:
      case 150:
        errorMessage = 'Video embedding restricted - switching to demo video';
        break;
      default:
        errorMessage = 'Video playback error';
    }

    setError(errorMessage);
    setIsLoading(false);

    // Try to fallback to HTML5 if there's a direct URL
    if (video.url || video.fallbackUrl) {
      console.log('Falling back to HTML5 player with demo video...');
      setTimeout(() => {
        fallbackToHTML5();
      }, 1500);
    } else {
      // Skip to next video
      setTimeout(() => {
        onSkip();
      }, 3000);
    }
  };

  const fallbackToHTML5 = () => {
    setPlayerType('html5');
    setError(null);
    setIsLoading(true);
    loadHTML5Video();
  };

  const loadHTML5Video = async () => {
    if (!videoRef.current || !video) return;

    setIsLoading(true);
    setError(null);

    const videoElement = videoRef.current;

    // Determine which URL to use
    const urlToTry = hasTriedFallback ? video.fallbackUrl : video.url;
    setCurrentVideoUrl(urlToTry);

    // Clean up existing event listeners
    videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.removeEventListener('canplay', handleCanPlay);
    videoElement.removeEventListener('play', handlePlay);
    videoElement.removeEventListener('pause', handlePause);
    videoElement.removeEventListener('ended', handleEnded);
    videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    videoElement.removeEventListener('error', handleVideoError);

    // Set up event listeners
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('error', handleVideoError);

    // Load the video
    try {
      videoElement.src = urlToTry;
      videoElement.load();
    } catch (err) {
      handleVideoError(err);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    // Auto-play the video with better mobile support
    if (videoRef.current) {
      const playPromise = videoRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Auto-play started successfully
            console.log('Video auto-play started');
          })
          .catch((error) => {
            console.log('Auto-play prevented, trying with muted:', error);
            // If auto-play fails, try with muted
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch((mutedError) => {
                console.log('Muted auto-play also failed:', mutedError);
                // Show play button if both attempts fail
                setError('Tap to play video');
              });
            }
          });
      }
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    console.log('🔚 STV video ended - advancing to next rad jam!');
    onVideoEnd();
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVideoError = (error) => {
    console.error('Video error for URL:', currentVideoUrl, error);

    // Try fallback URL if we haven't tried it yet and it exists
    if (!hasTriedFallback && video.fallbackUrl && video.fallbackUrl !== currentVideoUrl) {
      console.log('Video failed, trying fallback URL:', video.fallbackUrl);
      setHasTriedFallback(true);
      setError('Trying alternate source...');
      setIsLoading(true);
      setTimeout(() => {
        loadHTML5Video();
      }, 500); // Shorter delay for better UX
    } else {
      // No fallback available or fallback also failed
      console.error('All video sources failed for:', video.title);
      setError('Video unavailable - skipping to next...');
      setIsLoading(false);
      // Skip to next video after a shorter delay
      setTimeout(() => {
        console.log('Auto-skipping due to video failure');
        onSkip();
      }, 2000); // Reduced from 3000ms
    }
  };

  const togglePlayPause = () => {
    if (playerType === 'youtube' && player) {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    } else if (playerType === 'html5' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(handleVideoError);
      }
    }
  };

  const handleMouseMove = () => {
    setUserInteracting(true);
    setShowControls(true);
    clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      setUserInteracting(false);
      setShowControls(false);
    }, 3000);
  };

  const handleMouseLeave = () => {
    clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      setUserInteracting(false);
      setShowControls(false);
    }, 1000); // Faster hide when mouse leaves
  };

  const handleTouch = () => {
    setUserInteracting(true);
    setShowControls(true);
    clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      setUserInteracting(false);
      setShowControls(false);
    }, 4000); // Longer timeout for touch devices
  };

  const formatTime = (seconds) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="video-player-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
    >
      <div className="video-player">
        {playerType === 'youtube' ? (
          <div ref={youtubePlayerRef} className="youtube-player" />
        ) : (
          <video
            ref={videoRef}
            className="html5-video-player"
            playsInline
            preload="metadata"
            muted={false}
            controls={false}
            autoPlay={false}
            crossOrigin="anonymous"
          />
        )}

        {isLoading && (
          <div className="video-loading">
            <div className="loading-spinner"></div>
            <p>Loading video...</p>
            <p className="player-type">
              Player: {playerType === 'youtube' ? 'YouTube' : 'HTML5'}
              {video?.usingDemoVideo && ' (Demo video with real metadata)'}
            </p>
            {hasTriedFallback && <p className="fallback-info">Trying backup source...</p>}
            {currentVideoUrl && (
              <p className="video-url-info">
                Source: {currentVideoUrl.includes('googleapis.com') ? 'Google Storage' :
                        currentVideoUrl.includes('w3.org') ? 'W3C Media' :
                        currentVideoUrl.includes('vjs.zencdn') ? 'Video.js CDN' :
                        currentVideoUrl.includes('test-videos.co.uk') ? 'Test Videos' : 'External'}
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="video-error">
            <div className="error-icon">
              {error === 'Tap to play video' ? '▶️' : '⚠️'}
            </div>
            <p>{error}</p>
            {error === 'Tap to play video' ? (
              <button
                className="manual-play-btn"
                onClick={() => {
                  setError(null);
                  if (videoRef.current) {
                    videoRef.current.play().catch(handleVideoError);
                  }
                }}
              >
                Play Video
              </button>
            ) : (
              <p>Skipping to next video...</p>
            )}
          </div>
        )}
      </div>

      <div className={`video-controls ${showControls ? 'visible' : 'hidden'}`}>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="control-buttons">
          <button
            className="control-btn play-pause"
            onClick={togglePlayPause}
            disabled={isLoading || error}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>

          <button
            className="control-btn skip"
            onClick={onSkip}
          >
            ⏭️
          </button>
        </div>
      </div>

      {!video && (
        <div className="no-video-placeholder">
          <h2>🎵 Loading Music Video...</h2>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;