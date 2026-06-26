import { useState, useCallback, useEffect } from "react"

export function useSearchParams() {
  const [params, setParams] = useState<URLSearchParams>(() =>
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams()
  )

  useEffect(() => {
    const onPopState = () => {
      setParams(new URLSearchParams(window.location.search))
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  const setSearchParams = useCallback((updates: Record<string, string>) => {
    const url = new URL(window.location.href)
    url.search = ""
    for (const [key, value] of Object.entries(updates)) {
      if (value) url.searchParams.set(key, value)
    }
    window.history.replaceState({}, "", url.toString())
    setParams(url.searchParams)
  }, [])

  return [params, setSearchParams] as const
}
