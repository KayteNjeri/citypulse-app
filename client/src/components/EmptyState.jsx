import './GlobalUI.css'

function EmptyState({ 
    title = "No data available",
    message = "There is nothing here to display right now.",
    actionLabel,
    onAction,
}) {
  return (
    <section className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">
        ♡
        </div>

      <h3>{title}</h3>
      <p>{message}</p>
      {actionLabel && onAction && (
        <button 
          type="button"
          className="empty-state__action"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </section>
  )
}

export default EmptyState