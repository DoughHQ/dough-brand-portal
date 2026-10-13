const helpStyle = {
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--ink-50)',
  margin: '0 0 24px',
  lineHeight: 1.45,
  maxWidth: 640,
}

export default function ContentsFieldIntro() {
  return (
    <p style={helpStyle}>
      Two to five seats that ship in the box and battle each other. Add your catalog
      product, your prototype, or a competitor — then mark who is Yours.
    </p>
  )
}
