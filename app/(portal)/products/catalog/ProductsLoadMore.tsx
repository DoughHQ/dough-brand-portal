export function ProductsLoadMore({
  loadingMore,
  loadMore,
}: {
  loadingMore: boolean
  loadMore: () => void
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 0 8px' }}>
      <button
        type="button"
        className="cat-primary-cta"
        onClick={() => void loadMore()}
        disabled={loadingMore}
        style={{ opacity: loadingMore ? 0.6 : 1 }}
      >
        {loadingMore ? 'Loading…' : 'Load more'}
      </button>
    </div>
  )
}
