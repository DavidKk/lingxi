import { IMDB_BASE_URL } from './constants'
import type {
  SonarrNotificationPayload,
  Series,
  Episode,
  DownloadInfo,
  DownloadStatusMessage,
  Release,
  EventType,
  GrabPayload,
  DownloadPayload,
  ManualInteractionRequiredPayload,
} from './types'

export function generateSonarrLink(eventType: EventType, series: Series) {
  const sonarrBaseUrl = process.env.SONARR_SERVER_URL || ''
  if (!sonarrBaseUrl) {
    return ''
  }

  switch (eventType) {
    case 'Grab':
    case 'Download':
    case 'Rename':
    case 'SeriesAdd':
    case 'SeriesDelete':
    case 'EpisodeFileDelete':
      return `${sonarrBaseUrl}/series/${series.titleSlug}`
    case 'ManualInteractionRequired':
      return `${sonarrBaseUrl}/activity/queue`
    case 'Test':
    case 'Health':
    case 'ApplicationUpdate':
    case 'HealthRestored':
    default:
      return sonarrBaseUrl
  }
}

export function generateIMDbLink(series: Series) {
  const { imdbId } = series
  if (!imdbId) {
    return ''
  }

  return IMDB_BASE_URL`${imdbId}`
}

export function generateNotificationMessage(payload: SonarrNotificationPayload): string {
  const { eventType, series, episodes } = payload
  const imdbLink = generateIMDbLink(series)
  const sonarrLink = generateSonarrLink(eventType, series)
  const imdbLinkContent = imdbLink ? `IMDb: ${imdbLink}` : ''
  const sonarrLinkContent = sonarrLink ? `Sonarr: ${sonarrLink}` : ''
  const linkContent = [imdbLinkContent, sonarrLinkContent].filter(Boolean).join('\n')

  const formatEpisodeInfo = (episodes: Episode[]) => {
    if (!episodes?.length) {
      return ''
    }

    return `(Season ${episodes[0].seasonNumber}, Episode ${episodes[0].episodeNumber})`
  }

  const formatSeriesInfo = (action: string) => {
    return `${action}: ${series.title}${formatEpisodeInfo(episodes)}\n${linkContent}`
  }

  if (isGrabPayload(payload)) {
    return `Grab Notification\n${formatSeriesInfo('Grab')}`
  }

  if (isDownloadPayload(payload)) {
    return `Download Notification\n${formatSeriesInfo('Download')}`
  }

  if (isManualInteractionRequiredPayload(payload)) {
    const statusMessages = payload.downloadStatusMessages.map((msg) => `${msg.title}: ${msg.messages.join(', ')}`).join('\n')
    return `Manual Interaction Required\n${statusMessages}\n${linkContent}`
  }

  const eventDescriptions: Record<string, string> = {
    Test: `Test Notification: ${series.title}`,
    Download: `Download Notification: ${series.title}`,
    Rename: `Rename Notification: ${series.title}`,
    SeriesAdd: `Series Added: ${series.title} (Year: ${series.year})`,
    SeriesDelete: `Series Deleted: ${series.title}`,
    EpisodeFileDelete: `Episode File Deleted: ${episodes[0]?.title}${formatEpisodeInfo(episodes)}`,
    Health: `Health Check Complete. Status: Normal`,
    ApplicationUpdate: `Application Update Detected: ${payload.instanceName}`,
    HealthRestored: `Health Status Restored. Status: Normal`,
  }

  return `${eventDescriptions[eventType] || `Unknown Event Type: ${eventType}`}\n${sonarrLinkContent}`
}

export function isSeries(series: any): series is Series {
  return series && typeof series === 'object' && 'title' in series && typeof series.title === 'string' && 'year' in series && typeof series.year === 'number'
}

export function isEpisode(episode: any): episode is Episode {
  return (
    episode &&
    typeof episode === 'object' &&
    'seasonNumber' in episode &&
    typeof episode.seasonNumber === 'number' &&
    'episodeNumber' in episode &&
    typeof episode.episodeNumber === 'number'
  )
}

export function isDownloadInfo(downloadInfo: any): downloadInfo is DownloadInfo {
  return (
    downloadInfo &&
    typeof downloadInfo === 'object' &&
    'title' in downloadInfo &&
    typeof downloadInfo.title === 'string' &&
    'quality' in downloadInfo &&
    typeof downloadInfo.quality === 'string'
  )
}

export function isDownloadStatusMessage(message: any): message is DownloadStatusMessage {
  return message && typeof message === 'object' && 'title' in message && typeof message.title === 'string' && 'messages' in message && Array.isArray(message.messages)
}

export function isRelease(release: any): release is Release {
  return release && typeof release === 'object' && 'releaseTitle' in release && typeof release.releaseTitle === 'string'
}

export function validateSonarrNotificationPayload(target: any): string | true {
  if (!target || typeof target !== 'object') return 'Target is not an object'

  if (!('eventType' in target)) return 'Missing eventType'
  if (!('series' in target)) return 'Missing series'
  if (!('episodes' in target)) return 'Missing episodes'
  if (!('instanceName' in target)) return 'Missing instanceName'

  return true
}

export function isSonarrNotificationPayload(target: any): target is SonarrNotificationPayload {
  const validationResult = validateSonarrNotificationPayload(target)
  return validationResult === true
}

export function isGrabPayload(payload: SonarrNotificationPayload): payload is GrabPayload {
  return payload.eventType === 'Grab'
}

export function isDownloadPayload(payload: SonarrNotificationPayload): payload is DownloadPayload {
  return payload.eventType === 'Download'
}

export function isManualInteractionRequiredPayload(payload: SonarrNotificationPayload): payload is ManualInteractionRequiredPayload {
  return payload.eventType === 'ManualInteractionRequired'
}
