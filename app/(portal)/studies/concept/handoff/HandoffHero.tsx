import type { ConceptArmRow } from '@/lib/concept/types'
import HandoffHeroPhoto from './HandoffHeroPhoto'

export default function HandoffHero({
  hero,
  name,
  design,
  mark,
}: {
  hero: ConceptArmRow
  name: string
  design: string | null
  mark: string
}) {
  return (
    <div className="cb-handoff-hero">
      <HandoffHeroPhoto imageRef={hero.image_url} letter={mark} />
      <div>
        <p className="cb-handoff-name">{name || design || 'Your product'}</p>
        {name && design ? <p className="cb-handoff-design">{design}</p> : null}
      </div>
    </div>
  )
}
