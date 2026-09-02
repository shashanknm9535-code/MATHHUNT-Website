'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Event } from '@/types';
import { eventApi, isMockMode } from '@/lib/api';
import { MOCK_EVENT } from '@/lib/mock/mockData';

interface EventContextType {
  events: Event[];
  selectedEvent: Event | null;
  selectedEventId: string;
  loadingEvents: boolean;
  eventsError: string | null;
  setSelectedEventId: (id: string) => void;
  refreshEvents: () => Promise<void>;
}

const EventContext = createContext<EventContextType>({
  events: [],
  selectedEvent: null,
  selectedEventId: '',
  loadingEvents: false,
  eventsError: null,
  setSelectedEventId: (_id: string) => {},
  refreshEvents: async () => {},
});

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mock = isMockMode();
  const [events, setEvents] = useState<Event[]>(mock ? [MOCK_EVENT] : []);
  const [selectedEventId, setSelectedEventIdState] = useState<string>(mock ? MOCK_EVENT.id : '');
  const [loadingEvents, setLoadingEvents] = useState<boolean>(!mock);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (mock) {
      setEvents([MOCK_EVENT]);
      setSelectedEventIdState(MOCK_EVENT.id);
      setLoadingEvents(false);
      return;
    }

    setLoadingEvents(true);
    setEventsError(null);
    const res = await eventApi.listEvents(1, 50);
    setLoadingEvents(false);

    if (res.success && res.data && Array.isArray(res.data.items) && res.data.items.length > 0) {
      setEvents(res.data.items);
      setSelectedEventIdState((prev) => {
        const exists = res.data!.items.some((ev) => ev.id === prev);
        return exists ? prev : res.data!.items[0].id;
      });
    } else {
      setEvents([]);
      setSelectedEventIdState('');
      if (!res.success) {
        setEventsError(res.error || 'Failed to fetch active events from backend.');
      }
    }
  }, [mock]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const setSelectedEventId = (id: string) => {
    setSelectedEventIdState(id);
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId) || (events.length > 0 ? events[0] : null);

  return (
    <EventContext.Provider
      value={{
        events,
        selectedEvent,
        selectedEventId,
        loadingEvents,
        eventsError,
        setSelectedEventId,
        refreshEvents: fetchEvents,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => useContext(EventContext);
