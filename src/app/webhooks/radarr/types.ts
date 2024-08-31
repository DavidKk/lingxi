/** 基础类型定义 */
export interface ModelBase {
  id: number
}

/** 语言信息 */
export interface Language {
  /** 语言的唯一标识符 */
  id: number
  /** 语言名称 */
  name: string
}

/** 媒体信息 */
export interface MediaInfo {
  /** 音频比特率 */
  audioBitrate: number
  /** 音频声道数量 */
  audioChannels: number
  /** 音频编解码器 */
  audioCodec: string
  /** 音频语言 */
  audioLanguages: string
  /** 音频流数量 */
  audioStreamCount: number
  /** 视频比特深度 */
  videoBitDepth: number
  /** 视频比特率 */
  videoBitrate: number
  /** 视频编解码器 */
  videoCodec: string
  /** 视频帧率 */
  videoFps: number
  /** 视频动态范围 */
  videoDynamicRange: string
  /** 视频动态范围类型 */
  videoDynamicRangeType: string
  /** 分辨率 */
  resolution: string
  /** 运行时间 */
  runTime: string
  /** 扫描类型（如进阶扫描或隔行扫描） */
  scanType: string
  /** 字幕信息 */
  subtitles: string
}

/** 自定义格式 */
export interface CustomFormat extends ModelBase {
  /** 自定义格式名称 */
  name: string
  /** 重命名时是否包含自定义格式 */
  includeCustomFormatWhenRenaming: boolean
}

/** 质量信息来源枚举 */
export enum QualitySource {
  Unknown = 'unknown',
  Television = 'television',
  TelevisionRaw = 'televisionRaw',
  Web = 'web',
  WebRip = 'webRip',
  DVD = 'dvd',
  Bluray = 'bluray',
  BlurayRaw = 'blurayRaw',
}

/** 修订版本信息 */
export interface Revision {
  /** 修订版本号 */
  version: number
  /** 实际版本号 */
  real: number
  /** 是否为修订版 */
  isRepack: boolean
}

/** 质量信息 */
export interface Quality {
  /** 质量标识符 */
  id: number
  /** 质量名称 */
  name: string
  /** 分辨率 */
  resolution: number
  /** 来源 */
  source: QualitySource
}

/** 质量模型 */
export interface QualityModel {
  /** 质量信息 */
  quality: Quality
  /** 修订版本信息 */
  revision: Revision
}

/** 电影文件信息 */
export interface MovieFile extends ModelBase {
  /** 所属电影的标识符 */
  movieId: number
  /** 相对路径 */
  relativePath: string
  /** 文件路径 */
  path: string
  /** 文件大小（以字节为单位） */
  size: number
  /** 添加日期 */
  dateAdded: string
  /** 场景名称 */
  sceneName: string
  /** 发布组 */
  releaseGroup: string
  /** 语言信息 */
  languages: Language[]
  /** 质量信息 */
  quality: QualityModel
  /** 自定义格式信息 */
  customFormats: CustomFormat[]
  /** 索引器标志 */
  indexerFlags: number
  /** 媒体信息 */
  mediaInfo: MediaInfo
  /** 是否未满足质量截止要求 */
  qualityCutoffNotMet: boolean
}

/** 电影状态类型 */
export type MovieStatus = 'tba' | 'announced' | 'inCinemas' | 'released' | 'deleted'

/** 图片信息 */
export interface Image {
  /** 封面类型（如海报、横幅） */
  coverType: string
  /** 本地URL */
  url: string
  /** 远程URL */
  remoteUrl: string
}

/** 收藏信息 */
export interface Collection {
  /** 收藏标题 */
  title: string
}

/** 统计信息 */
export interface Statistics {
  /** 电影文件数量 */
  movieFileCount: number
  /** 发布组列表 */
  releaseGroups: string[]
  /** 磁盘占用大小 */
  sizeOnDisk: number
}

/** 评分信息 */
export interface Ratings {
  imdb: object
  tmdb: object
  metacritic: object
  rottenTomatoes: object
}

/** 电影信息 */
export interface Movie extends ModelBase {
  /** TMDB 标识符 */
  tmdbId: number
  /** IMDB 标识符 */
  imdbId: string
  /** 排序标题 */
  sortTitle: string
  /** 简介 */
  overview: string
  /** YouTube 预告片 ID */
  youTubeTrailerId: string
  /** 是否监控 */
  monitored: boolean
  /** 状态 */
  status: MovieStatus
  /** 标题 */
  title: string
  /** 标题 Slug */
  titleSlug: string
  /** 原标题 */
  originalTitle: string
  /** 原始语言 */
  originalLanguage: Language
  /** 收藏信息 */
  collection: Collection
  /** 制片公司 */
  studio: string
  /** 质量配置文件 ID */
  qualityProfileId: number
  /** 添加时间 */
  added: string
  /** 上映年份 */
  year: number
  /** 在影院上映时间（可选） */
  inCinemas?: string
  /** 物理发行时间（可选） */
  physicalRelease?: string
  /** 数字发行时间（可选） */
  digitalRelease?: string
  /** 发行日期（可选） */
  releaseDate?: string
  /** 电影时长 */
  runtime: number
  /** 最低可用性 */
  minimumAvailability: string
  /** 文件路径 */
  path: string
  /** 电影流派 */
  genres: string[]
  /** 评分信息 */
  ratings: Ratings
  /** 热度 */
  popularity: number
  /** 认证信息 */
  certification: string
  /** 统计信息 */
  statistics: Statistics
  /** 标签 */
  tags: number[]
  /** 图片信息 */
  images: Image[]
  /** 电影文件信息 */
  movieFile: MovieFile
  /** 是否有文件 */
  hasFile: boolean
  /** 是否可用 */
  isAvailable: boolean
  /** 是否正在保存（可选） */
  isSaving?: boolean
}

export interface Release {
  /** 质量信息 */
  quality: string
  /** 质量版本 */
  qualityVersion: number
  /** 发布组 */
  releaseGroup: string
  /** 发布标题 */
  releaseTitle: string
  /** 索引器名称 */
  indexer: string
  /** 文件大小（以字节为单位） */
  size: number
  /** 自定义格式得分 */
  customFormatScore: number
  /** 自定义格式列表 */
  customFormats: string[]
  /** 索引器标志列表 */
  indexerFlags: string[]
}

export interface CustomFormatInfo {
  /** 自定义格式列表 */
  customFormats: string[]
  /** 自定义格式得分 */
  customFormatScore: number
}

export type EventType =
  | 'Test'
  | 'Grab'
  | 'Download'
  | 'Rename'
  | 'MovieDelete'
  | 'MovieFileDelete'
  | 'Health'
  | 'ApplicationUpdate'
  | 'MovieAdded'
  | 'HealthRestored'
  | 'ManualInteractionRequired'

export interface RadarrNotificationPayload {
  /** 电影信息 */
  movie: Movie
  /** 远程电影信息（可选） */
  remoteMovie?: Movie
  /** 发布信息（可选） */
  release?: Release
  /** 电影文件信息（可选） */
  movieFile?: MovieFile
  /** 是否为升级 */
  isUpgrade?: boolean
  /** 下载客户端名称 */
  downloadClient: string
  /** 下载客户端类型 */
  downloadClientType: string
  /** 下载 ID */
  downloadId: string
  /** 自定义格式信息 */
  customFormatInfo: CustomFormatInfo
  /** 事件类型 */
  eventType: EventType
  /** 实例名称 */
  instanceName: string
  /** 应用程序 URL */
  applicationUrl: string
}
