export type ConfigurableConstructor<T> = abstract new (...args: any[]) => T

/**
 * 一个高阶函数，用于给类添加全局配置能力。
 *
 * - 这个函数返回一个新的类，该类包含静态属性和方法，用于配置和获取全局配置。
 * - 任何继承自这个新类的子类，都将共享同一个全局配置静态属性。
 * - 修改静态属性 `globalConfiguration` 会影响所有继承此类的子类。
 *
 * @template A - 配置的类型
 * @template T - 基础类的类型
 *
 * @param Base - 要扩展的基础类构造函数
 * @returns 扩展后的类，具有全局配置能力
 */
export function withConfigurable<A, T extends Record<string, any>>(Base: ConfigurableConstructor<T>) {
  abstract class Configurable extends Base {
    /** 全局配置，所有继承的子类共享这个静态属性 */
    private static globalConfiguration: A

    /**
     * 配置全局设置。
     *
     * @param config - 全局配置对象
     */
    static configure(config: A) {
      this.globalConfiguration = config
    }

    /**
     * 获取全局配置。
     *
     * @throws 如果尚未配置，则抛出错误
     * @returns 全局配置对象
     */
    static getConfig() {
      if (!this.globalConfiguration) {
        throw new Error('it is not configured')
      }

      return this.globalConfiguration
    }
  }

  return Configurable
}
