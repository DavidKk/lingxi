/**
 * 筛选出字符串的 keys
 * @description
 * keyof 返回 string | number | symbol，
 * 一般情况下我们仅使用 string 作为 KEY，
 * 此时可以过滤。
 */
export type StringKeys<T> = T extends string ? T : never

/** 去除 Promise */
export type TrimPromise<T> = T extends Promise<infer A> ? A : T

// prettier-ignore
/** 通过字符串连接数组元素 */
export type Join<K, P, G extends string = '.'> = K extends string | number
  ? P extends string | number
    ? P extends ''
      ? never
      : `${K}${G}${P}`
    : never
  : never

// prettier-ignore
/** 获取对象所有下标集合 */
export type Paths<T, G extends string = '.', D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof T]-?: K extends string | number
          ? K extends ''
            ? never
            : `${K}` | Join<K, Paths<T[K], G>, G>
          : never
      }[keyof T]
    : ''

/** 分割路径 */
export type SplitPaths<P extends string> = P extends `${infer K}.${infer RS}` ? K | SplitPaths<RS> : never

/** 通过下标获取对象值 */
export type Get<T, P extends string> = P extends `${infer K}.${infer RS}`
  ? K extends keyof T
    ? // 递归的解析路径
      Get<T[K], RS>
    : never
  : P extends keyof T
    ? T[P]
    : never

/**
 * 验证类型 T 是否满足类型 A
 *
 * 这个类型用于在编译时检查类型 T 是否符合类型 A 的要求。
 * 如果 T 不满足 A，编译器将会报错。
 *
 * @template A - 需要满足的基类型
 * @template T - 被检查的具体类型
 */
export type Satisfies<A, T extends A> = T extends A ? T : never
