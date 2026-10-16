import './GlobalUI.css'

function LoadingSpinner({
    message = "Loading...",
    size = "medium",
}) {
  return (
    <div 
        className={"loading-spinner--" + size}
        role="status"
        aria-live="polite"
    >
      <span 
        className="loading-spinner__circle"
        aria-hidden="true"
      ></span>
      <span>{message}</span>
    </div>
  )
}

export default LoadingSpinner