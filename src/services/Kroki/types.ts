import type { ValuesType } from 'utility-types'

/** Kroki 支持的语言类型 */
const SUPPORTS_KROKI_LANGUAGE = [
  'blockdiag',
  'seqdiag',
  'actdiag',
  'nwdiag',
  'packetdiag',
  'rackdiag',
  'bpmn',
  'bytefield',
  'c4plantuml',
  'dbml',
  'diagrams',
  'dot',
  'erd',
  'excalidraw',
  'graphviz',
  'mermaid',
  'nomnoml',
  'plantuml',
  'svgbob',
  'umlet',
  'vega',
  'vegalite',
  'wavedrom',
  'websequencediagrams',
] as const

export type KrokiLanguage = ValuesType<typeof SUPPORTS_KROKI_LANGUAGE>

export interface KrokiVersion {
  actdiag: string
  bpmn: string
  pikchr: string
  nwdiag: string
  c4plantuml: string
  rackdiag: string
  dot: string
  symbolator: string
  d2: string
  tikz: string
  mermaid: string
  erd: string
  graphviz: string
  vegalite: string
  ditaa: string
  kroki: {
    number: string
    build_hash: string
  }
  umlet: string
  diagramsnet: string
  plantuml: string
  seqdiag: string
  nomnoml: string
  wavedrom: string
  structurizr: string
  bytefield: string
  wireviz: string
  excalidraw: string
  dbml: string
  packetdiag: string
  svgbob: string
  vega: string
  blockdiag: string
}

export interface KrokiServiceStatus {
  version: KrokiVersion
  status: 'pass' | 'fail'
}

/** 图表代码块的类型定义 */
export interface KrokiCodeBlock {
  /** 图表语言类型 */
  language: KrokiLanguage
  /** 代码片段 */
  code: string
}

/** 图片文件 */
export interface KrokiImage {
  file: string
  content: ArrayBuffer
}

/** 是否为支持的 Kroki 语言 */
export function isKrokiLanguage(target: string): target is KrokiLanguage {
  return SUPPORTS_KROKI_LANGUAGE.some((item) => item === target)
}

/** 是否为 Kroki 生成的图片数据 */
export function isKrokiImage(target: any): target is KrokiImage {
  return typeof target === 'object' && target !== null && 'file' in target && 'content' in target
}
