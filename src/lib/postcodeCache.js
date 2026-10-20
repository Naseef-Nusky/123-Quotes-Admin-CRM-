let cachedPostcodes = null
let loadPromise = null

/** Call after CRM create/update/delete so dropdowns pick up changes. */
export function clearPostcodeCache() {
  cachedPostcodes = null
  loadPromise = null
}

export function getCachedPostcodes() {
  return cachedPostcodes
}

export function loadPostcodes(fetcher) {
  if (cachedPostcodes) return Promise.resolve(cachedPostcodes)
  if (!loadPromise) {
    loadPromise = fetcher()
      .then((d) => {
        cachedPostcodes = d.results || []
        return cachedPostcodes
      })
      .catch((err) => {
        loadPromise = null
        throw err
      })
  }
  return loadPromise
}
