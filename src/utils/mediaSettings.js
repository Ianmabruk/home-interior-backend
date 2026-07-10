// Shared media positioning model used by admin upload forms, the live
// preview, the public rendering components, and the backend resolver.
//
// A media settings object is always shaped as:
//   { position: PositionKey, zoom: 50|75|100|125|150, fit: FitKey }

export const POSITION_OPTIONS = [
  'top-left',
  'top',
  'top-right',
  'left',
  'center',
  'right',
  'bottom-left',
  'bottom',
  'bottom-right',
]

export const ZOOM_OPTIONS = [50, 75, 100, 125, 150]

export const FIT_OPTIONS = ['contain', 'cover', 'fill', 'scale-down']

export const DEFAULT_MEDIA_SETTINGS = {
  position: 'center',
  zoom: 100,
  fit: 'cover',
}

// Maps a position key to the CSS `object-position` value. The same string is
// reused as `transform-origin` so the zoom (scale) transform stays focused on
// the chosen focal point instead of the center of the image.
const POSITION_TO_OBJECT_POSITION = {
  center: 'center',
  top: 'center top',
  bottom: 'center bottom',
  left: 'left center',
  right: 'right center',
  'top-left': 'left top',
  'top-right': 'right top',
  'bottom-left': 'left bottom',
  'bottom-right': 'right bottom',
}

// Compact 3x3 grid order used by the admin position picker UI.
export const POSITION_GRID = [
  ['top-left', 'top', 'top-right'],
  ['left', 'center', 'right'],
  ['bottom-left', 'bottom', 'bottom-right'],
]

export const POSITION_LABELS = {
  'top-left': 'Top Left',
  top: 'Top',
  'top-right': 'Top Right',
  left: 'Left',
  center: 'Center',
  right: 'Right',
  'bottom-left': 'Bottom Left',
  bottom: 'Bottom',
  'bottom-right': 'Bottom Right',
}

export const normalizeMediaSettings = (value) => {
  const base = { ...DEFAULT_MEDIA_SETTINGS }
  if (!value || typeof value !== 'object') return base

  if (POSITION_OPTIONS.includes(value.position)) base.position = value.position
  if (FIT_OPTIONS.includes(value.fit)) base.fit = value.fit
  const zoom = Number(value.zoom)
  if (ZOOM_OPTIONS.includes(zoom)) base.zoom = zoom

  return base
}

export const positionToObjectPosition = (position) =>
  POSITION_TO_OBJECT_POSITION[position] || POSITION_TO_OBJECT_POSITION.center
