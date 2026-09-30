// src/services/eventsApi.js
import { mockEvents } from '../data/mockEvents'

const BASE_URL = 'https://app.ticketmaster.com/discovery/v2/events.json'
const API_KEY = import.meta.env.VITE_TICKETMASTER_API_KEY

export async function fetchEvents({ city, category, startDate, endDate, keyword } = {}) {
  const params = new URLSearchParams({ apikey: API_KEY })

  if (keyword) params.append('keyword', keyword)
  if (city) params.append('city', city)
  if (category) params.append('classificationName', category)
  if (startDate) params.append('startDateTime', `${startDate}T00:00:00Z`)
  if (endDate) params.append('endDateTime', `${endDate}T23:59:59Z`)

  try {
    const response = await fetch(`${BASE_URL}?${params.toString()}`)

    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`)
    }

    const data = await response.json()
    const events = normalizeEvents(data)

    // API returned successfully but with zero results — not an error,
    // so we return the empty array as-is rather than falling back.
    return { events, error: null, usedFallback: false }
  } catch (err) {
    console.error('Ticketmaster fetch failed, using mock fallback:', err)
    return {
      events: filterMockEvents({ city, category, startDate, endDate, keyword }),
      error: 'Live event data is unavailable right now. Showing sample events instead.',
      usedFallback: true,
    }
  }
}

function normalizeEvents(rawData) {
  const events = rawData._embedded?.events || []
  return events.map((event) => ({
    id: event.id,
    name: event.name,
    date: event.dates?.start?.localDate ?? 'TBA',
    time: event.dates?.start?.localTime ?? null,
    image: event.images?.find((img) => img.width > 500)?.url ?? event.images?.[0]?.url,
    venue: event._embedded?.venues?.[0]?.name ?? 'Unknown venue',
    city: event._embedded?.venues?.[0]?.city?.name ?? '',
    category: event.classifications?.[0]?.segment?.name ?? 'Uncategorized',
    priceRange: event.priceRanges
      ? `$${event.priceRanges[0].min} - $${event.priceRanges[0].max}`
      : 'Price not available',
    ticketUrl: event.url,
  }))
}

// Mirrors the same filters against local mock data so the fallback
// still respects whatever the user searched for.
function filterMockEvents({ city, category, startDate, endDate, keyword }) {
  return mockEvents.filter((event) => {
    const matchesCity = !city || event.city?.toLowerCase().includes(city.toLowerCase())
    const matchesCategory = !category || event.category === category
    const matchesKeyword =
      !keyword ||
      [event.name, event.venue, event.city, event.category]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(keyword.toLowerCase()))
    const matchesStart = !startDate || event.date >= startDate
    const matchesEnd = !endDate || event.date <= endDate

    return matchesCity && matchesCategory && matchesKeyword && matchesStart && matchesEnd
  })
}