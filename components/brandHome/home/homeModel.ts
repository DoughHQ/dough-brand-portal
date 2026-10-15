import type { BrandHomeModel } from '@/lib/brandHome/selectHomeModel'

export function pulseItem(model: BrandHomeModel, key: string) {
  return model.pulse.find((item) => item.key === key) ?? null
}
