export function CorrectionsDeskNotices({
  error,
  notice,
  flash,
}: {
  error: string | null
  notice: string | null
  flash: string | null
}) {
  return (
    <>
      {error && <div className="corr-banner corr-banner-error">{error}</div>}
      {notice && <div className="corr-banner corr-banner-info">{notice}</div>}
      {flash && <div className="corr-banner corr-banner-ok">{flash}</div>}
    </>
  )
}
