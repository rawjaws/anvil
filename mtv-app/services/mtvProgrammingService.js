const AppleMusicService = require('./appleMusicService');
const BillboardService = require('./billboardService');

class MTVProgrammingService {
  constructor(youtubeService) {
    this.youtubeService = youtubeService;
    this.appleMusicService = new AppleMusicService();
    this.billboardService = new BillboardService();
    this.currentProgrammingBlock = null;
    this.lastProgrammingUpdate = null;
    this.programCache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  // Get current MTV programming block with day-of-week variations
  getCurrentProgrammingBlock() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday

    let block = {
      id: '',
      name: '',
      description: '',
      vibe: '',
      targetAudience: ''
    };

    // Weekend programming
    if (day === 0) { // Sunday - relaxed, family-friendly
      if (hour >= 6 && hour < 12) {
        block = {
          id: 'sunday_morning',
          name: 'Sunday Morning Vibes',
          description: 'Relaxed, uplifting music to start the day',
          vibe: 'chill_positive',
          targetAudience: 'family'
        };
      } else if (hour >= 12 && hour < 18) {
        block = {
          id: 'sunday_afternoon',
          name: 'Sunday Afternoon Mix',
          description: 'Mellow hits and feel-good classics',
          vibe: 'relaxed_nostalgic',
          targetAudience: 'general'
        };
      } else if (hour >= 18 && hour < 22) {
        block = {
          id: 'sunday_evening',
          name: 'Sunday Night Unwind',
          description: 'Smooth sounds to end the weekend',
          vibe: 'mellow_contemplative',
          targetAudience: 'adults'
        };
      } else {
        block = {
          id: 'overnight_chill',
          name: 'Late Night Chill',
          description: 'Ambient and downtempo for night owls',
          vibe: 'ambient_dreamy',
          targetAudience: 'night_owls'
        };
      }
    } else if (day === 6) { // Saturday - party and nostalgia
      if (hour >= 10 && hour < 14) {
        block = {
          id: 'saturday_hits',
          name: 'Saturday Top Hits',
          description: 'Current chart-toppers and crowd favorites',
          vibe: 'energetic_popular',
          targetAudience: 'general'
        };
      } else if (hour >= 14 && hour < 20) {
        block = {
          id: 'saturday_throwbacks',
          name: 'Saturday Throwback Party',
          description: 'Mix of current hits and throwback classics',
          vibe: 'nostalgic_party',
          targetAudience: 'millennials'
        };
      } else if (hour >= 20 && hour < 24) {
        block = {
          id: 'saturday_night',
          name: 'Saturday Night Energy',
          description: 'High-energy party anthems and dance hits',
          vibe: 'high_energy_dance',
          targetAudience: 'young_adults'
        };
      } else {
        block = {
          id: 'overnight_chill',
          name: 'Late Night Chill',
          description: 'Chill vibes for the late night crowd',
          vibe: 'ambient_dreamy',
          targetAudience: 'night_owls'
        };
      }
    } else if (day === 5 && hour >= 18) { // Friday evening - party time
      block = {
        id: 'friday_party',
        name: 'Friday Night Kickoff',
        description: 'High-energy hits to start the weekend',
        vibe: 'party_celebration',
        targetAudience: 'working_professionals'
      };
    } else {
      // Weekday programming blocks
      if (hour >= 6 && hour < 10) {
        block = {
          id: 'morning_hits',
          name: 'Wake Up STV',
          description: 'Upbeat pop hits and dance music to start your day',
          vibe: 'energetic_uplifting',
          targetAudience: 'getting_ready'
        };
      } else if (hour >= 10 && hour < 14) {
        block = {
          id: 'midday_mainstream',
          name: 'STV Hits',
          description: 'Current top 40 and mainstream pop/rock',
          vibe: 'mainstream_popular',
          targetAudience: 'general'
        };
      } else if (hour >= 14 && hour < 18) {
        block = {
          id: 'afternoon_youth',
          name: 'After School',
          description: 'Youth-oriented pop punk and alternative',
          vibe: 'alternative_rebellious',
          targetAudience: 'teens_young_adults'
        };
      } else if (hour >= 18 && hour < 21) {
        block = {
          id: 'primetime_popular',
          name: 'Prime Time Hits',
          description: 'Popular music across all genres',
          vibe: 'diverse_popular',
          targetAudience: 'family_viewing'
        };
      } else if (hour >= 21 && hour < 24) {
        block = {
          id: 'late_night_alternative',
          name: 'STV Alternative',
          description: 'Alternative, indie, and hip-hop',
          vibe: 'alternative_underground',
          targetAudience: 'young_adults'
        };
      } else {
        block = {
          id: 'overnight_chill',
          name: 'Late Night STV',
          description: 'Chill, ambient, and slower tempo',
          vibe: 'ambient_contemplative',
          targetAudience: 'night_owls'
        };
      }
    }

    this.currentProgrammingBlock = block;
    return block;
  }

