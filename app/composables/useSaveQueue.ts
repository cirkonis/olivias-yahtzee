/**
 * Saves the latest value, one request at a time. Taps faster than the network
 * collapse into a single trailing save, and an older response can never
 * overwrite a newer one.
 */
export function useSaveQueue<T>(save: (value: T) => Promise<unknown>) {
  const failed = ref(false)
  let inFlight = false
  let pending: T | null = null
  let latest: T | null = null

  async function push(value: T) {
    latest = value
    pending = value
    if (inFlight) return
    inFlight = true
    try {
      while (pending !== null) {
        const next = pending
        pending = null
        await save(next)
      }
      failed.value = false
    } catch {
      failed.value = true
    } finally {
      inFlight = false
    }
  }

  function retry() {
    if (latest !== null) push(latest)
  }

  return { failed, push, retry }
}
