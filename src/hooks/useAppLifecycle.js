import { useEffect } from 'react'

const EVENT_NAMES = ['visibilitychange', 'pageshow', 'focus', 'online', 'offline']

export function useAppLifecycle(callbacks) {
  const onVisible = callbacks.onVisible
  const onHidden = callbacks.onHidden
  const onOnline = callbacks.onOnline
  const onOffline = callbacks.onOffline

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        onVisible && onVisible()
      } else {
        onHidden && onHidden()
      }
    }

    const handlePageShow = (event) => {
      if (event.persisted) {
        onVisible && onVisible()
      }
    }

    const handleOnline = () => {
      onOnline && onOnline()
    }

    const handleOffline = () => {
      onOffline && onOffline()
    }

    const handleFocus = () => {
      onVisible && onVisible()
    }

    EVENT_NAMES.forEach((name) => {
      const handler =
        name === 'focus'
          ? handleFocus
          : name === 'online'
            ? handleOnline
            : name === 'offline'
              ? handleOffline
              : name === 'pageshow'
                ? handlePageShow
                : handleVisibilityChange
      window.addEventListener(name, handler)
    })

    return () => {
      EVENT_NAMES.forEach((name) => {
        const handler =
          name === 'focus'
            ? handleFocus
            : name === 'online'
              ? handleOnline
              : name === 'offline'
                ? handleOffline
                : name === 'pageshow'
                  ? handlePageShow
                  : handleVisibilityChange
        window.removeEventListener(name, handler)
      })
    }
  }, [onVisible, onHidden, onOnline, onOffline])
}
