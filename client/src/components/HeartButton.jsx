import './HeartButton.css'

function HeartButton({ saved = false, loading = false, onClick }) {
  const handleClick = (e) => {
    // Prevent the event card's click handler from firing.
    e.stopPropagation()
    if (!loading && onClick) onClick()
  }

  return (
    <button
      type="button"
      className={`heart-button ${saved ? 'heart-button--saved' : ''}`}
      onClick={handleClick}
      disabled={loading}
      aria-label={saved ? 'Remove event from plan' : 'Save event to plan'}
      aria-pressed={saved}
      title={saved ? 'Saved to plan' : 'Save to plan'}
    >
      {loading ? '…' : saved ? '♥' : '♡'}
    </button>
  )
}

export default HeartButton