import './GlobalUI.css'

function ErrorMessage({ 
    message = "An error occurred. Please try again.",
    onRetry,}) {
  return (
    <div className="error-message" role="alert">
        <p>{message}</p>

        {onRetry && (
          <button 
            type="button"
            className="error-message__retry" 
            onClick={onRetry}>
            Try Again
          </button>
        )}
    </div>
  )
}

export default ErrorMessage