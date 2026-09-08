import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Reset scroll on navigation — a route change should feel like a new page. */
export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}
