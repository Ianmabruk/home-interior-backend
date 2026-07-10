import { Monitor, Tablet, Smartphone } from 'lucide-react'
import {
  POSITION_GRID,
  POSITION_LABELS,
  ZOOM_OPTIONS,
  FIT_OPTIONS,
  normalizeMediaSettings,
} from '../../utils/mediaSettings'
import PositionedImage from './PositionedImage'

// Admin control cluster: 3x3 position picker, zoom, and fit mode.
export function ImagePositionControls({ value, onChange }) {
  const s = normalizeMediaSettings(value)
  const update = (patch) => onChange({ ...s, ...patch })

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-ink/50 mb-2">Focus Position</p>
        <div className="grid grid-cols-3 gap-1.5 w-44">
          {POSITION_GRID.map((row) =>
            row.map((pos) => {
              const active = s.position === pos
              return (
                <button
                  key={pos}
                  type="button"
                  title={POSITION_LABELS[pos]}
                  onClick={() => update({ position: pos })}
                  className={`h-9 rounded-lg border flex items-center justify-center transition ${
                    active
                      ? 'border-ink bg-ink text-white'
                      : 'border-sand bg-white text-ink/40 hover:border-ink/40 hover:text-ink'
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full bg-current"
                    style={dotStyle(pos)}
                  />
                </button>
              )
            }),
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium uppercase tracking-widest text-ink/50 mb-1">Zoom</label>
          <select
            value={s.zoom}
            onChange={(e) => update({ zoom: Number(e.target.value) })}
            className="w-full rounded-xl border border-sand bg-white px-3 py-2 text-sm outline-none"
          >
            {ZOOM_OPTIONS.map((z) => (
              <option key={z} value={z}>{z}%</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-widest text-ink/50 mb-1">Fit</label>
          <select
            value={s.fit}
            onChange={(e) => update({ fit: e.target.value })}
            className="w-full rounded-xl border border-sand bg-white px-3 py-2 text-sm outline-none"
          >
            {FIT_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

// Places the focal dot inside each grid button to communicate the effect.
const dotStyle = (pos) => {
  const map = {
    'top-left': { top: '20%', left: '20%' },
    top: { top: '20%', left: '50%' },
    'top-right': { top: '20%', left: '80%' },
    left: { top: '50%', left: '20%' },
    center: { top: '50%', left: '50%' },
    right: { top: '50%', left: '80%' },
    'bottom-left': { top: '80%', left: '20%' },
    bottom: { top: '80%', left: '50%' },
    'bottom-right': { top: '80%', left: '80%' },
  }
  const p = map[pos] || map.center
  return { position: 'absolute', ...p, transform: 'translate(-50%, -50%)' }
}

// Live preview that mirrors exactly how the image renders on Desktop / Tablet
// / Mobile. Updates instantly as position, zoom, or fit change.
export function ImagePositionPreview({ src, settings, className = '' }) {
  const s = normalizeMediaSettings(settings)
  const devices = [
    { label: 'Desktop', icon: Monitor, width: 300 },
    { label: 'Tablet', icon: Tablet, width: 210 },
    { label: 'Mobile', icon: Smartphone, width: 130 },
  ]

  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      {devices.map((d) => {
        const Icon = d.icon
        return (
          <div key={d.label} className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 text-2xs uppercase tracking-widest text-ink/40">
              <Icon size={12} /> {d.label}
            </div>
            <div
              className="overflow-hidden rounded-xl border border-sand bg-linen"
              style={{ width: d.width, aspectRatio: '4 / 3' }}
            >
              {src ? (
                <PositionedImage src={src} alt={`${d.label} preview`} settings={s} loading="eager" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xs text-ink/30">
                  No image
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
