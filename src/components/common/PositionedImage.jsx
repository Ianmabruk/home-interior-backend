import { memo } from 'react'
import { normalizeMediaSettings, positionToObjectPosition } from '../../utils/mediaSettings'
import { getOptimizedUrl, buildSrcSet } from '../../utils/cloudinaryHelpers'

// Renders an image exactly as configured in the admin media controls:
// object-fit, object-position, and a scale transform for zoom. The image
// fills its parent container, so callers should wrap it in a sized,
// overflow-hidden element (e.g. <div className="h-44 w-full overflow-hidden">).
//
// For Cloudinary sources it also emits a responsive `srcset` (f_auto,q_auto
// width variants) so mobile devices download a small image instead of the
// full-resolution master. `sizes` defaults to full viewport width; pass a
// tighter value (e.g. "(min-width:1024px) 33vw, 50vw") for grid tiles.
function PositionedImage({
  src,
  alt = '',
  settings,
  className = '',
  style,
  loading = 'lazy',
  draggable = false,
  sizes = '100vw',
  responsive = true,
}) {
  if (!src) return null

  const s = normalizeMediaSettings(settings)
  const objectPosition = positionToObjectPosition(s.position)
  const zoom = s.zoom / 100

  // Serve an optimized base src (auto WebP/AVIF + quality) and a width srcset.
  const optimizedSrc = responsive ? getOptimizedUrl(src, { width: 1024, crop: 'limit' }) : src
  const srcSet = responsive ? buildSrcSet(src) : ''

  return (
    <img
      src={optimizedSrc || src}
      srcSet={srcSet || undefined}
      sizes={srcSet ? sizes : undefined}
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

export default memo(PositionedImage)
