import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function SampleReportFrame({ children }: Props) {
  return (
    <div className="cpw-sample-frame">
      <div className="cpw-sample-watermark" aria-hidden="true" />
      <header className="cpw-sample-header">
        <p className="cpw-sample-kicker">SAMPLE — illustrative data</p>
        <p className="cpw-sample-lede">
          This is the report you&apos;ll receive once real respondents complete
          your study. The numbers below are sample data to show the format.
        </p>
      </header>
      {children}
    </div>
  )
}
