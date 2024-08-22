export function createSingleton<T>(factory: () => T): () => T {
  let singleton: T

  return () => {
    if (!singleton) {
      singleton = factory()
    }

    return singleton
  }
}
