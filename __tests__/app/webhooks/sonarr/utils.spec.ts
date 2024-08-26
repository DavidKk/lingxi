import {
  generateSonarrLink,
  generateIMDbLink,
  generateNotificationMessage,
  isSeries,
  isEpisode,
  isDownloadInfo,
  isDownloadStatusMessage,
  isRelease,
  validateSonarrNotificationPayload,
  isSonarrNotificationPayload,
  isGrabPayload,
  isDownloadPayload,
  isManualInteractionRequiredPayload,
} from '@/app/webhooks/sonarr/utils'
import type { SonarrNotificationPayload, Series, Episode, DownloadInfo, DownloadStatusMessage, Release, EventType } from '@/app/webhooks/sonarr/types'

describe('generateSonarrLink', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  const series: Series = {
    id: 1,
    tvdbId: 12345,
    title: 'Breaking Bad',
    titleSlug: 'breaking-bad',
    year: 2008,
  } as Series

  test('should generate correct link for specific events', () => {
    process.env.SONARR_SERVER_URL = 'http://localhost:8989'
    const link = generateSonarrLink('Download', series)
    expect(link).toBe('http://localhost:8989/series/breaking-bad')
  })

  test('should return base URL for default events', () => {
    process.env.SONARR_SERVER_URL = 'http://localhost:8989'
    const link = generateSonarrLink('Test', series)
    expect(link).toBe('http://localhost:8989')
  })

  test('should return empty string when SONARR_SERVER_URL is not set', () => {
    process.env.SONARR_SERVER_URL = undefined
    const link = generateSonarrLink('Download', series)
    expect(link).toBe('')
  })
})

describe('generateIMDbLink', () => {
  test('should generate correct TMDB link', () => {
    const series = { imdbId: 'tt550' } as Series
    const link = generateIMDbLink(series)
    expect(link).toBe('https://www.imdb.com/title/tt550')
  })

  test('should return empty string when tmdbId is missing', () => {
    const series: Series = {} as Series
    const link = generateIMDbLink(series)
    expect(link).toBe('')
  })
})

describe('generateNotificationMessage', () => {
  beforeEach(() => {
    process.env.SONARR_SERVER_URL = 'http://localhost:8989'
  })

  const series = {
    id: 1,
    tvdbId: 550,
    imdbId: 'tt550',
    title: 'Breaking Bad',
    titleSlug: 'breaking-bad',
    year: 2008,
  } as Series

  const episode: Episode = {
    id: 1,
    episodeNumber: 1,
    seasonNumber: 1,
    title: 'Pilot',
    airDate: '',
    airDateUtc: '',
    seriesId: 0,
    tvdbId: 0,
  }

  const payloadBase: Partial<SonarrNotificationPayload> = {
    series,
    episodes: [episode],
    instanceName: 'SonarrInstance',
  }

  test('should generate grab notification message', () => {
    const payload: SonarrNotificationPayload = {
      ...payloadBase,
      eventType: 'Grab',
    } as SonarrNotificationPayload

    const message = generateNotificationMessage(payload)
    expect(message).toContain('Grab Notification')
    expect(message).toContain('Breaking Bad(Season 1, Episode 1)')
    expect(message).toContain('IMDb: https://www.imdb.com/title/tt550')
    expect(message).toContain('Sonarr: http://localhost:8989/series/breaking-bad')
  })

  test('should generate download notification message', () => {
    const payload: SonarrNotificationPayload = {
      ...payloadBase,
      eventType: 'Download',
    } as SonarrNotificationPayload

    const message = generateNotificationMessage(payload)
    expect(message).toContain('Download Notification')
    expect(message).toContain('Breaking Bad(Season 1, Episode 1)')
  })

  test('should generate manual interaction required message', () => {
    const payload: SonarrNotificationPayload = {
      ...payloadBase,
      eventType: 'ManualInteractionRequired',
      downloadStatusMessages: [{ title: 'Error', messages: ['Failed to download'] }],
    } as SonarrNotificationPayload

    const message = generateNotificationMessage(payload)
    expect(message).toContain('Manual Interaction Required')
    expect(message).toContain('Error: Failed to download')
    expect(message).toContain('activity/queue')
  })

  test('should handle unknown event types gracefully', () => {
    const payload: SonarrNotificationPayload = {
      ...payloadBase,
      eventType: 'UnknownEvent' as EventType,
    } as SonarrNotificationPayload

    const message = generateNotificationMessage(payload)
    expect(message).toContain('Unknown Event Type: UnknownEvent')
  })
})

describe('isSeries', () => {
  test('should return true for valid Series object', () => {
    const series: Series = {
      title: 'Game of Thrones',
      year: 2011,
    } as Series
    expect(isSeries(series)).toBe(true)
  })

  test('should return false for invalid Series object', () => {
    const invalidSeries = {
      name: 'Game of Thrones',
      releaseYear: 2011,
    }
    expect(isSeries(invalidSeries)).toBe(false)
  })
})

describe('isEpisode', () => {
  test('should return true for valid Episode object', () => {
    const episode: Episode = {
      seasonNumber: 1,
      episodeNumber: 1,
    } as Episode
    expect(isEpisode(episode)).toBe(true)
  })

  test('should return false for invalid Episode object', () => {
    const invalidEpisode = {
      season: 1,
      episode: 1,
    }
    expect(isEpisode(invalidEpisode)).toBe(false)
  })
})

describe('isDownloadInfo', () => {
  test('should return true for valid DownloadInfo object', () => {
    const downloadInfo: DownloadInfo = {
      title: 'Game.of.Thrones.S01E01.1080p.BluRay.x264',
      quality: '1080p',
    } as DownloadInfo
    expect(isDownloadInfo(downloadInfo)).toBe(true)
  })

  test('should return false for invalid DownloadInfo object', () => {
    const invalidDownloadInfo = {
      fileName: 'Game.of.Thrones.S01E01.1080p.BluRay.x264',
      resolution: '1080p',
    }
    expect(isDownloadInfo(invalidDownloadInfo)).toBe(false)
  })
})

