import { PRODUCT_NAME } from '@/lib/brand'

export function EditorKicker({ ct }: { ct: string }) {
  return (
    <div className="corr-editor-kicker">
      {ct === 'category'
        ? `Pick the ${PRODUCT_NAME} category`
        : ct === 'nutrition_facts' || ct === 'ingredients'
          ? 'Review the draft, then apply'
          : 'Enter the correct value'}
    </div>
  )
}
