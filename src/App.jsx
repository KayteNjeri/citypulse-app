import { useState } from 'react'
import EventGrid from './components/EventGrid'
import FeaturedBanner from './components/FeaturedBanner'
import NavBar from './components/NavBar'
import SearchBar from './components/SearchBar'
import { mockEvents } from './data/mockEvents'
import { getNextEvent } from './utils/nextEvent'
import './App.css'
import DateFilterBar from './components/DateFilterBar'

function matchesQuery(event, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [event.name, event.venue, event.city, event.category]
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(q))
}

function App() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  // TODO: replace with real authentication once the auth flow exists.
  const [user, setUser] = useState(null)
  const [city, setCity] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // TODO: replace mockEvents with Ticketmaster results (map through normalizeEvent),
  // passing `query` as the API keyword instead of filtering locally.
  const categories = [...new Set(mockEvents.map((e) => e.category).filter(Boolean))].sort()
  const nextEvent = getNextEvent(mockEvents)
  const clearFilters = () => {
    setCity('')
    setStartDate('')
    setEndDate('')
  }
  const events = mockEvents.filter(
    (event) => {
      const okq = matchesQuery(event, query)
      const okc = category === 'all' || event.category === category
      const q = city.trim().toLowerCase()
      const okCity = !q || (event.city || '').toLowerCase().includes(q)
      let okd = true
      try {
        if (event.date && (startDate || endDate)) {
          const d = new Date(event.date)
          if (startDate) {
            const start = new Date(startDate); start.setHours(0, 0, 0, 0);
            if (d < start) okd = false;
          }
          if (endDate) {
            const end = new Date(endDate); end.setHours(23, 59, 59, 999);
            if (d > end) okd = false;
          }
        }
      } catch { okd = true }
      return okq && okc && okCity&& okd
})

  return (
    <>
      <NavBar
        user={user}
        onLogin={() => setUser({ name: 'Demo User' })}
        onLogout={() => setUser(null)}
        categories={categories}
        category={category}
        onCategoryChange={setCategory}
      />
      <main className="app">
        <h1 className="visually-hidden">Group2 events</h1>
        <SearchBar value={query} onChange={setQuery} />
        <DateFilterBar 
        city={city} setCity={setCity} 
        startDate={startDate} setStartDate={setStartDate} 
        endDate={endDate} setEndDate={setEndDate} filtered={events} clearFilters={clearFilters} />
        <FeaturedBanner event={nextEvent} />
        <EventGrid events={events} />
      </main>
    </>
  )
}

export default App
