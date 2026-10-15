import type { PortalChrome } from './usePortalLayout'

export function PortalImpersonationBar(chrome: PortalChrome) {
  const { impersonatedBrandName, exitImpersonation, exiting } = chrome
  return (
    <div className="portal-impersonation-bar" role="status">
      <span className="portal-impersonation-bar-label">
        Viewing as <strong>{impersonatedBrandName}</strong>
      </span>
      <button
        type="button"
        className="portal-impersonation-bar-exit"
        onClick={() => void exitImpersonation()}
        disabled={exiting}
      >
        {exiting ? '…' : 'Exit brand'}
      </button>
    </div>
  )
}
