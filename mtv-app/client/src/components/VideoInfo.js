import React, { useState, useEffect } from 'react';
import './VideoInfo.css';

const VideoInfo = ({ video, currentIndex, totalVideos, programmingBlock }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeClass, setFadeClass] = useState('fade-in');

  useEffect(() => {
    if (video) {
      // Reset visibility and show with fade-in
      setIsVisible(true);
      setFadeClass('fade-in');

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setFadeClass('fade-out');
        // Completely hide after fade animation completes
        setTimeout(() => {
          setIsVisible(false);
        }, 500); // Match the CSS transition duration
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [video]); // Trigger when video changes

  if (!video || !isVisible) return null;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`video-info ${fadeClass}`}>
      <div className="video-info-content">
        <div className="now-playing">
          <span className="now-playing-badge">STV LIVE</span>
          {programmingBlock && (
            <span className="programming-block">
              {programmingBlock.name}
            </span>
          )}
          <span className="video-counter">
            {currentIndex + 1} of {totalVideos}
          </span>
        </div>

        <div className="video-details">
          <h2 className="video-title">{video.title}</h2>
          <p className="video-artist">{video.artist}</p>

          <div className="video-meta">
            <span className="duration">
              {formatDuration(video.duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoInfo;