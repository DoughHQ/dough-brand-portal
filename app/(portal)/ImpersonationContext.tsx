'use client'
import { createContext, useContext, useState } from 'react'

export type ViewingBrand = {
  brand_id: number
  brand_name: string
}

type ImpersonationContextValue = {
  viewingBrand: ViewingBrand | null
  setViewingBrand: (brand: ViewingBrand | null) => void
}

const ImpersonationContext = createContext<ImpersonationContextValue>({
  viewingBrand: null,
  setViewingBrand: () => {},
})

export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
  const [viewingBrand, setViewingBrand] = useState<ViewingBrand | null>(null)
  return (
    <ImpersonationContext.Provider value={{ viewingBrand, setViewingBrand }}>
      {children}
    </ImpersonationContext.Provider>
  )
}

export function useImpersonation() {
  return useContext(ImpersonationContext)
}
