import React, { useState, useEffect, useRef } from 'react';
import VideoPlayer from './components/VideoPlayer';
import VideoInfo from './components/VideoInfo';
import NetworkInfo from './components/NetworkInfo';
import './App.css';

function App() {
  const [playlist, setPlaylist] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [connectedDevices, setConnectedDevices] = useState(0);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [programmingBlock, setProgrammingBlock] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    initializeApp();
    setupWebSocket();

    // Enable autoplay after user interaction
    const enableAutoplay = () => {
      setUserHasInteracted(true);
      document.removeEventListener('click', enableAutoplay);
      document.removeEventListener('touchstart', enableAutoplay);
    };

    document.addEventListener('click', enableAutoplay);
    document.addEventListener('touchstart', enableAutoplay);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      document.removeEventListener('click', enableAutoplay);
      document.removeEventListener('touchstart', enableAutoplay);
    };
  }, []);

  const initializeApp = async () => {
    try {
      // Fetch initial playlist
      const playlistResponse = await fetch('/api/playlist');
      const playlistData = await playlistResponse.json();

      setPlaylist(playlistData.playlist);
      setCurrentVideo(playlistData.currentVideo);
      setCurrentIndex(playlistData.currentIndex);
      setProgrammingBlock(playlistData.programmingBlock);

      // Fetch network info
      const networkResponse = await fetch('/api/network/info');
      const networkData = await networkResponse.json();
      setNetworkInfo(networkData);
      setConnectedDevices(networkData.connectedDevices);

      setIsLoading(false);
    } catch (err) {
      setError('Whoa! Steph\'s rad music station hit a glitch: ' + err.message);
      setIsLoading(false);
    }
  };

  const setupWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('STV WebSocket connected - Steph\'s station is live!');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    wsRef.current.onclose = () => {
      console.log('STV WebSocket disconnected - trying to reconnect Steph\'s station...');
      // Attempt to reconnect after 5 seconds
      setTimeout(setupWebSocket, 5000);
    };

    wsRef.current.onerror = (error) => {
      console.error('STV WebSocket error:', error);
    };
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'initial_state':
        setPlaylist(data.playlist);
        setCurrentVideo(data.currentVideo);
        setCurrentIndex(data.currentIndex);
        setProgrammingBlock(data.programmingBlock);
        break;
      case 'video_changed':
        setCurrentVideo(data.currentVideo);
        setCurrentIndex(data.currentIndex);
        if (data.programmingBlock) {
          setProgrammingBlock(data.programmingBlock);
        }
        break;
      case 'playlist_updated':
        setPlaylist(data.playlist);
        setCurrentVideo(data.playlist[data.currentIndex]);
        setCurrentIndex(data.currentIndex);
        setProgrammingBlock(data.programmingBlock);
        break;
      case 'programming_updated':
        setPlaylist(data.playlist);
        setCurrentVideo(data.currentVideo);
        setCurrentIndex(data.currentIndex);
        setProgrammingBlock(data.programmingBlock);
        console.log('📺 STV Programming updated to:', data.programmingBlock?.name);
        break;
      case 'state_sync':
        // Handle state synchronization from other devices
        break;
      default:
        console.log('STV received unknown message type:', data.type);
    }
  };

  const skipToNext = async () => {
    try {
      console.log('⏭️ Steph wants to skip to the next radical jam...');
      const response = await fetch('/api/player/skip', { method: 'POST' });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ STV successfully cranked up:', data.currentVideo?.title);
      setCurrentVideo(data.currentVideo);
      setCurrentIndex(data.currentIndex);
    } catch (err) {
      console.error('❌ STV skip failed - not cool:', err);
      // If skip fails, try to refresh the entire playlist
      setTimeout(() => {
        console.log('🔄 STV attempting to refresh Steph\'s playlist after skip failure...');
        refreshPlaylist();
      }, 1000);
    }
  };

  const refreshPlaylist = async () => {
    try {
      await fetch('/api/playlist/refresh', { method: 'POST' });
      // The WebSocket will handle the update
    } catch (err) {
      console.error('STV failed to refresh Steph\'s playlist:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <h1>STV</h1>
        <h2>Totally Loading Steph's Jams!</h2>
        <p>Cranking up the radical vibes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <h1>STV</h1>
        <h2>Bogus! Steph's Rad Music Station Hit a Snag</h2>
        <p>{error}</p>
        <button onClick={initializeApp}>Restart the Radical Experience!</button>
      </div>
    );
  }

  return (
    <div className="app">
      <main className="app-main">
        {currentVideo ? (
          <>
            <VideoPlayer
              video={currentVideo}
              onVideoEnd={skipToNext}
              onSkip={skipToNext}
              userHasInteracted={userHasInteracted}
            />
            <VideoInfo
              video={currentVideo}
              currentIndex={currentIndex}
              totalVideos={playlist.length}
              programmingBlock={programmingBlock}
            />
          </>
        ) : (
          <div className="no-video">
            <h2>No Jams in the Rotation!</h2>
            <button onClick={refreshPlaylist}>Crank Up Steph's Playlist!</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;