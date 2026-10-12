import DesignPreviewClient from './DesignPreviewClient'
import { PRODUCT_NAME } from '@/lib/brand'

export const metadata = {
  title: `${PRODUCT_NAME} — Design preview`,
  robots: 'noindex',
}

export default function DesignPreviewPage() {
  return <DesignPreviewClient />
}