describe('isDownloadStatusMessage', () => {
  test('should return true for valid DownloadStatusMessage object', () => {
    const message: DownloadStatusMessage = {
      title: 'Error',
      messages: ['File missing', 'Download failed'],
    } as DownloadStatusMessage
    expect(isDownloadStatusMessage(message)).toBe(true)
  })

  test('should return false for invalid DownloadStatusMessage object', () => {
    const invalidMessage = {
      errorTitle: 'Error',
      errorMessages: ['File missing', 'Download failed'],
    }
    expect(isDownloadStatusMessage(invalidMessage)).toBe(false)
  })
})

describe('isRelease', () => {
  test('should return true for valid Release object', () => {
    const release: Release = {
      releaseTitle: 'Game.of.Thrones.S01E01.1080p.BluRay.x264',
    } as Release
    expect(isRelease(release)).toBe(true)
  })

  test('should return false for invalid Release object', () => {
    const invalidRelease = {
      title: 'Game.of.Thrones.S01E01.1080p.BluRay.x264',
    }
    expect(isRelease(invalidRelease)).toBe(false)
  })
})

describe('validateSonarrNotificationPayload', () => {
  const series: Series = {
    title: 'Stranger Things',
    year: 2016,
  } as Series

  const episodes: Episode[] = [
    {
      seasonNumber: 1,
      episodeNumber: 1,
      title: 'Chapter One: The Vanishing of Will Byers',
      id: 0,
      airDate: '',
      airDateUtc: '',
      seriesId: 0,
      tvdbId: 0,
    },
  ]

  test('should return true for valid payload', () => {
    const payload: SonarrNotificationPayload = {
      eventType: 'Download',
      series,
      episodes,
      instanceName: 'SonarrInstance',
    } as SonarrNotificationPayload

    const result = validateSonarrNotificationPayload(payload)
    expect(result).toBe(true)
  })

  test('should return error message when eventType is missing', () => {
    const payload = {
      series,
      episodes,
      instanceName: 'SonarrInstance',
    }
    const result = validateSonarrNotificationPayload(payload)
    expect(result).toBe('Missing eventType')
  })

  test('should return error message when series is missing', () => {
    const payload = {
      eventType: 'Download',
      episodes,
      instanceName: 'SonarrInstance',
    }
    const result = validateSonarrNotificationPayload(payload)
    expect(result).toBe('Missing series')
  })

  test('should return error message when episodes array is missing', () => {
    const payload = {
      eventType: 'Download',
      series,
      instanceName: 'SonarrInstance',
    }
    const result = validateSonarrNotificationPayload(payload)
    expect(result).toBe('Missing episodes')
  })
})

describe('isSonarrNotificationPayload', () => {
  test('should return true for valid SonarrNotificationPayload object', () => {
    const payload: SonarrNotificationPayload = {
      eventType: 'Download',
      instanceName: '',
      series: {
        title: 'Breaking Bad',
        id: 0,
        titleSlug: '',
        path: '',
        tvdbId: 0,
        tvMazeId: 0,
        tmdbId: 0,
        imdbId: '',
        type: '',
        year: 0,
        genres: [],
        images: [],
        tags: [],
      },
      episodes: [
        {
          seasonNumber: 1,
          episodeNumber: 1,
          id: 0,
          title: '',
          airDate: '',
          airDateUtc: '',
          seriesId: 0,
          tvdbId: 0,
        },
      ],
    }

    expect(isSonarrNotificationPayload(payload)).toBe(true)
  })

  test('should return false for invalid SonarrNotificationPayload object', () => {
    const invalidPayload = {
      event: 'Download',
      series: {
        name: 'Breaking Bad',
      },
      episodes: [
        {
          season: 1,
          episode: 1,
        },
      ],
    }

    expect(isSonarrNotificationPayload(invalidPayload)).toBe(false)
  })
})

describe('isGrabPayload', () => {
  test('should return true for Grab eventType', () => {
    const payload: SonarrNotificationPayload = {
      eventType: 'Grab',
    } as SonarrNotificationPayload
    expect(isGrabPayload(payload)).toBe(true)
  })

  test('should return false for non-Grab eventType', () => {
    const payload: SonarrNotificationPayload = {
      eventType: 'Download',
    } as SonarrNotificationPayload
    expect(isGrabPayload(payload)).toBe(false)
  })
})

describe('isDownloadPayload', () => {
  test('should return true for Download eventType', () => {
    const payload: SonarrNotificationPayload = {
      eventType: 'Download',
    } as SonarrNotificationPayload
    expect(isDownloadPayload(payload)).toBe(true)
  })

  test('should return false for non-Download eventType', () => {
    const payload: SonarrNotificationPayload = {
      eventType: 'Grab',
    } as SonarrNotificationPayload
    expect(isDownloadPayload(payload)).toBe(false)
  })
})

describe('isManualInteractionRequiredPayload', () => {
  test('should return true for ManualInteractionRequired eventType', () => {
    const payload: SonarrNotificationPayload = {
      eventType: 'ManualInteractionRequired',
    } as SonarrNotificationPayload
    expect(isManualInteractionRequiredPayload(payload)).toBe(true)
  })

  test('should return false for non-ManualInteractionRequired eventType', () => {
    const payload: SonarrNotificationPayload = {
      eventType: 'Download',
    } as SonarrNotificationPayload
    expect(isManualInteractionRequiredPayload(payload)).toBe(false)
  })
})
