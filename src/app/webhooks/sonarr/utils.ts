import { THE_TVDB_SERIES_BASE_URL } from './constants'
import type { SonarrNotificationPayload, Series, Episode, DownloadInfo, DownloadStatusMessage, Release } from './types'

export function generateSonarrLink(eventType: string, series: Series, episodes: Episode[]) {
  const sonarrBaseUrl = process.env.SONARR_SERVER_URL || ''

  switch (eventType) {
    case 'Test':
      return `${sonarrBaseUrl}/series/${series.tvdbId}`
    case 'Grab':
      return `${sonarrBaseUrl}/series/${series.tvdbId}/season/${episodes[0]?.seasonNumber}`
    case 'Download':
      return `${sonarrBaseUrl}/series/${series.tvdbId}/episode/${episodes[0]?.episodeNumber}`
    case 'Rename':
      return `${sonarrBaseUrl}/series/${series.tvdbId}`
    case 'SeriesAdd':
      return `${sonarrBaseUrl}/series/${series.tvdbId}`
    case 'SeriesDelete':
      return `${sonarrBaseUrl}/series/${series.tvdbId}`
    case 'EpisodeFileDelete':
      return `${sonarrBaseUrl}/series/${series.tvdbId}/episode/${episodes[0]?.episodeNumber}`
    case 'Health':
      return `${sonarrBaseUrl}/system/health`
    case 'ApplicationUpdate':
      return `${sonarrBaseUrl}/system/updates`
    case 'HealthRestored':
      return `${sonarrBaseUrl}/system/health`
    case 'ManualInteractionRequired':
      return `${sonarrBaseUrl}/activity/queue`
    default:
      return `${sonarrBaseUrl}/dashboard`
  }
}

export function generateTvdbLink(series: Series) {
  return `${THE_TVDB_SERIES_BASE_URL}/${series.titleSlug}`
}

export function generateNotificationMessage(payload: SonarrNotificationPayload) {
  const { eventType, series, episodes, downloadInfo, downloadStatusMessages, release } = payload
  const tvdbLink = generateTvdbLink(series)
  const sonarrLink = generateSonarrLink(eventType, series, episodes)
  const links = [`TVDB: ${tvdbLink}`, sonarrLink && `Sonarr: ${sonarrLink}`].filter(Boolean).join('\n')

  switch (eventType) {
    case 'Test':
      return `测试通知：系列名称为 ${series.title}（${links}）`
    case 'Grab':
      return `抓取完成：${series.title}（第 ${episodes[0]?.seasonNumber} 季，第 ${episodes[0]?.episodeNumber} 集）\n${links}`
    case 'Download':
      return `下载完成：${series.title} - ${downloadInfo.title} (${downloadInfo.quality})\n${links}`
    case 'Rename':
      return `系列重命名：${series.title}（新标题：${release.releaseTitle}）\n${links}`
    case 'SeriesAdd':
      return `新系列添加：${series.title}（年份：${series.year}）\n${links}`
    case 'SeriesDelete':
      return `系列删除：${series.title}\n${links}`
    case 'EpisodeFileDelete':
      return `剧集文件删除：${episodes[0]?.title}（第 ${episodes[0]?.seasonNumber} 季，第 ${episodes[0]?.episodeNumber} 集）\n${links}`
    case 'Health':
      return `健康检查完成。状态：正常\n${links}`
    case 'ApplicationUpdate':
      return `应用更新检测：${payload.instanceName}\n${links}`
    case 'HealthRestored':
      return `健康状态恢复正常。状态：正常\n${links}`
    case 'ManualInteractionRequired':
      const statusMessages = downloadStatusMessages.map((msg) => `${msg.title}：${msg.messages.join(', ')}`).join('\n')
      return `需要手动处理：\n${statusMessages}\n${links}`
    default:
      return `未知事件类型：${eventType}\n${links}`
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
  if (!('downloadInfo' in target)) return 'Missing downloadInfo'
  if (!('downloadStatusMessages' in target)) return 'Missing downloadStatusMessages'
  if (!('release' in target)) return 'Missing release'
  if (!('instanceName' in target)) return 'Missing instanceName'

  const seriesValidation = isSeries(target.series)
  if (!seriesValidation) return 'Series object is invalid'

  if (!Array.isArray(target.episodes) || target.episodes.length === 0) return 'Episodes should be a non-empty array'
  if (!target.episodes.every(isEpisode)) return 'One or more episodes are invalid'

  const downloadInfoValidation = isDownloadInfo(target.downloadInfo)
  if (!downloadInfoValidation) return 'DownloadInfo object is invalid'

  if (!Array.isArray(target.downloadStatusMessages)) return 'DownloadStatusMessages should be an array'
  if (!target.downloadStatusMessages.every(isDownloadStatusMessage)) return 'One or more DownloadStatusMessages are invalid'

  const releaseValidation = isRelease(target.release)
  if (!releaseValidation) return 'Release object is invalid'

  if (typeof target.eventType !== 'string') return 'EventType should be a string'
  if (typeof target.instanceName !== 'string') return 'InstanceName should be a string'

  return true
}

export function isSonarrNotificationPayload(target: any): target is SonarrNotificationPayload {
  const validationResult = validateSonarrNotificationPayload(target)
  return validationResult === true
}
