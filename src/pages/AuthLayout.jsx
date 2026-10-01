import { Link } from 'react-router-dom'
import './AuthPage.css'

// Shared frame for the login and signup pages: brand, title, optional notice, form.
function AuthLayout({ title, subtitle, notice, children, footer }) {
  return (
    <main className="auth">
      <Link className="auth__brand" to="/">
        <span className="auth__logo" aria-hidden="true">●</span>
        Group2
      </Link>

      <section className="auth__card" aria-labelledby="auth-title">
        <h1 id="auth-title" className="auth__title">
          {title}
        </h1>
        {subtitle && <p className="auth__subtitle">{subtitle}</p>}
        {notice && (
          <p className="auth__notice" role="status">
            {notice}
          </p>
        )}
        {children}
        {footer && <p className="auth__footer">{footer}</p>}
      </section>

      <Link className="auth__back" to="/">
        ← Back to events
      </Link>
    </main>
  )
}

export default AuthLayout
