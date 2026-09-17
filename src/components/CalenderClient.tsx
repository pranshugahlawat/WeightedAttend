"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

type CalEvent = { title: string; start: string; allDay: boolean; color?: string };

export default function CalendarClient() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/calendar?monthOffset=0", { cache: "no-store" });
      const data = await res.json();
      setEvents(data.events ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="font-semibold">Calendar (Bonus)</div>
      <div className="text-xs text-neutral-500 mt-1">Holidays + attendance markers</div>

      {loading ? <div className="mt-3">Loading…</div> : null}

      <div className="mt-3">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          height="auto"
          dayMaxEvents={true}
          eventDisplay="block"
        />
      </div>
    </div>
  );
}