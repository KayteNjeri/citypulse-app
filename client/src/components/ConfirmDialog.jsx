import './GlobalUI.css'

function ConfirmDialog({
    isOpen,
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
    loading = false,
    danger = false,
}) {
  if (!isOpen) return null

  return (
    <div className="confirm-dialog__backdrop">
        <section
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
        >
            <h2 id="confirm-dialog-title">{title}</h2>
            <p id="confirm-dialog-message">{message}</p>

            <div className="confirm-dialog__actions">
                <button 
                    type="button"
                    className="confirm-dialog__cancel"
                    onClick={onCancel}
                    disabled={loading}
                >
                    {cancelLabel}
                </button>

                <button 
                    type="button"
                    className={`confirm-dialog__confirm ${danger ? 'confirm-dialog__confirm--danger' : ''}`}
                    onClick={onConfirm}
                    disabled={loading}
                >
                    {loading ? 'Please wait...' : confirmLabel}
                </button>
            </div>
        </section>
    </div>
    )
}

export default ConfirmDialog