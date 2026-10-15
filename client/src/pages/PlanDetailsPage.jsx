import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { useAuth } from '../auth/authContext'
import { getPlan } from '../api/plansApi'
import PlanSection from '../plans/PlanSection'
import { isValidPlanId } from '../plans/planUtils'
import './AuthPage.css'
import './PlansPage.css'

// "Plan Details": a single plan and its saved events (linked from the "Saved to …" toast).
function PlanDetailsPage() {
  const { planId } = useParams()
  const validId = isValidPlanId(planId)
  const { user } = useAuth()
  const navigate = useNavigate()
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(validId)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  // Fetch the plan (with its saved events) on open and on "Try again".
  useEffect(() => {
    if (!user || !validId) return undefined
    let cancelled = false
    getPlan(planId)
      .then((data) => !cancelled && setPlan(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [user, planId, validId, reloadKey])

  if (!user) return <Navigate to="/login" replace state={{ from: `/plans/${planId}` }} />

  const load = () => {
    setLoading(true)
    setError('')
    setReloadKey((k) => k + 1)
  }

  const shell = (content) => (
    <>
      <NavBar />
      <main className="plans">
        <Link className="plans__back" to="/plans">
          ← My Plans
        </Link>
        {content}
      </main>
    </>
  )

  if (!validId) {
    return shell(
      <div className="plans__alert" role="alert">
        <span>That plan link isn't valid.</span>
        <Link className="plans__link-button" to="/plans">
          Go to My Plans
        </Link>
      </div>,
    )
  }

  if (loading) {
    return shell(
      <div aria-busy="true" aria-label="Loading plan">
        <div className="plans__panel plan-card--skeleton plans__skeleton-header" />
        <div className="plan-card plan-card--skeleton plans__skeleton-row" />
        <div className="plan-card plan-card--skeleton plans__skeleton-row" />
      </div>,
    )
  }

  if (!plan) {
    return shell(
      <div className="plans__alert" role="alert">
        <span>{error || 'Plan not found.'}</span>
        <button type="button" className="plans__link-button" onClick={load}>
          Try again
        </button>
      </div>,
    )
  }

  return shell(
    <PlanSection
      plan={plan}
      titleAs="h1"
      onChange={(update) => setPlan((p) => update(p))}
      onDeleted={() => navigate('/plans', { replace: true })}
    />,
  )
}

export default PlanDetailsPage
