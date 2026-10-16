import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  countByStatus,
  emptyPlanForm,
  eventCountLabel,
  filterByStatus,
  formatPlanDate,
  planFormToPayload,
  planToForm,
  validatePlanForm,
} from '../plans/planUtils.js'

test('validatePlanForm: title required, length capped, date format', () => {
  assert.ok(validatePlanForm(emptyPlanForm).title)
  assert.ok(validatePlanForm({ ...emptyPlanForm, title: 'x'.repeat(161) }).title)
  assert.ok(validatePlanForm({ ...emptyPlanForm, title: 'Trip', event_date: '24/10/2026' }).event_date)
  assert.deepEqual(validatePlanForm({ ...emptyPlanForm, title: '  Date night ', event_date: '2026-10-24' }), {})
})

test('planFormToPayload trims and nulls empty optional fields (API uses event_date)', () => {
  assert.deepEqual(planFormToPayload({ title: ' Date night ', description: '  ', event_date: '', city: ' Nairobi ' }), {
    title: 'Date night',
    description: '',
    event_date: null,
    city: 'Nairobi',
  })
})

test('planToForm round-trips server plans', () => {
  const plan = { id: 1, title: 'Want to go', description: null, event_date: null, city: null }
  assert.deepEqual(planToForm(plan), { title: 'Want to go', description: '', event_date: '', city: '' })
})

test('formatPlanDate parses YYYY-MM-DD as a local date', () => {
  const expected = new Date(2026, 9, 24).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  assert.equal(formatPlanDate('2026-10-24'), expected)
  assert.equal(formatPlanDate(null), null)
  assert.equal(formatPlanDate('garbage'), null)
})

test('event counts and status filtering', () => {
  const evs = [{ id: 1, status: 'going' }, { id: 2, status: 'interested' }, { id: 3 }]
  assert.equal(eventCountLabel(1), '1 event')
  assert.equal(eventCountLabel(0), '0 events')
  assert.deepEqual(countByStatus(evs), { all: 3, interested: 2, going: 1 })
  assert.deepEqual(filterByStatus(evs, 'going').map((e) => e.id), [1])
  assert.deepEqual(filterByStatus(evs, 'interested').map((e) => e.id), [2, 3])
  assert.equal(filterByStatus(evs, 'all'), evs)
})

test('eventToSnapshot maps a card event to the saved-event API fields', async () => {
  const { eventToSnapshot } = await import('../plans/planUtils.js')
  const snap = eventToSnapshot({
    id: 'mock-1', name: 'Bien', url: '#', image: '/Bien.jpeg', date: '2026-10-24', time: '19:30:00',
    venue: 'Nyayo Stadium', city: 'Nairobi', category: 'Music', priceMin: 2500, priceMax: 4000, currency: 'KES',
  })
  assert.deepEqual(snap, {
    ticketmaster_id: 'mock-1', name: 'Bien', url: null, image: '/Bien.jpeg', date: '2026-10-24', time: '19:30:00',
    venue: 'Nyayo Stadium', city: 'Nairobi', category: 'Music', price_min: 2500, price_max: 4000, currency: 'KES',
  })
  assert.equal(eventToSnapshot({ id: 7, name: 'X', priceMin: null }).ticketmaster_id, '7')
  assert.equal(eventToSnapshot({ id: 7, name: 'X', priceMin: null }).price_min, null)
})

test('findDefaultPlan finds "Want to go" regardless of case/spaces', async () => {
  const { findDefaultPlan } = await import('../plans/planUtils.js')
  assert.equal(findDefaultPlan([{ id: 1, title: 'Date night' }, { id: 2, title: ' want to go ' }]).id, 2)
  assert.equal(findDefaultPlan([{ id: 1, title: 'Date night' }]), null)
})

test('isValidPlanId accepts only positive integers', async () => {
  const { isValidPlanId } = await import('../plans/planUtils.js')
  for (const ok of ['1', '42', 7]) assert.equal(isValidPlanId(ok), true, String(ok))
  for (const bad of ['0', '-1', 'abc', '1.5', '', undefined, null]) assert.equal(isValidPlanId(bad), false, String(bad))
})

test('savedEventToEvent maps an API saved event for EventCard', async () => {
  const { savedEventToEvent } = await import('../plans/planUtils.js')
  assert.deepEqual(
    savedEventToEvent({ id: 3, ticketmaster_id: 'mock-1', name: 'Bien', url: null, image: '/Bien.jpeg', date: '2026-10-24', time: '19:30:00', venue: 'Nyayo Stadium', city: 'Nairobi', category: 'Music', price_min: 2500, price_max: 4000, currency: null }),
    { id: 'mock-1', name: 'Bien', url: null, image: '/Bien.jpeg', date: '2026-10-24', time: '19:30:00', venue: 'Nyayo Stadium', city: 'Nairobi', category: 'Music', priceMin: 2500, priceMax: 4000, currency: 'KES' },
  )
})