  // Generate search queries based on programming block
  generateSearchQueries(programmingBlock) {
    const baseQueries = {
      morning_hits: [
        'upbeat pop music video 2024',
        'dance hits 2024 music video',
        'energetic morning songs 2024',
        'feel good pop songs 2024'
      ],
      midday_mainstream: [
        'top 40 hits 2024 music video',
        'mainstream pop 2024',
        'popular rock songs 2024',
        'current hits music video'
      ],
      afternoon_youth: [
        'alternative rock 2024 music video',
        'pop punk 2024',
        'indie music video 2024',
        'young adult hits 2024'
      ],
      primetime_popular: [
        'popular music video 2024',
        'chart topping songs 2024',
        'mainstream hits 2024',
        'family friendly music 2024'
      ],
      late_night_alternative: [
        'alternative music video 2024',
        'indie rock 2024',
        'hip hop music video 2024',
        'underground music 2024'
      ],
      overnight_chill: [
        'chill music video 2024',
        'ambient music 2024',
        'relaxing songs 2024',
        'late night vibes music'
      ],
      friday_party: [
        'party anthems 2024 music video',
        'weekend hits 2024',
        'club music 2024',
        'celebration songs 2024'
      ],
      saturday_hits: [
        'saturday party music 2024',
        'weekend anthems music video',
        'feel good hits 2024'
      ],
      saturday_throwbacks: [
        'throwback hits music video',
        '2010s hits music video',
        'nostalgic party songs',
        'classic party anthems'
      ],
      saturday_night: [
        'saturday night party 2024',
        'high energy dance music',
        'club bangers 2024 music video'
      ],
      sunday_morning: [
        'sunday morning music 2024',
        'peaceful music video',
        'uplifting songs 2024'
      ],
      sunday_afternoon: [
        'sunday vibes music 2024',
        'feel good classics',
        'relaxed hits music video'
      ],
      sunday_evening: [
        'sunday evening music 2024',
        'mellow hits 2024',
        'contemplative music video'
      ]
    };

    return baseQueries[programmingBlock.id] || baseQueries['midday_mainstream'];
  }

