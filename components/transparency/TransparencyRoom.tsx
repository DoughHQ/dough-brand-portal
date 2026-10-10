import type { ReactNode } from 'react'

type Props = {
  kicker: string
  title: string
  lede: string
  children: ReactNode
}

export default function TransparencyRoom({ kicker, title, lede, children }: Props) {
  return (
    <section className="tx-ops__room">
      <header className="tx-ops__room-head">
        <p className="tx-ops__room-kicker">{kicker}</p>
        <h4 className="tx-ops__room-title">{title}</h4>
        <p className="tx-ops__room-lede">{lede}</p>
      </header>
      {children}
    </section>
  )
}
