"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";
import Popover from "@mui/material/Popover";
import Tooltip from "@mui/material/Tooltip";
import Avatar from "@mui/material/Avatar";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ViewWeekIcon from "@mui/icons-material/ViewWeek";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewDayIcon from "@mui/icons-material/ViewDay";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useTheme as useAppTheme } from "@/context/ThemeContext";
import { EventInput, EventClickArg } from "@fullcalendar/core";

const lightTheme = createTheme({ palette: { mode: "light" } });

export default function MuiCalendarPage() {
  const calendarRef = React.useRef<FullCalendar | null>(null);
  const [currentView, setCurrentView] = React.useState<"dayGridMonth" | "timeGridWeek" | "timeGridDay">("dayGridMonth");
  const { theme } = useAppTheme();
  const muiTheme = React.useMemo(() => {
    // Pull brand color tokens from CSS variables to align with dashboard
    if (typeof window !== "undefined") {
      const root = getComputedStyle(document.documentElement);
      const brand500 = root.getPropertyValue("--color-brand-500").trim() || "#465fff";
      const brand600 = root.getPropertyValue("--color-brand-600").trim() || "#3641f5";
      const brand300 = root.getPropertyValue("--color-brand-300").trim() || "#9cb9ff";
      return createTheme({
        palette: {
          mode: theme,
          primary: { main: brand500, dark: brand600, light: brand300 },
        },
        shape: { borderRadius: 12 },
        components: {
          MuiButton: { styleOverrides: { root: { textTransform: "none", borderRadius: 10 } } },
          MuiChip: { styleOverrides: { root: { borderRadius: 10 } } },
          MuiPaper: { styleOverrides: { root: { borderRadius: 16 } } },
          MuiTextField: { defaultProps: { size: "small", variant: "outlined" } },
        },
      });
    }
    return createTheme({ palette: { mode: theme } });
  }, [theme]);
  const [events, setEvents] = React.useState<EventInput[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [toast, setToast] = React.useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>(
    { open: false, message: "", severity: "info" }
  );

  // Create menu state
  const [createMenuAnchor, setCreateMenuAnchor] = React.useState<null | HTMLElement>(null);
  const openCreateMenu = (e: React.MouseEvent<HTMLButtonElement>) => setCreateMenuAnchor(e.currentTarget);
  const closeCreateMenu = () => setCreateMenuAnchor(null);

  // Event modal state
  const [openEventModal, setOpenEventModal] = React.useState(false);
  const [eventTitle, setEventTitle] = React.useState("");
  const [eventAllDay, setEventAllDay] = React.useState(false);
  const [eventStart, setEventStart] = React.useState(""); // YYYY-MM-DDTHH:mm
  const [eventEnd, setEventEnd] = React.useState("");
  const [eventDescription, setEventDescription] = React.useState("");
  const [eventReminders, setEventReminders] = React.useState<number[]>([30]);

  // Task modal state
  const [openTaskModal, setOpenTaskModal] = React.useState(false);
  const [taskTitle, setTaskTitle] = React.useState("");
  const [taskAllDay, setTaskAllDay] = React.useState(true);
  const [taskDue, setTaskDue] = React.useState("");
  const [taskDescription, setTaskDescription] = React.useState("");
  const [taskCompleted, setTaskCompleted] = React.useState(false);

  // Appointment schedule modal state
  const [openApptModal, setOpenApptModal] = React.useState(false);
  const [apptTitle, setApptTitle] = React.useState("");
  const [apptStartDate, setApptStartDate] = React.useState(""); // YYYY-MM-DD
  const [apptEndDate, setApptEndDate] = React.useState("");
  const [apptDays, setApptDays] = React.useState<{[k: number]: boolean}>({0:false,1:true,2:true,3:true,4:true,5:false,6:false});
  const [apptDayStartTime, setApptDayStartTime] = React.useState("09:00"); // HH:mm
  const [apptDayEndTime, setApptDayEndTime] = React.useState("17:00");
  const [apptSlotDurationMin, setApptSlotDurationMin] = React.useState(30);
  const [apptBufferMin, setApptBufferMin] = React.useState(0);
  const [apptLocation, setApptLocation] = React.useState("");
  const [apptDescription, setApptDescription] = React.useState("");

  const handlePrev = () => {
    calendarRef.current?.getApi().prev();
  };
  const handleNext = () => {
    calendarRef.current?.getApi().next();
  };
  const handleToday = () => {
    calendarRef.current?.getApi().today();
  };
  const switchView = (view: typeof currentView) => {
    setCurrentView(view);
    calendarRef.current?.getApi().changeView(view);
  };

  // Helpers
  const nowLocalIso = () => {
    const d = new Date();
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().slice(0,16);
  };
  const combineDateTime = (dateStr: string, timeStr: string) => {
    const [y,m,d] = dateStr.split("-").map(Number);
    const [hh,mm] = timeStr.split(":").map(Number);
    return new Date(y, (m||1)-1, d||1, hh||0, mm||0, 0, 0);
  };
  const addMinutes = (dt: Date, minutes: number) => new Date(dt.getTime() + minutes * 60000);

  // Details popover state
  const [detailsAnchor, setDetailsAnchor] = React.useState<HTMLElement | null>(null);
  const [detailsEvent, setDetailsEvent] = React.useState<any>(null);

  const closeDetails = () => {
    setDetailsAnchor(null);
    setDetailsEvent(null);
  };

  const handleEventClick = (arg: EventClickArg) => {
    setDetailsAnchor(arg.el);
    setDetailsEvent(arg.event);
  };

  const formatRange = (start?: Date | null, end?: Date | null, allDay?: boolean) => {
    if (!start) return "";
    const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" });
    const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
    const dateStr = dateFmt.format(start);
    if (allDay || !end) return `${dateStr}${allDay ? " · All day" : ""}`;
    return `${dateStr} · ${timeFmt.format(start)} – ${timeFmt.format(end)}`;
  };

  // Edit flow
  const [editing, setEditing] = React.useState<{ id: string; kind: "event" | "task" | "appointment" } | null>(null);

  const startEditFromDetails = () => {
    if (!detailsEvent) return;
    const kind = (detailsEvent.extendedProps?.type as "event" | "task" | "appointment") || "event";
    const id = String(detailsEvent.id);
    setEditing({ id, kind });

    if (kind === "event") {
      setEventTitle(detailsEvent.title || "");
      setEventAllDay(!!detailsEvent.allDay);
      setEventStart(detailsEvent.start ? new Date(detailsEvent.start.getTime() - detailsEvent.start.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
      setEventEnd(detailsEvent.end ? new Date(detailsEvent.end.getTime() - detailsEvent.end.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
      setEventDescription(detailsEvent.extendedProps?.description || "");
      setEventReminders(detailsEvent.extendedProps?.reminders || []);
      setOpenEventModal(true);
    } else if (kind === "task") {
      setTaskTitle(detailsEvent.title?.replace(/ \(Done\)$/i, "") || "");
      setTaskAllDay(!!detailsEvent.allDay);
      setTaskDue(detailsEvent.start ? new Date(detailsEvent.start.getTime() - detailsEvent.start.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
      setTaskDescription(detailsEvent.extendedProps?.description || "");
      setTaskCompleted(!!detailsEvent.extendedProps?.completed);
      setOpenTaskModal(true);
    } else {
      // appointment slot (single slot edit)
      setApptTitle(detailsEvent.title || "");
      setApptDescription(detailsEvent.extendedProps?.description || "");
      setApptLocation(detailsEvent.extendedProps?.location || "");
      // For slot, we allow editing the specific start/end only via direct input after switching to event modal style
      setEventTitle(detailsEvent.title || "");
      setEventAllDay(false);
      setEventStart(detailsEvent.start ? new Date(detailsEvent.start.getTime() - detailsEvent.start.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
      setEventEnd(detailsEvent.end ? new Date(detailsEvent.end.getTime() - detailsEvent.end.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
      setEventDescription(detailsEvent.extendedProps?.description || "");
      setEventReminders([]);
      setOpenEventModal(true);
      setEditing({ id, kind: "appointment" });
    }
    closeDetails();
  };

  const handleDeleteFromDetails = () => {
    if (!detailsEvent) return;
    const id = String(detailsEvent.id);
    setEvents((prev) => prev.filter((e) => String((e as any).id) !== id));
    // Persist delete (use POST path to avoid DELETE build issues)
    fetch(`/api/calendar/${id}/delete`, { method: "POST" })
      .then((r) => { if (!r.ok) throw new Error(); setToast({ open: true, message: "Deleted", severity: "success" }); })
      .catch(() => setToast({ open: true, message: "Failed to delete", severity: "error" }));
    closeDetails();
  };

  // Menu -> open modals
  const onChooseCreate = (kind: "event" | "task" | "appointment") => {
    closeCreateMenu();
    if (kind === "event") {
      setEventTitle("");
      setEventAllDay(false);
      const start = nowLocalIso();
      const end = new Date(new Date().getTime() + 60*60000);
      const off = end.getTimezoneOffset();
      const endIso = new Date(end.getTime() - off * 60000).toISOString().slice(0,16);
      setEventStart(start);
      setEventEnd(endIso);
      setEventDescription("");
      setEventReminders([30]);
      setOpenEventModal(true);
    } else if (kind === "task") {
      setTaskTitle("");
      setTaskAllDay(true);
      setTaskDue(nowLocalIso().slice(0,10) + "T09:00");
      setTaskDescription("");
      setTaskCompleted(false);
      setOpenTaskModal(true);
    } else if (kind === "appointment") {
      setApptTitle("");
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth()+1).padStart(2,'0');
      const dd = String(today.getDate()).padStart(2,'0');
      setApptStartDate(`${yyyy}-${mm}-${dd}`);
      const in7 = new Date(today.getTime() + 7*86400000);
      const yyyy2 = in7.getFullYear();
      const mm2 = String(in7.getMonth()+1).padStart(2,'0');
      const dd2 = String(in7.getDate()).padStart(2,'0');
      setApptEndDate(`${yyyy2}-${mm2}-${dd2}`);
      setApptDays({0:false,1:true,2:true,3:true,4:true,5:false,6:false});
      setApptDayStartTime("09:00");
      setApptDayEndTime("17:00");
      setApptSlotDurationMin(30);
      setApptBufferMin(0);
      setApptLocation("");
      setApptDescription("");
      setOpenApptModal(true);
    }
  };

  // Create handlers
  const createEvent = () => {
    if (!eventTitle || !eventStart || !eventEnd) return;
    if (editing?.kind === "event" || editing?.kind === "appointment") {
      const id = editing.id;
      setEvents((prev) => prev.map((e) => {
        if (String((e as any).id) !== id) return e;
        return {
          ...(e as any),
          id,
          title: eventTitle,
          start: new Date(eventStart).toISOString(),
          end: new Date(eventEnd).toISOString(),
          allDay: eventAllDay,
          extendedProps: {
            ...(e as any).extendedProps,
            type: editing.kind === "appointment" ? "appointment" : "event",
            description: eventDescription,
            reminders: eventReminders,
          },
        } as any;
      }));
      // Persist (use POST path to avoid PATCH build issues)
      fetch(`/api/calendar/${id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventTitle,
          start: new Date(eventStart).toISOString(),
          end: new Date(eventEnd).toISOString(),
          allDay: eventAllDay,
          type: editing.kind === "appointment" ? "APPOINTMENT" : "EVENT",
          description: eventDescription,
          reminders: eventReminders,
        }),
      })
        .then((r) => { if (!r.ok) throw new Error(); setToast({ open: true, message: "Saved", severity: "success" }); })
        .catch(() => setToast({ open: true, message: "Failed to save", severity: "error" }));
    } else {
      const newEvent: EventInput = {
        id: String(Date.now()),
        title: eventTitle,
        start: new Date(eventStart).toISOString(),
        end: new Date(eventEnd).toISOString(),
        allDay: eventAllDay,
        color: "#1a73e8",
        extendedProps: {
          type: "event",
          description: eventDescription,
          reminders: eventReminders,
        },
      } as any;
      setEvents((prev) => [...prev, newEvent]);
      // Persist create
      fetch(`/api/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventTitle,
          start: new Date(eventStart).toISOString(),
          end: new Date(eventEnd).toISOString(),
          allDay: eventAllDay,
          type: "EVENT",
          description: eventDescription,
          reminders: eventReminders,
        }),
      })
        .then((r) => r.json())
        .then((json) => {
          if (json?.items?.[0]?.id) {
            const created = json.items[0];
            setEvents((prev) => prev.map((e) => (e.id === newEvent.id ? { ...e, id: created.id } : e)));
          }
          setToast({ open: true, message: "Created", severity: "success" });
        })
        .catch(() => setToast({ open: true, message: "Failed to create", severity: "error" }));
    }
    setOpenEventModal(false);
    setEditing(null);
  };

  const createTask = () => {
    if (!taskTitle) return;
    const startIso = taskDue ? new Date(taskDue).toISOString() : undefined;
    if (editing?.kind === "task") {
      const id = editing.id;
      setEvents((prev) => prev.map((e) => {
        if (String((e as any).id) !== id) return e;
        return {
          ...(e as any),
          id,
          title: taskCompleted ? `${taskTitle} (Done)` : taskTitle,
          start: startIso,
          allDay: taskAllDay,
          extendedProps: {
            ...(e as any).extendedProps,
            type: "task",
            description: taskDescription,
            completed: taskCompleted,
          },
        } as any;
      }));
      fetch(`/api/calendar/${id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskCompleted ? `${taskTitle} (Done)` : taskTitle,
          start: startIso,
          allDay: taskAllDay,
          type: "TASK",
          description: taskDescription,
          completed: taskCompleted,
        }),
      })
        .then((r) => { if (!r.ok) throw new Error(); setToast({ open: true, message: "Saved", severity: "success" }); })
        .catch(() => setToast({ open: true, message: "Failed to save", severity: "error" }));
    } else {
      const newTask: EventInput = {
        id: String(Date.now()),
        title: taskCompleted ? `${taskTitle} (Done)` : taskTitle,
        start: startIso,
        allDay: taskAllDay,
        color: "#34a853",
        extendedProps: {
          type: "task",
          description: taskDescription,
          completed: taskCompleted,
        },
      } as any;
      setEvents((prev) => [...prev, newTask]);
      fetch(`/api/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskCompleted ? `${taskTitle} (Done)` : taskTitle,
          start: startIso,
          allDay: taskAllDay,
          type: "TASK",
          description: taskDescription,
          completed: taskCompleted,
        }),
      }).then((r) => r.json()).then((json) => {
        if (json?.items?.[0]?.id) {
          const created = json.items[0];
          setEvents((prev) => prev.map((e) => (e.id === newTask.id ? { ...e, id: created.id } : e)));
        }
        setToast({ open: true, message: "Created", severity: "success" });
      }).catch(() => setToast({ open: true, message: "Failed to create", severity: "error" }));
    }
    setOpenTaskModal(false);
    setEditing(null);
  };

  const createAppointmentSchedule = () => {
    if (!apptTitle || !apptStartDate || !apptEndDate) return;
    const startRange = new Date(apptStartDate + "T00:00:00");
    const endRange = new Date(apptEndDate + "T23:59:59");
    const generated: EventInput[] = [];
    const safeDuration = Math.max(5, Math.min(480, apptSlotDurationMin));
    const safeBuffer = Math.max(0, Math.min(120, apptBufferMin));

    for (let d = new Date(startRange); d <= endRange; d = new Date(d.getTime() + 86400000)) {
      const dow = d.getDay();
      if (!apptDays[dow]) continue;
      const dayStart = combineDateTime(d.toISOString().slice(0,10), apptDayStartTime);
      const dayEnd = combineDateTime(d.toISOString().slice(0,10), apptDayEndTime);
      if (!(dayStart < dayEnd)) continue;

      let cur = new Date(dayStart);
      let safety = 0;
      while (cur < dayEnd && safety < 1000) {
        const slotEnd = addMinutes(cur, safeDuration);
        if (slotEnd > dayEnd) break;
        generated.push({
          id: `${d.getTime()}-${cur.getTime()}`,
          title: apptTitle,
          start: cur.toISOString(),
          end: slotEnd.toISOString(),
          color: "#e8710a",
          extendedProps: {
            type: "appointment",
            description: apptDescription,
            location: apptLocation,
          },
        } as any);
        cur = addMinutes(slotEnd, safeBuffer);
        safety++;
      }
    }
    if (generated.length > 0) setEvents((prev) => [...prev, ...generated]);
    // Persist bulk
    if (generated.length > 0) {
      fetch(`/api/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          generated.map((g) => ({
            title: apptTitle,
            start: g.start,
            end: g.end,
            type: "APPOINTMENT",
            description: apptDescription,
            location: apptLocation,
          }))
        ),
      })
        .then((r) => { if (!r.ok) throw new Error(); setToast({ open: true, message: "Slots created", severity: "success" }); })
        .catch(() => setToast({ open: true, message: "Failed to create slots", severity: "error" }));
    }
    setOpenApptModal(false);
  };

  // Load existing events on mount
  React.useEffect(() => {
    setLoading(true);
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((json) => {
        const items = (json?.items ?? []).map((it: any) => ({
          id: it.id,
          title: it.title,
          start: it.start,
          end: it.end ?? undefined,
          allDay: it.allDay ?? false,
          extendedProps: {
            type: (it.type || "EVENT").toString().toLowerCase(),
            description: it.description ?? undefined,
            reminders: it.reminders ?? [],
            location: it.location ?? undefined,
            completed: it.completed ?? undefined,
          },
        }));
        setEvents(items);
      })
      .catch(() => setToast({ open: true, message: "Failed to load events", severity: "error" }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MuiThemeProvider theme={muiTheme ?? lightTheme}>
      <CssBaseline />
      <PageBreadcrumb pageTitle="MUI Calendar" />
      <Paper elevation={0} className="rounded-2xl border border-gray-200 dark:border-gray-800 dark:bg-white/[0.03]" sx={{ p: 2 }}>
        {/* Toolbar approximating Google Calendar */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="h6" sx={{ mr: 1, display: { xs: "none", sm: "block" } }}>
            Calendar
          </Typography>
          <Button color="primary" startIcon={<AddIcon />} variant="contained" size="small" onClick={openCreateMenu} sx={{ mr: 1 }}>
            Create
          </Button>
          <IconButton aria-label="prev" onClick={handlePrev} size="small">
            <ChevronLeftIcon />
          </IconButton>
          <IconButton aria-label="next" onClick={handleNext} size="small">
            <ChevronRightIcon />
          </IconButton>
          <Button startIcon={<CalendarTodayIcon />} onClick={handleToday} variant="outlined" size="small">
            Today
          </Button>
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <Button
            onClick={() => switchView("dayGridMonth")}
            size="small"
            variant={currentView === "dayGridMonth" ? "contained" : "text"}
            startIcon={<ViewModuleIcon />}
          >
            Month
          </Button>
          <Button
            onClick={() => switchView("timeGridWeek")}
            size="small"
            variant={currentView === "timeGridWeek" ? "contained" : "text"}
            startIcon={<ViewWeekIcon />}
          >
            Week
          </Button>
          <Button
            onClick={() => switchView("timeGridDay")}
            size="small"
            variant={currentView === "timeGridDay" ? "contained" : "text"}
            startIcon={<ViewDayIcon />}
          >
            Day
          </Button>
        </Box>
        <Divider sx={{ my: 2 }} />

        {/* Calendar area */}
        <Box sx={{ "& .fc": { fontFamily: "inherit" } }}>
          <FullCalendar
            ref={calendarRef as any}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={currentView}
            headerToolbar={false}
            height="auto"
            events={events}
            selectable
            editable
            eventClick={handleEventClick}
          />
        </Box>
      </Paper>

      {/* Create menu */}
      <Menu anchorEl={createMenuAnchor} open={Boolean(createMenuAnchor)} onClose={closeCreateMenu}
        MenuListProps={{ dense: true }}
        PaperProps={{ className: "rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-white/[0.03]" }}>
        <MenuItem onClick={() => onChooseCreate("event")}>Event</MenuItem>
        <MenuItem onClick={() => onChooseCreate("task")}>Task</MenuItem>
        <MenuItem onClick={() => onChooseCreate("appointment")}>Appointment schedule</MenuItem>
      </Menu>

      {/* Event dialog */}
      <Dialog open={openEventModal} onClose={() => setOpenEventModal(false)} maxWidth="sm" fullWidth
        PaperProps={{ className: "rounded-2xl border border-gray-200 dark:border-gray-800 dark:bg-white/[0.03]" }}>
        <DialogTitle>Create event</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} required fullWidth />
            <FormControlLabel control={<Switch checked={eventAllDay} onChange={(e) => setEventAllDay(e.target.checked)} />} label="All day" />
            <TextField label="Start" type="datetime-local" value={eventStart} onChange={(e) => setEventStart(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="End" type="datetime-local" value={eventEnd} onChange={(e) => setEventEnd(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Description" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} fullWidth multiline minRows={3} />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Reminders (minutes before)</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {eventReminders.map((m, idx) => (
                  <Chip color="primary" variant="outlined" key={`${m}-${idx}`} label={`${m} min`} onDelete={() => setEventReminders((arr) => arr.filter((_, i) => i !== idx))} />
                ))}
                <Chip color="primary" label="+ 10" onClick={() => setEventReminders((arr) => [...arr, 10])} />
                <Chip color="primary" label="+ 15" onClick={() => setEventReminders((arr) => [...arr, 15])} />
                <Chip color="primary" label="+ 30" onClick={() => setEventReminders((arr) => [...arr, 30])} />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpenEventModal(false)}>Cancel</Button>
          <Button color="primary" variant="contained" onClick={createEvent} disabled={!eventTitle}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Task dialog */}
      <Dialog open={openTaskModal} onClose={() => setOpenTaskModal(false)} maxWidth="sm" fullWidth
        PaperProps={{ className: "rounded-2xl border border-gray-200 dark:border-gray-800 dark:bg-white/[0.03]" }}>
        <DialogTitle>Create task</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required fullWidth />
            <FormControlLabel control={<Switch checked={taskAllDay} onChange={(e) => setTaskAllDay(e.target.checked)} />} label="All day" />
            <TextField label="Due" type="datetime-local" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Description" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} fullWidth multiline minRows={3} />
            <FormControlLabel control={<Switch checked={taskCompleted} onChange={(e) => setTaskCompleted(e.target.checked)} />} label="Mark as done" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpenTaskModal(false)}>Cancel</Button>
          <Button color="primary" variant="contained" onClick={createTask} disabled={!taskTitle}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Appointment schedule dialog */}
      <Dialog open={openApptModal} onClose={() => setOpenApptModal(false)} maxWidth="md" fullWidth
        PaperProps={{ className: "rounded-2xl border border-gray-200 dark:border-gray-800 dark:bg-white/[0.03]" }}>
        <DialogTitle>Create appointment schedule</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title" value={apptTitle} onChange={(e) => setApptTitle(e.target.value)} required fullWidth />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="From date" type="date" value={apptStartDate} onChange={(e) => setApptStartDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label="To date" type="date" value={apptEndDate} onChange={(e) => setApptEndDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
            </Stack>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Days of week</Typography>
              <FormGroup row>
                {[
                  { label: 'Sun', idx: 0 },
                  { label: 'Mon', idx: 1 },
                  { label: 'Tue', idx: 2 },
                  { label: 'Wed', idx: 3 },
                  { label: 'Thu', idx: 4 },
                  { label: 'Fri', idx: 5 },
                  { label: 'Sat', idx: 6 },
                ].map((d) => (
                  <FormControlLabel key={d.idx} control={<Checkbox checked={!!apptDays[d.idx]} onChange={(e) => setApptDays((prev) => ({ ...prev, [d.idx]: e.target.checked }))} />} label={d.label} />
                ))}
              </FormGroup>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Daily start time" type="time" value={apptDayStartTime} onChange={(e) => setApptDayStartTime(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label="Daily end time" type="time" value={apptDayEndTime} onChange={(e) => setApptDayEndTime(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Slot duration (min)" type="number" value={apptSlotDurationMin} onChange={(e) => setApptSlotDurationMin(parseInt(e.target.value || '0', 10))} fullWidth />
              <TextField label="Buffer between slots (min)" type="number" value={apptBufferMin} onChange={(e) => setApptBufferMin(parseInt(e.target.value || '0', 10))} fullWidth />
            </Stack>
            <TextField label="Location" value={apptLocation} onChange={(e) => setApptLocation(e.target.value)} fullWidth />
            <TextField label="Description" value={apptDescription} onChange={(e) => setApptDescription(e.target.value)} fullWidth multiline minRows={3} />
            <Typography variant="body2" color="text.secondary">
              This will generate bookable appointment slots across the selected date range and days.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpenApptModal(false)}>Cancel</Button>
          <Button color="primary" variant="contained" onClick={createAppointmentSchedule} disabled={!apptTitle || !apptStartDate || !apptEndDate}>Create slots</Button>
        </DialogActions>
      </Dialog>

      {/* Details popover */}
      <Popover
        open={Boolean(detailsAnchor)}
        anchorEl={detailsAnchor}
        onClose={closeDetails}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{ className: "rounded-2xl border border-gray-200 dark:border-gray-800 dark:bg-white/[0.03]", sx: { width: 360 } }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: (detailsEvent?.backgroundColor || detailsEvent?.color || "#1a73e8") }} />
            <Typography variant="h6" sx={{ flex: 1 }} noWrap>
              {detailsEvent?.title}
            </Typography>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={startEditFromDetails}><EditOutlinedIcon fontSize="small" /></IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={handleDeleteFromDetails}><DeleteOutlineIcon fontSize="small" /></IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton size="small" onClick={closeDetails}><CloseIcon fontSize="small" /></IconButton>
            </Tooltip>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <CalendarMonthOutlinedIcon fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              {formatRange(detailsEvent?.start ?? null, detailsEvent?.end ?? null, detailsEvent?.allDay)}
            </Typography>
          </Stack>

          {detailsEvent?.extendedProps?.reminders?.length ? (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
              <NotificationsActiveOutlinedIcon fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {detailsEvent.extendedProps.reminders[0]} minutes before
              </Typography>
            </Stack>
          ) : null}

          {detailsEvent?.extendedProps?.location ? (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
              <PlaceOutlinedIcon fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {detailsEvent.extendedProps.location}
              </Typography>
            </Stack>
          ) : null}

          {detailsEvent?.extendedProps?.description ? (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {detailsEvent.extendedProps.description}
            </Typography>
          ) : null}

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
            <Avatar sx={{ width: 24, height: 24 }}>U</Avatar>
            <Typography variant="body2">You</Typography>
          </Stack>
        </Box>
      </Popover>
      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast((t) => ({ ...t, open: false }))}>
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast((t) => ({ ...t, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </MuiThemeProvider>
  );
}