  // Get programming-appropriate content from Billboard + Apple Music + YouTube
  async getProgrammingContent(limit = 20) {
    const programmingBlock = this.getCurrentProgrammingBlock();

    console.log(`📺 STV Programming: ${programmingBlock.name} (${programmingBlock.description})`);

    // Check cache first
    const cacheKey = `${programmingBlock.id}_${Math.floor(Date.now() / this.cacheExpiry)}`;
    if (this.programCache.has(cacheKey)) {
      console.log('📺 Using cached programming content');
      return this.programCache.get(cacheKey);
    }

    let content = [];

    // Priority 1: Try to get content from Billboard Hot 100 first
    try {
      if (await this.billboardService.isAvailable()) {
        console.log('📊 Fetching Billboard Hot 100 songs...');
        const billboardSongs = await this.billboardService.getSongsForProgrammingBlock(programmingBlock.id, Math.min(limit, 15));

        if (billboardSongs && billboardSongs.length > 0) {
          console.log(`📊 Found ${billboardSongs.length} Billboard Hot 100 songs for ${programmingBlock.name}`);

          // Use YouTube service's Billboard-enhanced method
          const billboardVideos = await this.youtubeService.getBillboardEnhancedVideos(billboardSongs, Math.min(limit, 15));

          for (const video of billboardVideos) {
            video.programmingBlock = programmingBlock;
            content.push(video);
          }

          console.log(`📊 Successfully integrated ${content.length} Billboard-based videos`);
        }
      }
    } catch (error) {
      console.warn('Billboard integration failed:', error.message);
    }

    // Priority 2: Fill remaining slots with Apple Music if available
    if (content.length < limit) {
      try {
        if (this.appleMusicService.isAvailable()) {
          console.log('🎵 Filling remaining slots with Apple Music...');
          const appleMusicSongs = await this.appleMusicService.getTrendingSongsForMTV(programmingBlock.id);

          if (appleMusicSongs && appleMusicSongs.length > 0) {
            const remaining = limit - content.length;
            console.log(`🎵 Found ${appleMusicSongs.length} Apple Music songs, adding ${remaining} more videos`);

            // Convert Apple Music songs to YouTube videos
            for (const song of appleMusicSongs.slice(0, Math.min(remaining, 10))) {
              try {
                const searchQuery = this.appleMusicService.songToYouTubeQuery(song);
                const youtubeVideos = await this.youtubeService.searchVideos(searchQuery, 3);

                if (youtubeVideos && youtubeVideos.length > 0) {
                  const video = youtubeVideos[0];
                  video.appleMusicData = song;
                  video.programmingBlock = programmingBlock;
                  content.push(video);

                  // Small delay to avoid rate limiting
                  await new Promise(resolve => setTimeout(resolve, 100));
                }
              } catch (error) {
                console.warn(`Failed to find YouTube video for ${song.artist} - ${song.title}`);
              }
            }
          }
        }
      } catch (error) {
        console.warn('Apple Music integration failed:', error.message);
      }
    }

    // Priority 3: Fill remaining slots with YouTube search or demo videos
    if (content.length < limit) {
      console.log('🔍 Filling remaining slots with YouTube search...');

      let youtubeSearchSuccessful = false;

      if (this.youtubeService.isAvailable()) {
        const searchQueries = this.generateSearchQueries(programmingBlock);
        const remaining = limit - content.length;

        for (const query of searchQueries) {
          if (content.length >= limit) break;

          try {
            const youtubeVideos = await this.youtubeService.searchVideos(query, 5);

            if (youtubeVideos && youtubeVideos.length > 0) {
              youtubeSearchSuccessful = true;
              for (const video of youtubeVideos) {
                if (content.length >= limit) break;

                // Avoid duplicates
                if (!content.find(v => v.id === video.id)) {
                  video.programmingBlock = programmingBlock;
                  content.push(video);
                }
              }
            }

            // Small delay between searches
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            console.warn(`Failed YouTube search for: ${query}`, error.message);
          }
        }
      }

      // If YouTube API is not available OR no videos were found, use demo videos
      if (!this.youtubeService.isAvailable() || (!youtubeSearchSuccessful && content.length < limit)) {
        // Use demo videos when YouTube API is not available or quota exceeded
        console.log('🎵 YouTube API failed or quota exceeded - using demo videos with real metadata...');
        const remaining = limit - content.length;

        // If we have Billboard data but no YouTube API, use Billboard-enhanced demo videos
        if (content.length === 0) {
          try {
            const billboardSongs = await this.billboardService.getSongsForProgrammingBlock(programmingBlock.id, remaining);
            if (billboardSongs && billboardSongs.length > 0) {
              const billboardDemoVideos = this.youtubeService.getDemoBillboardVideos(billboardSongs);
              for (const video of billboardDemoVideos) {
                video.programmingBlock = programmingBlock;
                content.push(video);
              }
            }
          } catch (error) {
            console.warn('Failed to get Billboard demo videos:', error.message);
          }
        }

        // Fill any remaining slots with regular demo videos
        if (content.length < limit) {
          const demoVideos = this.youtubeService.getDemoVideos();
          for (const video of demoVideos) {
            if (content.length >= limit) break;
            video.programmingBlock = programmingBlock;
            content.push(video);
          }
        }
      }
    }

    // Add programming block info to all videos
    content.forEach(video => {
      video.mtvProgramming = {
        block: programmingBlock,
        scheduledAt: new Date(),
        source: video.billboardData ? 'billboard_hot_100' :
                video.appleMusicData ? 'apple_music' :
                'youtube_search'
      };
    });

    // Cache the results
    this.programCache.set(cacheKey, content);

    // Clean old cache entries
    this.cleanCache();

    const billboardCount = content.filter(v => v.billboardData).length;
    const appleMusicCount = content.filter(v => v.appleMusicData).length;
    const youtubeCount = content.length - billboardCount - appleMusicCount;

    console.log(`📺 Generated ${content.length} videos for ${programmingBlock.name}:`);
    console.log(`   📊 ${billboardCount} from Billboard Hot 100`);
    console.log(`   🎵 ${appleMusicCount} from Apple Music`);
    console.log(`   🔍 ${youtubeCount} from YouTube search/demo`);

    return content;
  }

  // Clean expired cache entries
  cleanCache() {
    const currentTime = Date.now();
    for (const [key, value] of this.programCache.entries()) {
      const [, timestamp] = key.split('_');
      if (currentTime - parseInt(timestamp) * this.cacheExpiry > this.cacheExpiry) {
        this.programCache.delete(key);
      }
    }
  }

  // Check if programming block has changed
  shouldUpdateProgramming() {
    const currentBlock = this.getCurrentProgrammingBlock();

    if (!this.lastProgrammingUpdate ||
        !this.currentProgrammingBlock ||
        this.currentProgrammingBlock.id !== currentBlock.id) {
      this.lastProgrammingUpdate = Date.now();
      return true;
    }

    return false;
  }

  // Get next programming block info
  getNextProgrammingBlock() {
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);

    // Temporarily set time to next hour to get next block
    const originalHour = now.getHours();
    nextHour.setHours(nextHour.getHours());

    // Mock the time for calculation
    const originalGetHours = Date.prototype.getHours;
    const nextHourValue = originalGetHours.call(nextHour);
    Date.prototype.getHours = function() {
      return nextHourValue;
    };

    const nextBlock = this.getCurrentProgrammingBlock();

    // Restore original method
    Date.prototype.getHours = originalGetHours;

    return nextBlock;
  }

  // Get programming schedule for display
  getProgrammingSchedule() {
    const schedule = [];
    const today = new Date();

    for (let hour = 0; hour < 24; hour++) {
      const timeSlot = new Date(today);
      timeSlot.setHours(hour, 0, 0, 0);

      // Mock the time to get programming block
      const originalGetHours = Date.prototype.getHours;
      Date.prototype.getHours = function() { return hour; };

      const block = this.getCurrentProgrammingBlock();

      Date.prototype.getHours = originalGetHours;

      schedule.push({
        time: timeSlot.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        block: block
      });
    }

    return schedule;
  }
}

module.exports = MTVProgrammingService;