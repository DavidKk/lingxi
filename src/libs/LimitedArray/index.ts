export class LimitedArray<T> {
  private array: T[]
  private capacity: number

  constructor(capacity: number) {
    this.array = []
    this.capacity = capacity
  }

  public push(...items: T[]) {
    const totalItems = this.array.length + items.length

    if (totalItems > this.capacity) {
      const itemsToRemove = totalItems - this.capacity
      this.array.splice(0, itemsToRemove)
    }

    this.array.push(...items)
  }

  public slice(start?: number, end?: number) {
    return this.array.slice(start, end)
  }

  public values(): T[] {
    return [...this.array]
  }
}
