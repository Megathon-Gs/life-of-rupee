import { fitScale, stageOffsetY } from '@/world'

/** Where the world stage sits inside an element, in CSS px: whole-scale unit and top offset. */
export function stageMetrics(el: HTMLElement): { unit: number; offsetY: number } {
  const dpr = window.devicePixelRatio || 1
  const device = { width: el.clientWidth * dpr, height: el.clientHeight * dpr }
  const scaled = fitScale(device)
  return { unit: scaled / dpr, offsetY: stageOffsetY(device.height, scaled) / dpr }
}
