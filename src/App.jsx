
import EventGrid from './components/EventGrid'
import FeaturedBanner from './components/FeaturedBanner'
import NavBar from './components/NavBar'
import SearchBar from './components/SearchBar'
import EventDetailModal from './components/EventDetailModal'
import { mockEvents } from './data/mockEvents'
import { getNextEvent } from './utils/nextEvent'
import { useEvents } from './utils/useEvents'
import { useState, useEffect } from 'react'
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


  // Role 4: Event Detail Modal state management
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)


  // === ROLE 1: fetch live events on load, with automatic mock fallback ===
  // See src/services/eventsApi.js — tries Ticketmaster first, falls back
  // to mockEvents internally if the live call fails. App.jsx just renders
  // whatever comes back, without needing to know which source it was.
const { events: apiEvents, loading: apiLoading, error: apiError, fetchEvents } = useEvents()

  useEffect(() => {
    fetchEvents({})
  }, [fetchEvents])

  //Temporary test
  // useEffect(() => {
  // fetchEvents({ city: 'New York', category: 'Music' })
  // }, [])

  // useEffect(() => {
  // console.log('Events:', apiEvents)
  // console.log('Error:', apiError)
  // }, [apiEvents, apiError])


  const handleOpenModal = (event) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedEvent(null)
  }

  // NEW CHANGE: Replaced mockEvents with apiEvents to get the data from API
  // TODO: replace mockEvents with Ticketmaster results (map through normalizeEvent),
  // passing `query` as the API keyword instead of filtering locally.

  const categories = [...new Set(apiEvents.map((e) => e.category).filter(Boolean))].sort()
  const nextEvent = getNextEvent(apiEvents)
  //const events = apiEvents.filter(
    //(event) =>
     // matchesQuery(event, query) && (category === 'all' || event.category === category),
 // )
  const clearFilters = () => {
    setCity('')
    setStartDate('')
    setEndDate('')
    setCategory('')
    setQuery('')
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

  //   // === ROLE 1: now derived from apiEvents instead of mockEvents directly ===
  // // (mockEvents is still imported above — it's used internally as the
  // // fallback inside eventsApi.js, not referenced here anymore.)
  // const categories = [...new Set(apiEvents.map((e) => e.category).filter(Boolean))].sort()
  // const nextEvent = getNextEvent(apiEvents)
  // const events = apiEvents.filter(
  //   (event) =>
  //     matchesQuery(event, query) && (category === 'all' || event.category === category),
  // )
  // // === END ROLE 1 ===

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
        <FeaturedBanner event={nextEvent} onSelect={handleOpenModal}/>
        {apiError && (
          <p className="app__notice" role="status">
            {apiError}
          </p>
        )}
        <EventGrid events={events} loading={apiLoading} onEventClick={handleOpenModal}/>
        
        {/* Pass onEventClick handler so Role 3 (EventGrid/Cards) can trigger your modal */}
      </main>

      {/* Role 4 Drawer Component */}

      <EventDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        event={selectedEvent}
      />
    </>
  )
}

export default App