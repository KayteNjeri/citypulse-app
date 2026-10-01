import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/authContext'

// "Get tickets" link that requires an account. Logged-in users go straight to the
// ticket page; logged-out users are sent to /login, which opens the ticket page
// once they've logged in or signed up.
function TicketLink({ url, eventName, className, onClick, children }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleClick = (e) => {
    onClick?.(e)
    if (user) return
    e.preventDefault()
    navigate('/login', { state: { from: pathname, ticketUrl: url, eventName } })
  }

  return (
    <a className={className} href={url} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
      {children}
    </a>
  )
}

export default TicketLink
