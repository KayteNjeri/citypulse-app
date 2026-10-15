// Pure helpers for the My Plans / Plan Details screens (no React, so they're unit tested).

export const STATUSES = [
  { value: 'interested', label: 'Interested' },
  { value: 'going', label: 'Going' },
]

export const MAX_TITLE_LENGTH = 160

export const emptyPlanForm = { title: '', description: '', event_date: '', city: '' }

export function validatePlanForm(form) {
  const errors = {}
  const title = form.title.trim()
  if (!title) errors.title = 'Give your plan a name.'
  else if (title.length > MAX_TITLE_LENGTH) errors.title = `Keep it under ${MAX_TITLE_LENGTH} characters.`
  if (form.event_date && !/^\d{4}-\d{2}-\d{2}$/.test(form.event_date)) errors.event_date = 'Pick a valid date.'
  return errors
}

// Form values -> request body for POST/PATCH /api/plans (empty optional fields become null).
export function planFormToPayload(form) {
  const text = (v) => (v.trim() ? v.trim() : null)
  return {
    title: form.title.trim(),
    description: text(form.description) ?? '',
    event_date: form.event_date || null,
    city: text(form.city),
  }
}

export function planToForm(plan) {
  return {
    title: plan.title ?? '',
    description: plan.description ?? '',
    event_date: plan.event_date ?? '',
    city: plan.city ?? '',
  }
}

// "Sat 24 Oct 2026" for a YYYY-MM-DD plan date (parsed as a local date, not UTC).
export function formatPlanDate(isoDate) {
  if (!isoDate) return null
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function eventCountLabel(count = 0) {
  return `${count} ${count === 1 ? 'event' : 'events'}`
}

export function countByStatus(savedEvents = []) {
  const counts = { all: savedEvents.length, interested: 0, going: 0 }
  for (const ev of savedEvents) {
    if (ev.status === 'going') counts.going += 1
    else counts.interested += 1
  }
  return counts
}

export function filterByStatus(savedEvents = [], status = 'all') {
  if (status === 'all') return savedEvents
  return savedEvents.filter((ev) => (ev.status || 'interested') === status)
}

// Default "watch later" plan that the heart button saves into (created on first save).
export const DEFAULT_PLAN_TITLE = 'Want to go'

export function findDefaultPlan(plans = []) {
  return plans.find((p) => (p.title || '').trim().toLowerCase() === DEFAULT_PLAN_TITLE.toLowerCase()) ?? null
}

// Canonical event (see utils/normalizeEvent.js) -> saved-event snapshot for POST /plans/<id>/events.
export function eventToSnapshot(event) {
  const text = (v) => (typeof v === 'string' && v.trim() && v !== '#' ? v.trim() : null)
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null)
  return {
    ticketmaster_id: String(event.id),
    name: event.name,
    url: text(event.url),
    image: text(event.image),
    date: text(event.date),
    time: text(event.time),
    venue: text(event.venue),
    city: text(event.city),
    category: text(event.category),
    price_min: num(event.priceMin),
    price_max: num(event.priceMax),
    currency: text(event.currency),
  }
}

// Plan ids are positive integers (Flask route /plans/<int:plan_id>).
export const isValidPlanId = (id) => /^[1-9]\d*$/.test(String(id ?? ''))

// Saved-event snapshot (snake_case from the API) -> canonical event shape used by EventCard.
export function savedEventToEvent(ev) {
  return {
    id: ev.ticketmaster_id ?? `saved-${ev.id}`,
    name: ev.name,
    url: ev.url ?? null,
    image: ev.image ?? null,
    date: ev.date ?? null,
    time: ev.time ?? null,
    venue: ev.venue ?? null,
    city: ev.city ?? null,
    category: ev.category ?? null,
    priceMin: ev.price_min ?? null,
    priceMax: ev.price_max ?? null,
    currency: ev.currency || 'KES',
  }
}
