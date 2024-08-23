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

export interface SonarrNotificationPayload {
  series: Series
  episodes: Episode[]
  downloadInfo: DownloadInfo
  downloadClient: string
  downloadClientType: string
  downloadId: string
  downloadStatus: string
  downloadStatusMessages: DownloadStatusMessage[]
  customFormatInfo: CustomFormatInfo
  release: Release
  eventType: string
  instanceName: string
  applicationUrl: string
}
