/**
 * "Add to calendar" for events: a Google Calendar link and an .ics file (Apple
 * Calendar, Outlook, most phone calendars). Event times are Bangladesh wall-clock
 * values without an offset (see AppClock on the API), so they're pinned to +06:00
 * here — a visitor abroad still gets the right moment in their own calendar.
 */

export interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  eventDate: string;
  endDate: string | null;
  venue: string | null;
}

/** Events without an end get this long a slot. */
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

/** "2026-12-12T16:00:00" (Dhaka time) → a real instant. Values with an offset/Z pass through. */
export function eventInstant(value: string): Date {
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasZone ? value : `${value}+06:00`);
}

function range(ev: CalendarEvent): [Date, Date] {
  const start = eventInstant(ev.eventDate);
  const end = ev.endDate ? eventInstant(ev.endDate) : new Date(start.getTime() + DEFAULT_DURATION_MS);
  return [start, end > start ? end : new Date(start.getTime() + DEFAULT_DURATION_MS)];
}

/** 20261212T100000Z */
function utcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function googleCalendarUrl(ev: CalendarEvent, pageUrl: string): string {
  const [start, end] = range(ev);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: `${utcStamp(start)}/${utcStamp(end)}`,
    details: [ev.description, pageUrl].filter(Boolean).join('\n\n'),
    location: ev.venue ?? '',
    ctz: 'Asia/Dhaka'
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** RFC 5545 text escaping. */
function icsText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1');
}

/** Lines longer than 75 octets must be folded (approximated by characters). */
function fold(line: string): string {
  const parts: string[] = [];
  for (let i = 0; i < line.length; i += 73) parts.push((i ? ' ' : '') + line.slice(i, i + 73));
  return parts.join('\r\n');
}

export function icsContent(ev: CalendarEvent, pageUrl: string): string {
  const [start, end] = range(ev);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UPSAA//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:upsaa-event-${ev.id}@uttaranalumni.org`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${utcStamp(start)}`,
    `DTEND:${utcStamp(end)}`,
    `SUMMARY:${icsText(ev.title)}`,
    ...(ev.venue ? [`LOCATION:${icsText(ev.venue)}`] : []),
    `DESCRIPTION:${icsText([ev.description, pageUrl].filter(Boolean).join('\n\n'))}`,
    `URL:${pageUrl}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** Browser only: saves the .ics file. */
export function downloadIcs(ev: CalendarEvent, pageUrl: string): void {
  const blob = new Blob([icsContent(ev, pageUrl)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `upsaa-event-${ev.id}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
