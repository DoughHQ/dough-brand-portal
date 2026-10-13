'use client'

import ProductIdentityActions from './identityConfirm/ProductIdentityActions'
import ProductIdentityDetails from './identityConfirm/ProductIdentityDetails'

type Props = {
  name: string
  brand: string
  category: string | null
  upc: string
  help: string
  onConfirm: () => void
  onChange: () => void
}

export default function ProductIdentityConfirm({
  name,
  brand,
  category,
  upc,
  help,
  onConfirm,
  onChange,
}: Props) {
  return (
    <div style={{ marginTop: 10 }}>
      <ProductIdentityDetails brand={brand} category={category} upc={upc} help={help} />
      <ProductIdentityActions name={name} onConfirm={onConfirm} onChange={onChange} />
    </div>
  )
}
