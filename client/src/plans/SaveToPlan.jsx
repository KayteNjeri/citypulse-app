import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import { listPlans } from '../api/plansApi'
import { useSavedEvents } from './savedEventsContext'
import { DEFAULT_PLAN_TITLE, findDefaultPlan } from './planUtils'
import './SaveToPlan.css'

// "Save to plan" picker (used in the event details popup): choose any of the user's plans,
// e.g. "Date night", instead of the heart's default "Want to go".
function SaveToPlan({ event }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const { saveToPlan, isSaving } = useSavedEvents()
  const [plans, setPlans] = useState(null) // null = loading
  const [planId, setPlanId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return undefined
    let cancelled = false
    listPlans()
      .then((list) => {
        if (cancelled) return
        setPlans(list)
        setPlanId(String((findDefaultPlan(list) ?? list[0])?.id ?? ''))
      })
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [user])

  if (!user) {
    return (
      <p className="save-to-plan__hint">
        <Link to="/login" state={{ from: pathname }}>
          Log in
        </Link>{' '}
        to save this event to a plan.
      </p>
    )
  }
  if (error) return <p className="save-to-plan__hint">Plans unavailable: {error}</p>
  if (plans === null) return <p className="save-to-plan__hint">Loading your plans…</p>
  if (plans.length === 0) {
    return (
      <p className="save-to-plan__hint">
        No plans yet. Tap ♡ to save to {DEFAULT_PLAN_TITLE}, or <Link to="/plans">create a plan</Link>.
      </p>
    )
  }

  const saving = isSaving(event.id)
  const handleSave = (e) => {
    e.preventDefault()
    const plan = plans.find((p) => String(p.id) === planId)
    if (plan) saveToPlan(event, plan)
  }

  return (
    <form className="save-to-plan" onSubmit={handleSave}>
      <label htmlFor={`save-to-plan-${event.id}`}>Save to plan</label>
      <div className="save-to-plan__row">
        <select
          id={`save-to-plan-${event.id}`}
          className="select-chevron"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          disabled={saving}
        >
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <button type="submit" disabled={saving || !planId}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default SaveToPlan
