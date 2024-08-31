/** 带上限的数组 */
export class LimitedArray<T> {
  /** 存储元素的数组 */
  private array: T[]
  /** 数组的容量限制 */
  private capacity: number

  /** 获取当前容量大小 */
  public get length() {
    return this.array.length
  }

  constructor(capacity: number) {
    this.array = []
    this.capacity = capacity
  }

  /** 向数组中添加元素，如果超出容量，则移除最旧的元素 */
  public push(...items: T[]) {
    /** 计算添加元素后的总长度 */
    const totalItems = this.array.length + items.length

    if (totalItems > this.capacity) {
      /** 计算需要移除的元素数量 */
      const itemsToRemove = totalItems - this.capacity
      // 移除最旧的元素
      this.array.splice(0, itemsToRemove)
    }

    this.array.push(...items)
  }

  /** 返回数组的切片 */
  public slice(start?: number, end?: number) {
    return this.array.slice(start, end)
  }

  /** 返回数组的副本 */
  public values(): T[] {
    return [...this.array]
  }

  /** 更新容量 */
  public updateCapacity(capacity: number) {
    if (typeof capacity === 'number' && capacity > 1) {
      this.capacity = capacity
    }
  }

  /** 清除 */
  public clear() {
    this.array = []
  }
}
