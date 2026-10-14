export function ApplicationQueueLoadMore({
  loading,
  loadMore,
}: {
  loading: boolean
  loadMore: () => void
}) {
  return (
    <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
      <button type="button" className="btn btn-secondary" onClick={() => void loadMore()} disabled={loading}>
        {loading ? 'Loading…' : 'Load more'}
      </button>
    </div>
  )
}
