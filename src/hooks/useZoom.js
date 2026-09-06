import { useState, useEffect, useCallback, useRef } from 'react'

export function useZoom() {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const initialPositionRef = useRef({ x: 0, y: 0 })
  const initialScaleRef = useRef(1)
  const initialDistanceRef = useRef(0)

  const reset = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev * 1.2, 5))
  }, [])

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev / 1.2, 1))
  }, [])

  const handleWheel = useCallback((e) => {
    try { e.preventDefault() } catch { /* noop */ }
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale((prev) => {
      const newScale = Math.min(Math.max(prev * delta, 1), 5)
      return newScale
    })
  }, [])

  const handleMouseDown = useCallback((e) => {
    if (scale <= 1) return
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    initialPositionRef.current = position
  }, [scale, position])

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true)
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      initialPositionRef.current = position
    } else if (e.touches.length === 2) {
      setIsDragging(false)
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      initialDistanceRef.current = Math.sqrt(dx * dx + dy * dy)
      initialScaleRef.current = scale
    }
  }, [scale, position])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || scale <= 1) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    setPosition({
      x: initialPositionRef.current.x + dx,
      y: initialPositionRef.current.y + dy,
    })
  }, [isDragging, scale])

  const handleTouchMove = useCallback((e) => {
    try { e.preventDefault() } catch { /* noop */ }
    if (e.touches.length === 1 && isDragging && scale > 1) {
      const dx = e.touches[0].clientX - dragStartRef.current.x
      const dy = e.touches[0].clientY - dragStartRef.current.y
      setPosition({
        x: initialPositionRef.current.x + dx,
        y: initialPositionRef.current.y + dy,
      })
    } else if (e.touches.length === 2) {
      setIsDragging(false)
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const newScale = Math.min(Math.max(initialScaleRef.current * (distance / initialDistanceRef.current), 1), 5)
      setScale(newScale)
    }
  }, [isDragging, scale])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const activate = useCallback(() => {
    setIsActive(true)
  }, [])

  const deactivate = useCallback(() => {
    setIsActive(false)
  }, [])

  useEffect(() => {
    if (!isActive) return
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd, isActive])

  const style = {
    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
    transformOrigin: 'center center',
    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
    cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'default',
  }

  return {
    scale,
    position,
    isDragging,
    style,
    reset,
    zoomIn,
    zoomOut,
    handleWheel,
    handleMouseDown,
    handleTouchStart,
    handleTouchEnd,
    isActive,
    activate,
    deactivate,
  }
}