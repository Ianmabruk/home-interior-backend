import { normalizeMediaSettings, positionToObjectPosition } from '../../utils/mediaSettings'

// Renders an image exactly as configured in the admin media controls:
// object-fit, object-position, and a scale transform for zoom. The image
// fills its parent container, so callers should wrap it in a sized,
// overflow-hidden element (e.g. <div className="h-44 w-full overflow-hidden">).
export default function PositionedImage({
  src,
  alt = '',
  settings,
  className = '',
  style,
  loading = 'lazy',
  draggable = false,
}) {
  if (!src) return null

  const s = normalizeMediaSettings(settings)
  const objectPosition = positionToObjectPosition(s.position)
  const zoom = s.zoom / 100

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      draggable={draggable}
      decoding="async"
      className={`${className}`}
      style={{
        width: '100%',
        height: '100%',
        objectFit: s.fit,
        objectPosition,
        transform: zoom !== 1 ? `scale(${zoom})` : undefined,
        transformOrigin: objectPosition,
        ...style,
      }}
    />
  )
}
