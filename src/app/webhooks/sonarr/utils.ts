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
    case 'Test':
      return ''
    case 'Grab':
    case 'Download':
    case 'Rename':
    case 'SeriesAdd':
    case 'SeriesDelete':
    case 'EpisodeFileDelete':
      return `${sonarrBaseUrl}/series/${series.titleSlug}`
    case 'ManualInteractionRequired':
      return `${sonarrBaseUrl}/activity/queue`
    case 'Health':
    case 'ApplicationUpdate':
    case 'HealthRestored':
    default:
      return sonarrBaseUrl
  }
}

export function generateTvdbLink(series: Series) {
  return `${THE_TVDB_SERIES_BASE_URL}/${series.titleSlug}`
}

export function generateNotificationMessage(payload: SonarrNotificationPayload) {
  const { eventType, series, episodes } = payload
  const tvdbLink = generateTvdbLink(series)
  const sonarrLink = generateSonarrLink(eventType, series)
  const tvdbLinkContent = `TVDB: ${tvdbLink}`
  const sonarrLinkContent = sonarrLink ? `Sonarr: ${sonarrLink}` : ''
  const links = [tvdbLinkContent, sonarrLinkContent].filter(Boolean).join('\n')

  if (isGrabPayload(payload)) {
    const { series, episodes } = payload
    return `抓取：${series.title}（第 ${episodes[0]?.seasonNumber} 季，第 ${episodes[0]?.episodeNumber} 集）\n${links}`
  }

  if (isDownloadPayload(payload)) {
    const { series, episodes } = payload
    return `下载：${series.title}（第 ${episodes[0]?.seasonNumber} 季，第 ${episodes[0]?.episodeNumber} 集）\n${links}`
  }

  if (isManualInteractionRequiredPayload(payload)) {
    const { downloadStatusMessages } = payload
    const statusMessages = downloadStatusMessages.map((msg) => `${msg.title}：${msg.messages.join(', ')}`).join('\n')
    return `需要手动处理：\n${statusMessages}\n${links}`
  }

  switch (eventType) {
    case 'Test':
      return `测试：${series.title}（${sonarrLink}）`
    case 'Download':
      return `下载：${series.title}\n${links}`
    case 'Rename':
      return `重命名：${series.title}\n${links}`
    case 'SeriesAdd':
      return `添加系列：${series.title}（年份：${series.year}）\n${links}`
    case 'SeriesDelete':
      return `删除系列：${series.title}\n${links}`
    case 'EpisodeFileDelete':
      return `删除剧集文件：${episodes[0]?.title}（第 ${episodes[0]?.seasonNumber} 季，第 ${episodes[0]?.episodeNumber} 集）\n${links}`
    case 'Health':
      return `健康检查完成。状态：正常\n${sonarrLinkContent}`
    case 'ApplicationUpdate':
      return `应用更新检测：${payload.instanceName}\n${sonarrLinkContent}`
    case 'HealthRestored':
      return `健康状态恢复正常。状态：正常\n${sonarrLinkContent}`
    default:
      return `未知事件类型：${eventType}\n${sonarrLinkContent}`
  }
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
