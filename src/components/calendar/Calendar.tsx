"use client";
import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import rrulePlugin from "@fullcalendar/rrule";
import {
  EventInput,
  DateSelectArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    description?: string;
    recurrence?: string;
    reminders?: number[];
  };
}

interface ScheduledReminder {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDescription?: string;
  reminderTime: number;
  timeoutId: NodeJS.Timeout;
}

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventDescription, setEventDescription] = useState("");
  const [eventAllDay, setEventAllDay] = useState(false);
  const [eventReminders, setEventReminders] = useState<number[]>([30]);
  const [eventRecurrence, setEventRecurrence] = useState<
    "none" | "daily" | "weekly" | "monthly"
  >("none");
  const [scheduledReminders, setScheduledReminders] = useState<ScheduledReminder[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  // Request notification permission on component mount
  useEffect(() => {
    const requestNotificationPermission = async () => {
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
      }
    };

    if (notificationPermission === "default") {
      requestNotificationPermission();
    }
  }, [notificationPermission]);

  // Clear all scheduled reminders on unmount
  useEffect(() => {
    return () => {
      scheduledReminders.forEach(reminder => {
        clearTimeout(reminder.timeoutId);
      });
    };
  }, [scheduledReminders]);

  const formatLocalDateTime = (date: Date): string => {
    const timezoneOffsetMinutes = date.getTimezoneOffset();
    const local = new Date(date.getTime() - timezoneOffsetMinutes * 60000);
    return local.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  };

  const fromLocalDateTime = (value: string): Date => {
    // value is YYYY-MM-DDTHH:mm, interpret in local time
    const [datePart, timePart] = value.split("T");
    const [y, m, d] = datePart.split("-").map((n) => parseInt(n, 10));
    const [hh, mm] = (timePart || "00:00").split(":").map((n) => parseInt(n, 10));
    return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  };

  const computeDurationMinutes = (
    startLocal: string,
    endLocal: string
  ): number => {
    const start = fromLocalDateTime(startLocal);
    const end = fromLocalDateTime(endLocal);
    const diff = Math.max(0, end.getTime() - start.getTime());
    return Math.round(diff / 60000);
  };

  const toLocalDateOnlyString = (date: Date): string => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const ensureEndAfterStart = (
    startVal: string,
    endVal: string,
    isAllDay: boolean
  ): string => {
    const start = fromLocalDateTime(startVal);
    const end = fromLocalDateTime(endVal);
    if (end.getTime() > start.getTime()) return endVal;
    if (isAllDay) {
      const nextDay = new Date(start);
      nextDay.setDate(start.getDate() + 1);
      return `${toLocalDateOnlyString(nextDay)}T00:00`;
    }
    const plusHour = new Date(start.getTime() + 60 * 60000);
    return formatLocalDateTime(plusHour);
  };

  const handleAllDayChange = (checked: boolean) => {
    setEventAllDay(checked);
    const start = fromLocalDateTime(eventStartDate || formatLocalDateTime(new Date()));
    if (checked) {
      const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endNext = new Date(startMidnight);
      endNext.setDate(endNext.getDate() + 1);
      setEventStartDate(`${toLocalDateOnlyString(startMidnight)}T00:00`);
      setEventEndDate(`${toLocalDateOnlyString(endNext)}T00:00`);
    } else {
      const endVal = ensureEndAfterStart(eventStartDate, eventEndDate, false);
      setEventEndDate(endVal);
    }
  };

  const handleStartInputChange = (value: string) => {
    setEventStartDate(value);
    setEventEndDate(ensureEndAfterStart(value, eventEndDate, eventAllDay));
  };

  const handleEndInputChange = (value: string) => {
    setEventEndDate(ensureEndAfterStart(eventStartDate, value, eventAllDay));
  };

  // Schedule reminders for an event
  const scheduleReminders = (event: CalendarEvent) => {
    const reminders = event.extendedProps.reminders || [];
    const eventStart = typeof event.start === 'string' ? new Date(event.start) : 
                      event.start instanceof Date ? event.start : null;
    
    if (!eventStart) return;
    
    // Clear existing reminders for this event
    const existingReminders = scheduledReminders.filter(r => r.eventId === event.id);
    existingReminders.forEach(reminder => {
      clearTimeout(reminder.timeoutId);
    });

    const newScheduledReminders: ScheduledReminder[] = [];

    reminders.forEach(minutesBefore => {
      const reminderTime = eventStart.getTime() - (minutesBefore * 60 * 1000);
      const now = Date.now();
      
      // Only schedule if reminder time is in the future
      if (reminderTime > now) {
        const delay = reminderTime - now;
        const timeoutId = setTimeout(() => {
          showNotification(event.title || 'Event', event.extendedProps.description);
        }, delay);

        newScheduledReminders.push({
          id: `${event.id}-${minutesBefore}`,
          eventId: event.id || '',
          eventTitle: event.title || 'Event',
          eventDescription: event.extendedProps.description,
          reminderTime,
          timeoutId
        });
      }
    });

    // Update scheduled reminders
    setScheduledReminders(prev => [
      ...prev.filter(r => r.eventId !== event.id),
      ...newScheduledReminders
    ]);
  };

  // Show browser notification
  const showNotification = (title: string, description?: string) => {
    if (notificationPermission === "granted" && "Notification" in window) {
      new Notification(title, {
        body: description || "Event starting soon",
        icon: "/favicon.ico",
        tag: "calendar-reminder",
        requireInteraction: false
      });
    }
  };

  // Schedule reminders for all events
  const scheduleAllReminders = () => {
    events.forEach(event => {
      if (event.extendedProps.reminders && event.extendedProps.reminders.length > 0) {
        scheduleReminders(event);
      }
    });
  };

  const calendarsEvents = {
    Danger: "danger",
    Success: "success",
    Primary: "primary",
    Warning: "warning",
  };

  useEffect(() => {
    // Initialize with some events
    const initialEvents: CalendarEvent[] = [
      {
        id: "1",
        title: "Event Conf.",
        start: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
        end: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
        extendedProps: { calendar: "Danger", reminders: [30] },
      },
      {
        id: "2",
        title: "Meeting",
        start: new Date(Date.now() + 86400000).toISOString(),
        end: new Date(Date.now() + 86400000 + 3600000).toISOString(),
        extendedProps: { calendar: "Success", reminders: [15, 60] },
      },
      {
        id: "3",
        title: "Workshop",
        start: new Date(Date.now() + 172800000).toISOString(),
        end: new Date(Date.now() + 172800000 + 2 * 3600000).toISOString(),
        extendedProps: { calendar: "Primary", reminders: [30] },
      },
    ];
    
    setEvents(initialEvents);
  }, []);

  // Schedule reminders when events change
  useEffect(() => {
    if (events.length > 0) {
      scheduleAllReminders();
    }
  }, [events]);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    const start = new Date(selectInfo.start);
    const end = selectInfo.end
      ? new Date(selectInfo.end)
      : new Date(start.getTime() + 60 * 60 * 1000);
    setEventStartDate(formatLocalDateTime(start));
    setEventEndDate(formatLocalDateTime(end));
    setEventAllDay(selectInfo.allDay ?? false);
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent(event as unknown as CalendarEvent);
    setEventTitle(event.title);
    setEventStartDate(event.start ? formatLocalDateTime(event.start) : "");
    setEventEndDate(event.end ? formatLocalDateTime(event.end) : "");
    setEventLevel(event.extendedProps.calendar);
    setEventDescription(event.extendedProps.description ?? "");
    setEventAllDay(event.allDay ?? false);
    setEventRecurrence((event.extendedProps as any)?.recurrence ?? "none");
    setEventReminders(event.extendedProps.reminders || [30]);
    openModal();
  };

  const handleAddOrUpdateEvent = () => {
    const durationMinutes = computeDurationMinutes(
      eventStartDate,
      eventEndDate
    );
    const startIso = fromLocalDateTime(eventStartDate).toISOString();
    const endIso = fromLocalDateTime(eventEndDate).toISOString();

    if (selectedEvent) {
      // Update existing event
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === selectedEvent.id
            ? {
                ...event,
                title: eventTitle,
                // if recurring, keep rrule + duration, else set start/end
                ...(eventRecurrence !== "none"
                  ? {
                      rrule: {
                        freq: eventRecurrence.toUpperCase(),
                        dtstart: startIso,
                      } as any,
                      duration: { minutes: Math.max(1, durationMinutes) } as any,
                      start: undefined,
                      end: undefined,
                    }
                  : {
                      start: startIso,
                      end: endIso,
                      rrule: undefined,
                      duration: undefined,
                    }),
                allDay: eventAllDay,
                extendedProps: {
                  calendar: eventLevel,
                  description: eventDescription || undefined,
                  recurrence: eventRecurrence,
                  reminders: eventReminders,
                },
              }
            : event
        )
      );
    } else {
      // Add new event
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: eventTitle,
        ...(eventRecurrence !== "none"
          ? {
              rrule: {
                freq: eventRecurrence.toUpperCase(),
                dtstart: startIso,
              } as any,
              duration: { minutes: Math.max(1, durationMinutes) } as any,
            }
          : {
              start: startIso,
              end: endIso,
            }),
        allDay: eventAllDay,
        extendedProps: {
          calendar: eventLevel,
          description: eventDescription || undefined,
          recurrence: eventRecurrence,
          reminders: eventReminders,
        },
      };
      setEvents((prevEvents) => [...prevEvents, newEvent]);
    }
    closeModal();
    resetModalFields();
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("");
    setEventDescription("");
    setEventAllDay(false);
    setEventReminders([30]);
    setEventRecurrence("none");
    setSelectedEvent(null);
  };

  return (
    <div className="rounded-2xl border  border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="custom-calendar">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next addEventButton",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          selectable={true}
          editable={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          eventDrop={(info) => {
            const { event } = info;
            setEvents((prev) =>
              prev.map((e) =>
                e.id === event.id
                  ? (e as any).rrule
                    ? {
                        ...e,
                        rrule: {
                          ...(e as any).rrule,
                          dtstart: event.start?.toISOString() ?? (e as any).rrule?.dtstart,
                        },
                        duration: event.end && event.start
                          ? { minutes: Math.max(1, Math.round((event.end.getTime() - event.start.getTime()) / 60000)) }
                          : (e as any).duration,
                        allDay: event.allDay,
                      }
                    : {
                        ...e,
                        start: event.start?.toISOString() ?? e.start,
                        end: event.end?.toISOString() ?? e.end,
                        allDay: event.allDay,
                      }
                  : e
              )
            );
          }}
          eventResize={(info) => {
            const { event } = info;
            setEvents((prev) =>
              prev.map((e) =>
                e.id === event.id
                  ? (e as any).rrule
                    ? {
                        ...e,
                        duration: event.end && event.start
                          ? { minutes: Math.max(1, Math.round((event.end.getTime() - event.start.getTime()) / 60000)) }
                          : (e as any).duration,
                      }
                    : {
                        ...e,
                        end: event.end?.toISOString() ?? e.end,
                      }
                  : e
              )
            );
          }}
          customButtons={{
            addEventButton: {
              text: "Add Event +",
              click: () => {
                resetModalFields();
                const now = new Date();
                const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
                setEventStartDate(formatLocalDateTime(now));
                setEventEndDate(formatLocalDateTime(inOneHour));
                setEventAllDay(false);
                setEventReminders([30]);
                setEventRecurrence("none");
                openModal();
              },
            },
          }}
        />
      </div>
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[700px] p-6 lg:p-10"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              {selectedEvent ? "Edit Event" : "Add Event"}
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Plan your next big moment: schedule or edit an event to stay on
              track
            </p>
          </div>
          <div className="mt-8">
            <div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Event Title
                </label>
                <input
                  id="event-title"
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>
            <div className="mt-6">
              <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">
                Event Color
              </label>
              <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                {Object.entries(calendarsEvents).map(([key, value]) => (
                  <div key={key} className="n-chk">
                    <div
                      className={`form-check form-check-${value} form-check-inline`}
                    >
                      <label
                        className="flex items-center text-sm text-gray-700 form-check-label dark:text-gray-400"
                        htmlFor={`modal${key}`}
                      >
                        <span className="relative">
                          <input
                            className="sr-only form-check-input"
                            type="radio"
                            name="event-level"
                            value={key}
                            id={`modal${key}`}
                            checked={eventLevel === key}
                            onChange={() => setEventLevel(key)}
                          />
                          <span className="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full box dark:border-gray-700">
                            <span
                              className={`h-2 w-2 rounded-full bg-white ${
                                eventLevel === key ? "block" : "hidden"
                              }`}  
                            ></span>
                          </span>
                        </span>
                        {key}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Start date & time
              </label>
              <div className="relative">
                <input
                  id="event-start-date"
                  type="datetime-local"
                  value={eventStartDate}
                  onChange={(e) => handleStartInputChange(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                End date & time
              </label>
              <div className="relative">
                <input
                  id="event-end-date"
                  type="datetime-local"
                  value={eventEndDate}
                  onChange={(e) => handleEndInputChange(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <input
                id="event-all-day"
                type="checkbox"
                checked={eventAllDay}
                onChange={(e) => handleAllDayChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700"
              />
              <label htmlFor="event-all-day" className="text-sm text-gray-700 dark:text-gray-400">
                All day
              </label>
            </div>

            <div className="mt-6">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Reminders
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {eventReminders.map((min, idx) => (
                  <span key={`${min}-${idx}`} className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1 text-xs dark:border-gray-700">
                    {min} min
                    <button
                      type="button"
                      onClick={() => setEventReminders((arr) => arr.filter((_, i) => i !== idx))}
                      className="text-gray-500 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setEventReminders((arr) => [...arr, 30])}
                  className="rounded border border-gray-300 px-2.5 py-1 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
                >
                  + Add 30 min
                </button>
              </div>
              {notificationPermission === "denied" && (
                <p className="mt-2 text-xs text-red-500">
                  Notifications are blocked. Please enable them in your browser settings.
                </p>
              )}
            </div>

            <div className="mt-6">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Repeat
              </label>
              <select
                id="event-recurrence"
                value={eventRecurrence}
                onChange={(e) => setEventRecurrence(e.target.value as any)}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              >
                <option value="none">Doesn't repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="mt-6">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Description
              </label>
              <textarea
                id="event-description"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                rows={4}
                className="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
            <button
              onClick={closeModal}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            >
              Close
            </button>
            <button
              onClick={handleAddOrUpdateEvent}
              type="button"
              className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
            >
              {selectedEvent ? "Update Changes" : "Add Event"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const renderEventContent = (eventInfo: EventContentArg) => {
  const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar.toLowerCase()}`;
  return (
    <div
      className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}
    >
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};

export default Calendar;
