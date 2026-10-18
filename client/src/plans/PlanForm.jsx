import { useState } from 'react'
import FormField from '../pages/FormField'
import { emptyPlanForm, planFormToPayload, validatePlanForm } from './planUtils'

// Create / edit form for a plan. `onSubmit(payload)` should return a promise; while it runs
// the button shows a saving state, and a rejected promise's message is shown above the form.
function PlanForm({ initialValues = emptyPlanForm, submitLabel = 'Create plan', onSubmit, onCancel }) {
  const [form, setForm] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = validatePlanForm(form)
    setErrors(found)
    setFormError('')
    if (Object.keys(found).length) return
    setSaving(true)
    try {
      await onSubmit(planFormToPayload(form))
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="plan-form" onSubmit={handleSubmit} noValidate>
      {formError && (
        <p className="plans__alert" role="alert">
          {formError}
        </p>
      )}
      <FormField id="title" label="Plan name *" value={form.title} onChange={update} error={errors.title} placeholder="e.g. Date night" />
      <div className="plan-form__row">
        <FormField id="event_date" label="Date" type="date" value={form.event_date} onChange={update} error={errors.event_date} />
        <FormField id="city" label="City" value={form.city} onChange={update} placeholder="e.g. Nairobi" />
      </div>
      <div className="auth-field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          className="plan-form__textarea"
          rows={3}
          value={form.description}
          onChange={update}
          placeholder="What's this plan about?"
        />
      </div>
      <div className="plan-form__actions">
        <button className="plans__primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button className="plans__secondary" type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default PlanForm
