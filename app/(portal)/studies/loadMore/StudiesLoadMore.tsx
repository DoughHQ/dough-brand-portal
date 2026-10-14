type Props = {
  loading: boolean
  onLoadMore: () => void
}

export default function StudiesLoadMore({ loading, onLoadMore }: Props) {
  return (
    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => void onLoadMore()}
        disabled={loading}
      >
        {loading ? 'Loading…' : 'Load more'}
      </button>
    </div>
  )
}
