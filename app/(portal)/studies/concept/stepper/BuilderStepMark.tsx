export default function BuilderStepMark({
  done,
  index,
}: {
  done: boolean
  index: number
}) {
  return (
    <span className="cb-stepper-mark" aria-hidden>
      {done ? (
        <svg viewBox="0 0 16 16" width="12" height="12">
          <path
            d="M3.5 8.2 6.4 11 12.5 4.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        index + 1
      )}
    </span>
  )
}
