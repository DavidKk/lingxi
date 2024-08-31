import { IMDB_BASE_URL } from './constants'
import type { RadarrNotificationPayload, Movie, MovieFile, Release, EventType } from './types'

export function generateRadarrLink(eventType: EventType, movie: Movie) {
  const radarrBaseUrl = process.env.RADARR_SERVER_URL || ''
  if (!radarrBaseUrl) {
    return ''
  }

  switch (eventType) {
    case 'Grab':
    case 'Download':
    case 'Rename':
    case 'MovieAdded':
    case 'MovieDelete':
    case 'MovieFileDelete':
      return `${radarrBaseUrl}/movie/${movie.tmdbId}`
    case 'ManualInteractionRequired':
      return `${radarrBaseUrl}/activity/queue`
    case 'Test':
    case 'Health':
    case 'ApplicationUpdate':
    case 'HealthRestored':
    default:
      return radarrBaseUrl
  }
}

export function generateIMDbLink(movie: Movie) {
  const { imdbId } = movie
  if (!imdbId) {
    return ''
  }

  return IMDB_BASE_URL`${imdbId}`
}

export function generateNotificationMessage(payload: RadarrNotificationPayload): string {
  const { eventType, movie, movieFile } = payload
  const imdbLink = generateIMDbLink(movie)
  const radarrLink = generateRadarrLink(eventType, movie)
  const imdbLinkContent = imdbLink ? `IMDb: ${imdbLink}` : ''
  const radarrLinkContent = radarrLink ? `Radarr: ${radarrLink}` : ''
  const linkContent = [imdbLinkContent, radarrLinkContent].filter(Boolean).join('\n')

  const formatMovieInfo = (action: string) => {
    return `${action}: ${movie.title} (${movie.year})\n${linkContent}`
  }

  if (eventType === 'Grab') {
    return `Grab Notification\n${formatMovieInfo('Grab')}`
  }

  if (eventType === 'Download') {
    return `Download Notification\n${formatMovieInfo('Download')}`
  }

  if (eventType === 'ManualInteractionRequired') {
    const statusMessages = payload.downloadClient
    return `Manual Interaction Required\n${statusMessages}\n${linkContent}`
  }

  const eventDescriptions: Record<string, string> = {
    Test: `Test Notification: ${movie.title}`,
    Download: `Download Notification: ${movie.title}`,
    Rename: `Rename Notification: ${movie.title}`,
    MovieAdded: `Movie Added: ${movie.title} (Year: ${movie.year})`,
    MovieDelete: `Movie Deleted: ${movie.title}`,
    MovieFileDelete: `Movie File Deleted: ${movieFile?.relativePath}`,
    Health: `Health Check Complete. Status: Normal`,
    ApplicationUpdate: `Application Update Detected: ${payload.instanceName}`,
    HealthRestored: `Health Status Restored. Status: Normal`,
  }

  return `${eventDescriptions[eventType] || `Unknown Event Type: ${eventType}`}\n${radarrLinkContent}`
}

export function isMovie(movie: any): movie is Movie {
  return movie && typeof movie === 'object' && 'title' in movie && typeof movie.title === 'string' && 'year' in movie && typeof movie.year === 'number'
}

export function isMovieFile(movieFile: any): movieFile is MovieFile {
  return movieFile && typeof movieFile === 'object' && 'relativePath' in movieFile && typeof movieFile.relativePath === 'string'
}

export function isRelease(release: any): release is Release {
  return release && typeof release === 'object' && 'releaseTitle' in release && typeof release.releaseTitle === 'string'
}

export function validateRadarrNotificationPayload(target: any): string | true {
  if (!target || typeof target !== 'object') return 'Target is not an object'

  if (!('eventType' in target)) return 'Missing eventType'
  if (!('movie' in target)) return 'Missing movie'
  if (!('instanceName' in target)) return 'Missing instanceName'

  return true
}

export function isRadarrNotificationPayload(target: any): target is RadarrNotificationPayload {
  const validationResult = validateRadarrNotificationPayload(target)
  return validationResult === true
}
