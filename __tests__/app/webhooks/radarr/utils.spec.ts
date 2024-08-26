import {
  generateRadarrLink,
  generateIMDbLink,
  generateNotificationMessage,
  isMovie,
  isMovieFile,
  isRelease,
  validateRadarrNotificationPayload,
  isRadarrNotificationPayload,
} from '@/app/webhooks/radarr/utils'
import type { RadarrNotificationPayload, Movie, MovieFile, Release, EventType } from '@/app/webhooks/radarr/types'

describe('generateRadarrLink', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  const movie: Movie = {
    id: 1,
    tmdbId: 12345,
    title: 'Inception',
    titleSlug: 'inception',
    year: 2010,
    // 其他必要的字段...
  } as Movie

  test('should generate correct link for specific events', () => {
    process.env.RADARR_SERVER_URL = 'http://localhost:7878'
    const link = generateRadarrLink('Download', movie)
    expect(link).toBe('http://localhost:7878/movie/12345')
  })

  test('should return base URL for default events', () => {
    process.env.RADARR_SERVER_URL = 'http://localhost:7878'
    const link = generateRadarrLink('Test', movie)
    expect(link).toBe('http://localhost:7878')
  })

  test('should return empty string when RADARR_SERVER_URL is not set', () => {
    process.env.RADARR_SERVER_URL = undefined
    const link = generateRadarrLink('Download', movie)
    expect(link).toBe('')
  })
})

describe('generateIMDbLink', () => {
  test('should generate correct TMDB link', () => {
    const movie = { imdbId: 'tt550' } as Movie
    const link = generateIMDbLink(movie)
    expect(link).toBe('https://www.imdb.com/title/tt550')
  })

  test('should return empty string when tmdbId is missing', () => {
    const movie: Movie = {} as Movie
    const link = generateIMDbLink(movie)
    expect(link).toBe('')
  })
})

describe('generateNotificationMessage', () => {
  beforeEach(() => {
    process.env.RADARR_SERVER_URL = 'http://localhost:7878'
  })

  const movie = {
    id: 1,
    tmdbId: 550,
    imdbId: 'tt550',
    title: 'Fight Club',
    year: 1999,
  } as Movie

  const payloadBase: Partial<RadarrNotificationPayload> = {
    movie,
    instanceName: 'RadarrInstance',
    applicationUrl: 'http://localhost:7878',
  }

  test('should generate grab notification message', () => {
    const payload: RadarrNotificationPayload = {
      ...payloadBase,
      eventType: 'Grab',
    } as RadarrNotificationPayload

    const message = generateNotificationMessage(payload)
    expect(message).toContain('Grab Notification')
    expect(message).toContain('Fight Club (1999)')
    expect(message).toContain('IMDb: https://www.imdb.com/title/tt550')
    expect(message).toContain('Radarr: http://localhost:7878/movie/550')
  })

  test('should generate download notification message', () => {
    const payload: RadarrNotificationPayload = {
      ...payloadBase,
      eventType: 'Download',
    } as RadarrNotificationPayload

    const message = generateNotificationMessage(payload)
    expect(message).toContain('Download Notification')
    expect(message).toContain('Fight Club (1999)')
  })

  test('should generate manual interaction required message', () => {
    const payload: RadarrNotificationPayload = {
      ...payloadBase,
      eventType: 'ManualInteractionRequired',
      downloadClient: 'Transmission',
    } as RadarrNotificationPayload

    const message = generateNotificationMessage(payload)
    expect(message).toContain('Manual Interaction Required')
    expect(message).toContain('Transmission')
    expect(message).toContain('activity/queue')
  })

  test('should handle unknown event types gracefully', () => {
    const payload: RadarrNotificationPayload = {
      ...payloadBase,
      eventType: 'UnknownEvent' as EventType,
    } as RadarrNotificationPayload

    const message = generateNotificationMessage(payload)
    expect(message).toContain('Unknown Event Type: UnknownEvent')
  })
})

describe('isMovie', () => {
  test('should return true for valid Movie object', () => {
    const movie: Movie = {
      title: 'Interstellar',
      year: 2014,
      // 其他必要的字段...
    } as Movie
    expect(isMovie(movie)).toBe(true)
  })

  test('should return false for invalid Movie object', () => {
    const invalidMovie = {
      name: 'Interstellar',
      releaseYear: 2014,
    }
    expect(isMovie(invalidMovie)).toBe(false)
  })
})

describe('isMovieFile', () => {
  test('should return true for valid MovieFile object', () => {
    const movieFile: MovieFile = {
      id: 1,
      relativePath: '/movies/interstellar.mkv',
      // 其他必要的字段...
    } as MovieFile
    expect(isMovieFile(movieFile)).toBe(true)
  })

  test('should return false for invalid MovieFile object', () => {
    const invalidMovieFile = {
      path: '/movies/interstellar.mkv',
    }
    expect(isMovieFile(invalidMovieFile)).toBe(false)
  })
})

describe('isRelease', () => {
  test('should return true for valid Release object', () => {
    const release: Release = {
      releaseTitle: 'Interstellar.2014.1080p.BluRay.x264',
      // 其他必要的字段...
    } as Release
    expect(isRelease(release)).toBe(true)
  })

  test('should return false for invalid Release object', () => {
    const invalidRelease = {
      title: 'Interstellar.2014.1080p.BluRay.x264',
    }
    expect(isRelease(invalidRelease)).toBe(false)
  })
})

describe('validateRadarrNotificationPayload', () => {
  const movie: Movie = {
    title: 'The Matrix',
    year: 1999,
    // 其他必要的字段...
  } as Movie

  test('should return true for valid payload', () => {
    const payload: RadarrNotificationPayload = {
      eventType: 'Download',
      movie,
      instanceName: 'RadarrInstance',
      applicationUrl: 'http://localhost:7878',
    } as RadarrNotificationPayload

    const result = validateRadarrNotificationPayload(payload)
    expect(result).toBe(true)
  })

  test('should return error message when eventType is missing', () => {
    const payload = {
      movie,
      instanceName: 'RadarrInstance',
    }
    const result = validateRadarrNotificationPayload(payload)
    expect(result).toBe('Missing eventType')
  })

  test('should return error message when movie is missing', () => {
    const payload = {
      eventType: 'Download',
      instanceName: 'RadarrInstance',
    }
    const result = validateRadarrNotificationPayload(payload)
    expect(result).toBe('Missing movie')
  })
})

describe('isRadarrNotificationPayload', () => {
  const movie: Movie = {
    title: 'The Godfather',
    year: 1972,
    // 其他必要的字段...
  } as Movie

  test('should return true for valid RadarrNotificationPayload payload', () => {
    const payload: RadarrNotificationPayload = {
      eventType: 'MovieAdded',
      movie,
      instanceName: 'RadarrInstance',
      applicationUrl: 'http://localhost:7878',
    } as RadarrNotificationPayload

    expect(isRadarrNotificationPayload(payload)).toBe(true)
  })

  test('should return false for invalid RadarrNotificationPayload payload', () => {
    const invalidPayload = {
      eventType: 'MovieAdded',
      instanceName: 'RadarrInstance',
    }
    expect(isRadarrNotificationPayload(invalidPayload)).toBe(false)
  })
})
