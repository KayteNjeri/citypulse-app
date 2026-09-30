import EventGrid from "../components/EventGrid.jsx"
import { mockEvents } from "../data/mockEvents.js"

export const morning_events = mockEvents.filter((morning) => 
    parseInt(morning.time) <= 11.99)


//console.log(morning_events)

export const afternoon_events = mockEvents.filter((afternoon) =>
    parseInt(afternoon.time) >= 12 && parseInt(afternoon.time) <= 16.5) 

//console.log(afternoon_events)

export const evening_events = mockEvents.filter((evening) =>
    parseInt(evening.time) <= 23.99 && parseInt(evening.time) >= 17)

//console.log(evening_events)

