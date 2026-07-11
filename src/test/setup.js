import '@testing-library/jest-dom'

window.matchMedia = window.matchMedia || (() => ({
  matches: false,
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
}))

window.ResizeObserver = window.ResizeObserver || (() => ({
  observe: () => {},
  unobserve: () => {},
  disconnect: () => {},
}))

HTMLCanvasElement.prototype.getContext = () => ({
  fillRect: () => {},
  clearRect: () => {},
  getImageData: () => ({ data: [] }),
  putImageData: () => {},
  createImageData: () => [],
  setTransform: () => {},
  drawImage: () => {},
  save: () => {},
  restore: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  closePath: () => {},
  stroke: () => {},
  fill: () => {},
  translate: () => {},
  scale: () => {},
  rotate: () => {},
  arc: () => {},
  measureText: () => ({ width: 0 }),
  transform: () => {},
  rect: () => {},
  clip: () => {},
  createLinearGradient: () => ({}),
  createRadialGradient: () => ({}),
  getCanvasContext: () => ({}),
})
