export interface Image {
  coverType: string
  url: string
  remoteUrl: string
}

export interface Series {
  id: number
  title: string
  titleSlug: string
  path: string
  tvdbId: number
  tvMazeId: number
  tmdbId: number
  imdbId: string
  type: string
  year: number
  genres: string[]
  images: Image[]
  tags: string[]
}

export interface Episode {
  id: number
  episodeNumber: number
  seasonNumber: number
  title: string
  airDate: string
  airDateUtc: string
  seriesId: number
  tvdbId: number
}

export interface DownloadInfo {
  quality: string
  qualityVersion: number
  title: string
  size: number
}

export interface DownloadStatusMessage {
  title: string
  messages: string[]
}

export interface CustomFormatInfo {
  customFormats: string[]
  customFormatScore: number
}

export interface Release {
  releaseTitle: string
  indexer: string
  size: number
  releaseType: string
}

export type EventType =
  | 'Test'
  | 'Grab'
  | 'Download'
  | 'Rename'
  | 'SeriesAdd'
  | 'SeriesDelete'
  | 'EpisodeFileDelete'
  | 'ManualInteractionRequired'
  | 'Health'
  | 'ApplicationUpdate'
  | 'HealthRestored'

export interface MediaInfo {
  audioChannels: number
  audioCodec: string
  audioLanguages: string[]
  height: number
  width: number
  subtitles: string[]
  videoCodec: string
  videoDynamicRange: string
  videoDynamicRangeType: string
}

export interface EpisodeFile {
  id: number
  relativePath: string
  path: string
  quality: string
  qualityVersion: number
  releaseGroup: string
  sceneName: string
  size: number
  dateAdded: string // ISO 8601 日期格式
  mediaInfo: MediaInfo
}

export interface BasicPayload {
  eventType: EventType
  series: Series
  episodes: Episode[]
  instanceName: string
}

export interface UndefinedPayload extends BasicPayload {
  downloadInfo?: DownloadInfo
  downloadClient?: string
  downloadClientType?: string
  downloadId?: string
  downloadStatus?: string
  downloadStatusMessages?: DownloadStatusMessage[]
  customFormatInfo?: CustomFormatInfo
  release?: Release
}

export interface GrabPayload extends BasicPayload {
  eventType: 'Grab'
  release: Release
  downloadClient: string
  downloadClientType: string
  downloadId: string
  customFormatInfo: CustomFormatInfo
}

export interface DownloadPayload extends BasicPayload {
  eventType: 'Download'
  episodeFiles?: EpisodeFile[]
  episodeFile?: EpisodeFile
  isUpgrade: boolean
  downloadClient: string
  downloadClientType: string
  downloadId: string
  customFormatInfo: CustomFormatInfo
  release: Release
}

export interface ManualInteractionRequiredPayload extends BasicPayload {
  eventType: 'ManualInteractionRequired'
  downloadInfo: DownloadInfo
  downloadClient: string
  downloadClientType: string
  downloadId: string
  downloadStatus: string
  downloadStatusMessages: DownloadStatusMessage[]
  customFormatInfo: CustomFormatInfo
  release: Release
}

export type SonarrNotificationPayload = GrabPayload | DownloadPayload | ManualInteractionRequiredPayload | UndefinedPayload
