import EventCard from './EventCard'
import './RecommendedRow.css'

// "Recommended for you": a horizontally scrolling row of event cards, with a short reason
// ("Because you saved Music events in Nairobi"). Renders nothing when there's nothing to show.
function RecommendedRow({ events = [], reason, onEventClick, savedEventIds = [], savingEventIds = [], onToggleSave }) {
  if (!events.length) return null

  return (
    <section className="recommended" aria-labelledby="recommended-title">
      <div className="recommended__header">
        <h2 id="recommended-title" className="app__section-title recommended__title">
          Recommended for you
        </h2>
        {reason && <p className="recommended__reason">{reason}</p>}
      </div>
      <ul className="recommended__row">
        {events.map((event) => (
          <li key={event.id} className="recommended__item">
            <EventCard
              event={event}
              onSelect={onEventClick}
              saved={savedEventIds.includes(event.id)}
              saving={savingEventIds.includes(event.id)}
              onToggleSave={onToggleSave ? () => onToggleSave(event) : undefined}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default RecommendedRow
