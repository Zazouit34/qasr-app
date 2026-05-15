"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  EventInput,
  DateSelectArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    qasrEventId?: string;
    status?: string;
  };
}

function statusToColor(status: string): string {
  switch (status) {
    case "CONFIRMED":
      return "Primary";
    case "PENDING":
    case "QUOTE_SENT":
    case "INQUIRY":
      return "Warning";
    case "COMPLETED":
      return "Success";
    case "CANCELLED":
    case "NO_SHOW":
      return "Danger";
    default:
      return "Primary";
  }
}

const Calendar: React.FC = () => {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  const loadEvents = useCallback(async (start: Date, end: Date) => {
    const params = new URLSearchParams({
      limit: "500",
      from: start.toISOString(),
      to: end.toISOString(),
    });
    const res = await fetch(`/api/events?${params}`, { credentials: "include" });
    if (!res.ok) return;
    const json = await res.json();
    const items = (json.data?.items ?? []) as {
      id: string;
      title: string;
      eventDate: string;
      status: string;
    }[];
    const fc: CalendarEvent[] = items.map((e) => ({
      id: e.id,
      title: e.title,
      start: e.eventDate.split("T")[0],
      allDay: true,
      extendedProps: {
        calendar: statusToColor(e.status),
        qasrEventId: e.id,
        status: e.status,
      },
    }));
    setEvents(fc);
  }, []);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) void loadEvents(api.view.activeStart, api.view.activeEnd);
  }, [loadEvents]);

  const handleDatesSet = (arg: { start: Date; end: Date }) => {
    void loadEvents(arg.start, arg.end);
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    setEventStartDate(selectInfo.startStr);
    setEventEndDate(selectInfo.endStr || selectInfo.startStr);
    openModal();
  };

  const goToNewEventForm = () => {
    const q = new URLSearchParams();
    if (eventStartDate) q.set("date", eventStartDate);
    if (eventEndDate && eventEndDate !== eventStartDate)
      q.set("endDate", eventEndDate);
    const qs = q.toString();
    router.push(qs ? `/events/new?${qs}` : "/events/new");
    closeModal();
    resetModalFields();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const qid = clickInfo.event.extendedProps?.qasrEventId as string | undefined;
    if (qid) {
      router.push(`/events/${qid}`);
      return;
    }
    const event = clickInfo.event;
    setSelectedEvent(event as unknown as CalendarEvent);
    setEventTitle(event.title);
    setEventStartDate(event.start?.toISOString().split("T")[0] ?? "");
    setEventEndDate(event.end?.toISOString().split("T")[0] ?? "");
    setEventLevel(String(event.extendedProps.calendar ?? ""));
    openModal();
  };

  const handleAddOrUpdateEvent = () => {
    if (selectedEvent?.extendedProps?.qasrEventId) {
      router.push(`/events/${selectedEvent.extendedProps.qasrEventId}`);
      closeModal();
      resetModalFields();
      return;
    }
    if (selectedEvent) {
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === selectedEvent.id
            ? {
                ...ev,
                title: eventTitle,
                start: eventStartDate,
                end: eventEndDate,
                extendedProps: { calendar: eventLevel },
              }
            : ev,
        ),
      );
    }
    closeModal();
    resetModalFields();
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("");
    setSelectedEvent(null);
  };

  return (
    <div className="rounded-2xl border  border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="custom-calendar">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next addEventButton",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          selectable={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          eventContent={renderEventContent}
          customButtons={{
            addEventButton: {
              text: "Add Event +",
              click: () => {
                resetModalFields();
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
              {selectedEvent?.extendedProps?.qasrEventId
                ? "Événement"
                : selectedEvent
                  ? "Modifier l’événement (local)"
                  : "Nouvelle réservation"}
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedEvent?.extendedProps?.qasrEventId
                ? "Ouvrez la fiche complète pour paiements, contrat et checklist."
                : "Choisissez une date sur le calendrier puis continuez vers le formulaire Qasr (prérempli)."}
            </p>
          </div>
          <div className="mt-8">
            {selectedEvent?.extendedProps?.qasrEventId ? (
              <div className="space-y-4">
                <p className="text-theme-sm text-gray-700 dark:text-gray-300">
                  Cet événement est enregistré dans Qasr. Utilisez la fiche
                  détaillée pour tout modifier.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/events/${selectedEvent.extendedProps.qasrEventId}`,
                    )
                  }
                  className="btn flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
                >
                  Voir l’événement
                </button>
              </div>
            ) : (
              <>
                <div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Titre (aperçu local)
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
                    Couleur (aperçu)
                  </label>
                  <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                    {Object.entries({
                      Danger: "danger",
                      Success: "success",
                      Primary: "primary",
                      Warning: "warning",
                    }).map(([key, value]) => (
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
                    Date de début
                  </label>
                  <div className="relative">
                    <input
                      id="event-start-date"
                      type="date"
                      value={eventStartDate}
                      onChange={(e) => setEventStartDate(e.target.value)}
                      className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Date de fin
                  </label>
                  <div className="relative">
                    <input
                      id="event-end-date"
                      type="date"
                      value={eventEndDate}
                      onChange={(e) => setEventEndDate(e.target.value)}
                      className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
            <button
              onClick={closeModal}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            >
              Fermer
            </button>
            {selectedEvent?.extendedProps?.qasrEventId ? null : (
              <button
                onClick={
                  selectedEvent ? handleAddOrUpdateEvent : goToNewEventForm
                }
                type="button"
                className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
              >
                {selectedEvent
                  ? "Enregistrer (aperçu local)"
                  : "Continuer vers la réservation"}
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

const renderEventContent = (eventInfo: EventContentArg) => {
  const cal = String(eventInfo.event.extendedProps.calendar ?? "Primary");
  const colorClass = `fc-bg-${cal.toLowerCase()}`;
  const strike =
    eventInfo.event.extendedProps.status === "CANCELLED"
      ? "line-through opacity-70"
      : "";
  return (
    <div
      className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm ${strike}`}
    >
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};

export default Calendar;
