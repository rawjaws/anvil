const axios = require('axios');

class YouTubeService {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || 'demo-key';
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
    this.hasValidApiKey = this.apiKey && this.apiKey.trim() !== '' && this.apiKey !== 'demo-key';
  }

  // Search for videos using YouTube Data API
  async searchVideos(query, maxResults = 10) {
    if (!this.hasValidApiKey) {
      console.warn('No valid YouTube API key available');
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          type: 'video',
          videoCategoryId: '10', // Music category
          regionCode: 'US',
          relevanceLanguage: 'en',
          maxResults: maxResults,
          order: 'relevance',
          publishedAfter: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // Last year
          q: query,
          key: this.apiKey
        }
      });

      if (response.data.items && response.data.items.length > 0) {
        const videoIds = response.data.items.map(item => item.id.videoId).join(',');

        // Get detailed video information
        const detailsResponse = await axios.get(`${this.baseUrl}/videos`, {
          params: {
            part: 'snippet,contentDetails,statistics',
            id: videoIds,
            key: this.apiKey
          }
        });

        return detailsResponse.data.items
          .filter(item => {
            const viewCount = parseInt(item.statistics.viewCount || '0');
            const duration = this.parseDuration(item.contentDetails.duration);

            // Filter for music videos with good engagement
            return viewCount >= 10000 && // At least 10K views (lowered from 50K)
                   duration >= 30 && // At least 30 seconds (lowered from 60)
                   duration <= 14400 && // Max 4 hours (to allow music mixes and playlists)
                   item.snippet.liveBroadcastContent !== 'live';
          })
          .map((item, index) => {
            const duration = this.parseDuration(item.contentDetails.duration);
            const viewCount = parseInt(item.statistics.viewCount || '0');

            // Use demo videos with real YouTube metadata to avoid embedding restrictions
            const demoVideos = this.getDemoVideoUrls();
            const videoIndex = index % demoVideos.length;
            const demoVideo = demoVideos[videoIndex];

            return {
              id: `youtube_${item.id}`,
              youtubeId: item.id,
              title: item.snippet.title,
              artist: item.snippet.channelTitle,
              thumbnail: item.snippet.thumbnails.maxres?.url ||
                        item.snippet.thumbnails.high?.url ||
                        item.snippet.thumbnails.medium.url,
              duration: duration,
              viewCount: viewCount,
              publishedAt: item.snippet.publishedAt,
              // Use demo video URL instead of YouTube embedding
              url: demoVideo.url,
              fallbackUrl: demoVideo.fallbackUrl,
              type: 'html5',
              isYouTube: false, // Set to false to force HTML5 player
              originalYouTubeId: item.id, // Keep original for reference
              usingDemoVideo: true // Flag to indicate this is using demo content
            };
          });
      }

      return [];
    } catch (error) {
      console.error(`YouTube search error for "${query}":`, error.message);

      // Handle specific YouTube API errors
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data?.error;

        if (status === 403) {
          console.warn('YouTube API quota exceeded or access forbidden');
          if (errorData?.errors) {
            errorData.errors.forEach(err => {
              console.warn(`- ${err.reason}: ${err.message}`);
            });
          }
        } else if (status === 429) {
          console.warn('YouTube API rate limit exceeded - need to slow down requests');
        } else if (status === 400) {
          console.warn('YouTube API bad request - check query parameters');
        }
      }

      return [];
    }
  }

  // Parse YouTube duration format (PT4M13S) to seconds
  parseDuration(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Get popular music videos using multiple search strategies
  async getPopularMusicVideos(limit = 25) {
    if (!this.hasValidApiKey) {
      console.log('🎵 No YouTube API key - using demo videos');
      return this.getDemoVideos();
    }

    try {
      const searchQueries = [
        'popular music video 2024',
        'top hits 2024 music video',
        'trending music 2024',
        'latest music videos',
        'pop music 2024',
        'chart toppers music video'
      ];

      let allVideos = [];

      for (const query of searchQueries) {
        const videos = await this.searchVideos(query, 8);
        allVideos = allVideos.concat(videos);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Remove duplicates and sort by view count
      const uniqueVideos = allVideos.filter((video, index, self) =>
        index === self.findIndex(v => v.id === video.id)
      ).sort((a, b) => b.viewCount - a.viewCount).slice(0, limit);

      console.log(`🎵 Fetched ${uniqueVideos.length} YouTube music videos`);
      return uniqueVideos;
    } catch (error) {
      console.error('Error fetching popular music videos:', error);
      return this.getDemoVideos();
    }
  }

  // Get demo video URLs for cycling through when using real YouTube metadata
  // Using reliable, accessible video sources to fix loading issues
  getDemoVideoUrls() {
    return [
      {
        url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
        fallbackUrl: 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4'
      },
      {
        url: 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4',
        fallbackUrl: 'https://vjs.zencdn.net/v/oceans.mp4'
      },
      {
        url: 'https://vjs.zencdn.net/v/oceans.mp4',
        fallbackUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
      },
      {
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        fallbackUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
      },
      {
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        fallbackUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
      },
      {
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        fallbackUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
      },
      {
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        fallbackUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
      },
      {
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        fallbackUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4'
      }
    ];
  }

  // Demo videos for when API is not available
  getDemoVideos() {
    console.log('🎵 Using demo videos (no YouTube API key configured)');
    return [
      {
        id: 'big-buck-bunny',
        title: 'Big Buck Bunny - Demo Music Video',
        artist: 'Blender Foundation',
        url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
        fallbackUrl: 'https://sample-videos.com/zip/10/mp4/360/SampleVideo_1280x720_1mb.mp4',
        thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
        duration: 596,
        type: 'html5'
      },
      {
        id: 'demo-rick-astley',
        originalYouTubeId: 'dQw4w9WgXcQ',
        title: 'Rick Astley - Never Gonna Give You Up',
        artist: 'Rick Astley',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        fallbackUrl: 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4',
        duration: 213,
        type: 'html5',
        isYouTube: false,
        usingDemoVideo: true
      },
      {
        id: 'elephant-dream',
        title: 'Elephant Dream - Musical Journey',
        artist: 'Orange Open Movie Project',
        url: 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4',
        fallbackUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
        thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
        duration: 653,
        type: 'html5'
      },
      {
        id: 'demo-despacito',
        originalYouTubeId: 'kJQP7kiw5Fk',
        title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
        artist: 'Luis Fonsi',
        thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg',
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        fallbackUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
        duration: 281,
        type: 'html5',
        isYouTube: false,
        usingDemoVideo: true
      },
      {
        id: 'for-bigger-fun',
        title: 'For Bigger Fun - Pop Hit',
        artist: 'Demo Artist',
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        fallbackUrl: 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4',
        thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg',
        duration: 60,
        type: 'html5'
      },
      {
        id: 'for-bigger-joyrides',
        title: 'For Bigger Joyrides - Rock Anthem',
        artist: 'Demo Rock Band',
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        fallbackUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
        thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
        duration: 15,
        type: 'html5'
      },
      {
        id: 'tears-of-steel',
        title: 'Tears of Steel - Emotional Ballad',
        artist: 'Blender Studio',
        url: 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4',
        fallbackUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
        thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg',
        duration: 734,
        type: 'html5'
      },
      {
        id: 'for-bigger-meltdowns',
        title: 'For Bigger Meltdowns - Dance Track',
        artist: 'Electronic Demo',
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        fallbackUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
        thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg',
        duration: 15,
        type: 'html5'
      }
    ];
  }

  // Search for a specific Billboard song video
  async searchBillboardSong(billboardSong, maxResults = 3) {
    if (!this.hasValidApiKey) {
      console.warn('No valid YouTube API key for Billboard song search');
      return [];
    }

    try {
      // Create optimized search query for Billboard song
      const query = this.createBillboardSearchQuery(billboardSong);
      console.log(`🎵 Searching YouTube for Billboard #${billboardSong.position}: ${query}`);

      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          type: 'video',
          videoCategoryId: '10', // Music category
          regionCode: 'US',
          relevanceLanguage: 'en',
          maxResults: maxResults,
          order: 'relevance',
          publishedAfter: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString(), // Last 2 years
          q: query,
          key: this.apiKey
        }
      });

      if (response.data.items && response.data.items.length > 0) {
        const videoIds = response.data.items.map(item => item.id.videoId).join(',');

        // Get detailed video information
        const detailsResponse = await axios.get(`${this.baseUrl}/videos`, {
          params: {
            part: 'snippet,contentDetails,statistics',
            id: videoIds,
            key: this.apiKey
          }
        });

        return detailsResponse.data.items
          .filter(item => {
            const viewCount = parseInt(item.statistics.viewCount || '0');
            const duration = this.parseDuration(item.contentDetails.duration);

            // More lenient filtering for Billboard songs
            return viewCount >= 5000 && // At least 5K views for Billboard tracks
                   duration >= 30 && // At least 30 seconds
                   duration <= 7200 && // Max 2 hours
                   item.snippet.liveBroadcastContent !== 'live';
          })
          .map((item, index) => {
            const duration = this.parseDuration(item.contentDetails.duration);
            const viewCount = parseInt(item.statistics.viewCount || '0');

            // Use demo videos with real YouTube metadata
            const demoVideos = this.getDemoVideoUrls();
            const videoIndex = index % demoVideos.length;
            const demoVideo = demoVideos[videoIndex];

            return {
              id: `billboard_${billboardSong.position}_${item.id}`,
              youtubeId: item.id,
              title: item.snippet.title,
              artist: item.snippet.channelTitle,
              thumbnail: item.snippet.thumbnails.maxres?.url ||
                        item.snippet.thumbnails.high?.url ||
                        item.snippet.thumbnails.medium.url,
              duration: duration,
              viewCount: viewCount,
              publishedAt: item.snippet.publishedAt,
              // Use demo video URL instead of YouTube embedding
              url: demoVideo.url,
              fallbackUrl: demoVideo.fallbackUrl,
              type: 'html5',
              isYouTube: false,
              originalYouTubeId: item.id,
              usingDemoVideo: true,
              // Billboard-specific metadata
              billboardData: {
                position: billboardSong.position,
                previousPosition: billboardSong.previousPosition,
                peakPosition: billboardSong.peakPosition,
                weeksOnChart: billboardSong.weeksOnChart,
                isNew: billboardSong.isNew,
                isRising: billboardSong.isRising,
                isFalling: billboardSong.isFalling,
                originalTitle: billboardSong.title,
                originalArtist: billboardSong.artist
              }
            };
          });
      }

      return [];
    } catch (error) {
      console.error(`YouTube search error for Billboard song "${billboardSong.title}":`, error.message);

      // Handle specific YouTube API errors for Billboard songs
      if (error.response) {
        const status = error.response.status;
        if (status === 403) {
          console.warn(`YouTube API access forbidden for Billboard song: ${billboardSong.artist} - ${billboardSong.title}`);
        } else if (status === 429) {
          console.warn('YouTube API rate limit hit during Billboard search - slowing down');
        }
      }

      return [];
    }
  }

  // Create optimized search query for Billboard songs
  createBillboardSearchQuery(billboardSong) {
    // Clean up artist and title for better search results
    const cleanTitle = billboardSong.title
      .replace(/\s*\(.*?\)\s*/g, '') // Remove parenthetical content
      .replace(/\s*\[.*?\]\s*/g, '') // Remove bracket content
      .replace(/\s+/g, ' ')
      .trim();

    const cleanArtist = billboardSong.artist
      .replace(/\s*[Ff]eaturing?\s+.*$/i, '') // Remove "featuring" parts
      .replace(/\s*[Ff]t\.?\s+.*$/i, '') // Remove "ft." parts
      .replace(/\s*[Ww]ith\s+.*$/i, '') // Remove "with" parts
      .replace(/\s*&\s+.*$/i, '') // Remove "&" parts for primary artist
      .replace(/\s+/g, ' ')
      .trim();

    return `${cleanArtist} ${cleanTitle} music video`;
  }

  // Get Billboard-enhanced popular music videos
  async getBillboardEnhancedVideos(billboardSongs, limit = 25) {
    if (!this.hasValidApiKey) {
      console.log('🎵 No YouTube API key - using demo videos with Billboard metadata');
      return this.getDemoBillboardVideos(billboardSongs);
    }

    try {
      let allVideos = [];

      // Search for Billboard songs first (priority content)
      if (billboardSongs && billboardSongs.length > 0) {
        console.log(`🎵 Searching YouTube for ${billboardSongs.length} Billboard Hot 100 songs...`);

        for (const song of billboardSongs.slice(0, Math.min(limit, 20))) {
          try {
            const videos = await this.searchBillboardSong(song, 2);
            if (videos && videos.length > 0) {
              allVideos.push(videos[0]); // Take best match
            }

            // Rate limiting delay
            await new Promise(resolve => setTimeout(resolve, 150));
          } catch (error) {
            console.warn(`Failed to find video for Billboard #${song.position}: ${song.artist} - ${song.title}`);
          }
        }
      }

      // Fill remaining slots with general popular videos if needed
      if (allVideos.length < limit) {
        const remaining = limit - allVideos.length;
        console.log(`🎵 Filling ${remaining} remaining slots with general popular videos...`);

        const generalVideos = await this.getPopularMusicVideos(remaining);
        allVideos = allVideos.concat(generalVideos);
      }

      // Remove duplicates and sort by Billboard position if available
      const uniqueVideos = allVideos.filter((video, index, self) =>
        index === self.findIndex(v => v.id === video.id)
      ).sort((a, b) => {
        // Prioritize Billboard songs by chart position
        if (a.billboardData && b.billboardData) {
          return a.billboardData.position - b.billboardData.position;
        }
        if (a.billboardData) return -1;
        if (b.billboardData) return 1;
        return b.viewCount - a.viewCount; // Fallback to view count
      }).slice(0, limit);

      console.log(`🎵 Generated ${uniqueVideos.length} Billboard-enhanced videos (${uniqueVideos.filter(v => v.billboardData).length} from Billboard Hot 100)`);
      return uniqueVideos;
    } catch (error) {
      console.error('Error fetching Billboard-enhanced videos:', error);
      return this.getDemoBillboardVideos(billboardSongs);
    }
  }

  // Demo videos with Billboard metadata when API is not available
  getDemoBillboardVideos(billboardSongs) {
    console.log('🎵 Using demo videos with Billboard Hot 100 metadata');
    const demoVideos = this.getDemoVideos();

    if (!billboardSongs || billboardSongs.length === 0) {
      return demoVideos;
    }

    // Map Billboard songs to demo videos
    return billboardSongs.slice(0, Math.min(billboardSongs.length, demoVideos.length)).map((song, index) => {
      const demoVideo = demoVideos[index % demoVideos.length];

      return {
        ...demoVideo,
        id: `billboard_demo_${song.position}`,
        title: `${song.title} - Demo Video`,
        artist: song.artist,
        // Keep demo video URL but add Billboard metadata
        billboardData: {
          position: song.position,
          previousPosition: song.previousPosition,
          peakPosition: song.peakPosition,
          weeksOnChart: song.weeksOnChart,
          isNew: song.isNew,
          isRising: song.isRising,
          isFalling: song.isFalling,
          originalTitle: song.title,
          originalArtist: song.artist
        },
        usingDemoVideo: true
      };
    });
  }

  // Check if YouTube API is available
  isAvailable() {
    return this.hasValidApiKey;
  }
}

module.exports = YouTubeService;