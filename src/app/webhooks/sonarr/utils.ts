import { THE_TVDB_SERIES_BASE_URL } from './constants'
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

export function generateTvdbLink(series: Series) {
  const { titleSlug } = series
  if (!titleSlug) {
    return ''
  }

  return `${THE_TVDB_SERIES_BASE_URL}/${titleSlug}`
}

export function generateNotificationMessage(payload: SonarrNotificationPayload): string {
  const { eventType, series, episodes } = payload
  const tvdbLink = generateTvdbLink(series)
  const sonarrLink = generateSonarrLink(eventType, series)
  const tvdbLinkContent = tvdbLink ? `TVDB: ${tvdbLink}` : ''
  const sonarrLinkContent = sonarrLink ? `Sonarr: ${sonarrLink}` : ''
  const linkContent = [tvdbLinkContent, sonarrLinkContent].filter(Boolean).join('\n')

  const formatEpisodeInfo = (episodes: Episode[]) => {
    if (!episodes?.length) {
      return ''
    }

    return `（第 ${episodes[0].seasonNumber} 季，第 ${episodes[0].episodeNumber} 集）`
  }

  const formatSeriesInfo = (action: string) => {
    return `${action}: ${series.title}${formatEpisodeInfo(episodes)}\n${linkContent}`
  }

  if (isGrabPayload(payload)) {
    return `抓取通知\n${formatSeriesInfo('抓取')}`
  }

  if (isDownloadPayload(payload)) {
    return `下载通知\n${formatSeriesInfo('下载')}`
  }

  if (isManualInteractionRequiredPayload(payload)) {
    const statusMessages = payload.downloadStatusMessages.map((msg) => `${msg.title}: ${msg.messages.join(', ')}`).join('\n')
    return `需要手动处理\n${statusMessages}\n${linkContent}`
  }

  const eventDescriptions: Record<string, string> = {
    Test: `测试通知: ${series.title}`,
    Download: `下载通知: ${series.title}`,
    Rename: `重命名通知: ${series.title}`,
    SeriesAdd: `添加系列: ${series.title}（年份：${series.year}）`,
    SeriesDelete: `删除系列: ${series.title}`,
    EpisodeFileDelete: `删除剧集文件: ${episodes[0]?.title}${formatEpisodeInfo(episodes)}`,
    Health: `健康检查完成。状态: 正常`,
    ApplicationUpdate: `应用更新检测: ${payload.instanceName}`,
    HealthRestored: `健康状态恢复正常。状态: 正常`,
  }

  return `${eventDescriptions[eventType] || `未知事件类型: ${eventType}`}\n${sonarrLinkContent}`
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
