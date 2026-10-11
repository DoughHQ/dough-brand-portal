import type { PackagingTemplateConfig } from '@/lib/concept/types'

export type CardProps = {
  config: PackagingTemplateConfig
  patchConfig: (partial: Partial<PackagingTemplateConfig>) => void
  errorByField: Map<string, string>
}
