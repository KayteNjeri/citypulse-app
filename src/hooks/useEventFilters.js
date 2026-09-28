/*
import {useState, useEffect} from 'react';

export function useEventFilters (events = []) {
    const [city, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    

    const filtered = useMemo(() => {
        if (!Array.isArray(events)) return [];
        return events.filter(event => {
            const q = city.toLowerCase().trim();
            const matchLoc = !q ||
                (event.city || '').toLowerCase().includes(q)

            let matchDate = true;
            try {
                if (event.date && (startDate || endDate)) {
                    const d = new Date(event.date)
                }
                if (startDate) {
                    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
                    if (d < start) matchDate = false;
                }
                if (endDate) {
                    const end = new Date(endDate); end.setHours(23, 59, 59, 999);
                    if (d > end) matchDate = false;
                }
            } catch { matchDate = true }
            
            return matchLoc && matchDate;
        })
    }, [events, city, startDate, endDate]);

const clearFilters = () => {
    setCity('');
    setStartDate('');
    setEndDate('');
}
return {
    city, setCity, startDate, setStartDate, endDate, setEndDate, filtered: locationDateFiltered, clearFilters
}
}
*/