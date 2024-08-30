import { Kroki } from '@/services/Kroki'

const kroki = new Kroki()
export function useKroki() {
  return kroki
}
