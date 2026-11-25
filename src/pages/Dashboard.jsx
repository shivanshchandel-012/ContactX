import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  Bell,
  CalendarDays,
  ChevronDown,
  Check,
  Heart,
  LayoutDashboard,
  LogOut,
  Pencil,
  MessageSquare,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../services/authService";
import { contactService } from "../services/contactService";
import { dashboardService } from "../services/dashboardService";
import { followUpService } from "../services/followUpService";
import { interactionService } from "../services/interactionService";

const navigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "contacts", label: "All contacts", icon: Users },
  { id: "favorites", label: "Favourites", icon: Heart },
  { id: "followups", label: "Follow-ups", icon: CalendarDays },
  { id: "trash", label: "Trash", icon: Trash2 },
];

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getContactGroups(contacts) {
  return contacts.reduce((groups, contact) => {
    const letter = (contact.name?.trim()?.[0] || "#").toUpperCase();

    if (!groups[letter]) {
      groups[letter] = [];
    }

    groups[letter].push(contact);
    return groups;
  }, {});
}


function formatFollowUp(date) {
  if (!date) return "";
  const today = getLocalDateString();
  if (date === today) return "Today";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date === getLocalDateString(tomorrow)) return "Tomorrow";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getFollowUpListParams(status) {
  const params = { page: 1, limit: 100 };
  if (status === "pending") params.completed = false;
  if (status === "completed") params.completed = true;
  return params;
}

async function loadFollowUpTasks(status) {
  const data = await followUpService.list(getFollowUpListParams(status));
  if (!Array.isArray(data.followUps)) {
    throw new Error("The follow-up response did not contain a task list.");
  }
  return data.followUps;
}

const interactionTypes = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "message", label: "Message" },
  { value: "note", label: "Note" },
];

function formatInteractionDate(value) {
  const datePart = String(value).slice(0, 10);
  const date = new Date(`${datePart}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// function downloadContacts(contacts) {
//   const columns = ["name", "email", "phone", "company", "role", "tags"];
//   const escapeCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
//   const rows = [
//     columns.join(","),
//     ...contacts.map((contact) =>
//       columns
//         .map((column) =>
//           escapeCell(
//             column === "tags" ? (contact.tags ?? []).join(", ") : contact[column],
//           ),
//         )
//         .join(","),
//     ),
//   ];
//   const url = URL.createObjectURL(
//     new Blob([rows.join("\r\n")], { type: "text/csv;charset=utf-8" }),
//   );
//   const link = document.createElement("a");
//   link.href = url;
//   link.download = "contactx-contacts.csv";
//   link.click();
//   URL.revokeObjectURL(url);
// }

function saveFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ContactModal({ contact, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    name: contact?.name || "",
    email: contact?.email || "",
    phone: contact?.phone || "",
    company: contact?.company || "",
    role: contact?.role || "",
    tags: (contact?.tags || []).join(", "),
    followUp: contact?.followUp
      ? new Date(contact.followUp).toISOString().slice(0, 10)
      : "",
    followUpTitle: "",
    followUpDueAt: "",
  }));
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Enter a name to add this contact.");
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (Boolean(form.followUpTitle.trim()) !== Boolean(form.followUpDueAt)) {
      setError("Enter both a follow-up task title and due date.");
      return;
    }
    if (form.followUpTitle.trim().length > 120) {
      setError("Follow-up task titles must be at most 120 characters.");
      return;
    }
    try {
      await onSave({
        phone: form.phone,
        company: form.company,
        role: form.role,
        name: form.name.trim(),
        email: form.email.trim(),
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        ...(contact
          ? {
              favorite: contact.favorite ?? false,
              lastContact: contact.lastContact || "Just added",
              color: contact.color || "blue",
              followUp: form.followUp || null,
            }
          : {
              followUpTask: form.followUpDueAt
                ? {
                    title: form.followUpTitle.trim(),
                    dueAt: form.followUpDueAt,
                  }
                : null,
              favorite: false,
              lastContact: "Just added",
              color: "blue",
            }),
      });
    } catch (saveError) {
      setError(saveError.message || "Failed to save contact.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="add-contact-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
        role="dialog"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2
              className="mt-1 text-2xl font-bold tracking-tight text-slate-900"
              id="add-contact-title"
            >
              {contact ? "Edit contact" : "Add a contact"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add the details you want to keep on hand.
            </p>
          </div>
          <button
            aria-label="Close dialog"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            type="button"
          >
            <X size={19} />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { key: "name", label: "Full name", required: true },
              { key: "email", label: "Email", type: "email" },
              { key: "phone", label: "Phone" },
              { key: "company", label: "Company" },
              { key: "role", label: "Designation" },
              { key: "tags", label: "Tags", placeholder: "Work, Customer" },
            ].map((field) => (
              <label className="block" key={field.key}>
                <span className="text-sm font-medium text-slate-700">
                  {field.label}
                  {field.required && <span className="text-rose-500"> *</span>}
                </span>
                <input
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  onChange={(event) =>
                    setForm({ ...form, [field.key]: event.target.value })
                  }
                  placeholder={field.placeholder ?? ""}
                  required={field.required}
                  type={field.type ?? "text"}
                  value={form[field.key]}
                />
              </label>
            ))}
            {contact && (
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Legacy contact follow-up date
                </span>
                <input
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  onChange={(event) =>
                    setForm({ ...form, followUp: event.target.value })
                  }
                  type="date"
                  value={form.followUp}
                />
                <span className="mt-1 block text-xs text-slate-500">
                  This contact date is separate from Follow-up tasks.
                </span>
              </label>
            )}
            {!contact && (
              <>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Follow-up task title
                  </span>
                  <input
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    maxLength={120}
                    onChange={(event) =>
                      setForm({ ...form, followUpTitle: event.target.value })
                    }
                    placeholder="e.g. Send proposal"
                    type="text"
                    value={form.followUpTitle}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Follow-up due date
                  </span>
                  <input
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    onChange={(event) =>
                      setForm({ ...form, followUpDueAt: event.target.value })
                    }
                    type="date"
                    value={form.followUpDueAt}
                  />
                </label>
              </>
            )}
          </div>
          {error && (
            <p className="text-sm text-rose-600" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              type="submit"
            >
              <Plus size={16} />
              {contact ? "Save changes" : "Add contact"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function FollowUpModal({
  contacts,
  contactsError,
  contactsLoading,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    contactId: "",
    title: "",
    description: "",
    dueAt: getLocalDateString(),
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const title = form.title.trim();
    const dueAt = new Date(`${form.dueAt}T00:00:00.000Z`);

    if (!form.contactId) {
      setError("Select a contact for this follow-up.");
      return;
    }
    if (!title || title.length > 120) {
      setError("Enter a task title of 1 to 120 characters.");
      return;
    }
    if (form.description.length > 2000) {
      setError("Description must be at most 2000 characters.");
      return;
    }
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(form.dueAt) ||
      Number.isNaN(dueAt.getTime()) ||
      dueAt.toISOString().slice(0, 10) !== form.dueAt
    ) {
      setError("Enter a valid due date.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave({
        contactId: form.contactId,
        title,
        description: form.description.trim(),
        dueAt: form.dueAt,
      });
    } catch (saveError) {
      setError(saveError.message || "Failed to create the follow-up task.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        aria-labelledby="add-follow-up-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
        role="dialog"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2
              className="text-2xl font-bold tracking-tight text-slate-900"
              id="add-follow-up-title"
            >
              Create a follow-up task
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Link a task to one of your active contacts.
            </p>
          </div>
          <button
            aria-label="Close dialog"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            <X size={19} />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Contact</span>
            <select
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              disabled={contactsLoading || contacts.length === 0 || saving}
              onChange={(event) =>
                setForm({ ...form, contactId: event.target.value })
              }
              required
              value={form.contactId}
            >
              <option value="">
                {contactsLoading ? "Loading contacts..." : "Select a contact"}
              </option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                  {contact.email ? ` (${contact.email})` : ""}
                </option>
              ))}
            </select>
            {!contactsLoading && contacts.length === 0 && (
              <span className="mt-1 block text-xs text-slate-500">
                {contactsError || "Add an active contact before creating a task."}
              </span>
            )}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Task title</span>
            <input
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              maxLength={120}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              required
              type="text"
              value={form.title}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Description
            </span>
            <textarea
              className="mt-1.5 min-h-24 w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              maxLength={2000}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              value={form.description}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Due date</span>
            <input
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              onChange={(event) =>
                setForm({ ...form, dueAt: event.target.value })
              }
              required
              type="date"
              value={form.dueAt}
            />
          </label>

          {error && (
            <p className="text-sm text-rose-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              disabled={saving}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving || contactsLoading || contacts.length === 0}
              type="submit"
            >
              <Plus size={16} />
              {saving ? "Creating..." : "Create task"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function InteractionHistoryModal({ contact, onClose }) {
  const contactId = contact.id || contact._id;
  const [historyResult, setHistoryResult] = useState({
    key: null,
    interactions: [],
    error: "",
  });
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const historyRequestKey = `${contactId}:${refreshVersion}`;
  const interactions = historyResult.interactions;
  const loading = historyResult.key !== historyRequestKey;
  const historyError = loading ? "" : historyResult.error;
  const [form, setForm] = useState({
    type: "note",
    title: "",
    description: "",
    occurredAt: getLocalDateString(),
  });

  useEffect(() => {
    let cancelled = false;
    const requestKey = `${contactId}:${refreshVersion}`;
    interactionService
      .list(contactId, { page: 1, limit: 100 })
      .then((data) => {
        if (!Array.isArray(data.interactions)) {
          throw new Error(
            "The interaction response did not contain a history list.",
          );
        }
        if (!cancelled) {
          setHistoryResult({
            key: requestKey,
            interactions: data.interactions,
            error: "",
          });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setHistoryResult({
            key: requestKey,
            interactions: [],
            error: error.message || "Failed to load interaction history.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [contactId, refreshVersion]);

  const sortedInteractions = useMemo(
    () =>
      [...interactions].sort(
        (a, b) => new Date(b.occurredAt) - new Date(a.occurredAt),
      ),
    [interactions],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    const title = form.title.trim();
    const occurredAt = new Date(`${form.occurredAt}T00:00:00.000Z`);

    if (!interactionTypes.some((item) => item.value === form.type)) {
      setSubmitError("Select a valid interaction type.");
      return;
    }
    if (!title || title.length > 120) {
      setSubmitError("Enter a title of 1 to 120 characters.");
      return;
    }
    if (form.description.length > 2000) {
      setSubmitError("Description must be at most 2000 characters.");
      return;
    }
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(form.occurredAt) ||
      Number.isNaN(occurredAt.getTime()) ||
      occurredAt.toISOString().slice(0, 10) !== form.occurredAt
    ) {
      setSubmitError("Enter a valid occurrence date.");
      return;
    }

    setSaving(true);
    setSubmitError("");
    setSuccessMessage("");
    try {
      await interactionService.create(contactId, {
        type: form.type,
        title,
        description: form.description.trim(),
        occurredAt: form.occurredAt,
      });
      setForm({
        type: form.type,
        title: "",
        description: "",
        occurredAt: getLocalDateString(),
      });
      setSuccessMessage("Interaction added.");
      setRefreshVersion((version) => version + 1);
    } catch (error) {
      setSubmitError(error.message || "Failed to add interaction.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        aria-labelledby="interaction-history-title"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
              id="interaction-history-title"
            >
              Interaction history
            </h2>
            <p className="mt-1 truncate text-sm text-slate-500">
              {contact.name}
              {contact.email ? ` · ${contact.email}` : ""}
            </p>
          </div>
          <button
            aria-label="Close interaction history"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            <X size={19} />
          </button>
        </div>

        <form
          className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
          onSubmit={handleSubmit}
        >
          <h3 className="text-sm font-semibold text-slate-800">
            Add an interaction
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-slate-700">Type</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                onChange={(event) =>
                  setForm({ ...form, type: event.target.value })
                }
                value={form.type}
              >
                {interactionTypes.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-700">
                Occurrence date
              </span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                onChange={(event) =>
                  setForm({ ...form, occurredAt: event.target.value })
                }
                required
                type="date"
                value={form.occurredAt}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-slate-700">Title</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              maxLength={120}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              required
              type="text"
              value={form.title}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-700">
              Description
            </span>
            <textarea
              className="mt-1 min-h-20 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              maxLength={2000}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              value={form.description}
            />
          </label>
          {submitError && (
            <p className="text-sm text-rose-600" role="alert">
              {submitError}
            </p>
          )}
          {successMessage && (
            <p className="text-sm text-emerald-700" role="status">
              {successMessage}
            </p>
          )}
          <div className="flex justify-end">
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              <Plus size={16} />
              {saving ? "Saving..." : "Add interaction"}
            </button>
          </div>
        </form>

        <section aria-label="Interaction entries" className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Previous interactions
            </h3>
            {!loading && !historyError && (
              <span className="text-xs text-slate-500">
                {sortedInteractions.length}{" "}
                {sortedInteractions.length === 1 ? "entry" : "entries"}
              </span>
            )}
          </div>
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Loading interaction history...
            </p>
          ) : historyError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-4 text-center">
              <p className="text-sm text-rose-700" role="alert">
                {historyError}
              </p>
              <button
                className="mt-2 text-xs font-medium text-blue-700 hover:text-blue-800"
                onClick={() =>
                  setRefreshVersion((version) => version + 1)
                }
                type="button"
              >
                Retry
              </button>
            </div>
          ) : sortedInteractions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center">
              <MessageSquare className="mx-auto text-slate-400" size={20} />
              <p className="mt-2 text-sm font-medium text-slate-700">
                No interactions recorded
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Add a call, email, meeting, message, or note above.
              </p>
            </div>
          ) : (
            <ol className="space-y-3">
              {sortedInteractions.map((interaction) => {
                const typeLabel =
                  interactionTypes.find(
                    (item) => item.value === interaction.type,
                  )?.label || interaction.type;

                return (
                  <li
                    className="rounded-xl border border-slate-200 px-4 py-3"
                    key={interaction.id || interaction._id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          {typeLabel}
                        </span>
                        <h4 className="truncate text-sm font-semibold text-slate-800">
                          {interaction.title}
                        </h4>
                      </div>
                      <time
                        className="shrink-0 text-xs text-slate-500"
                        dateTime={interaction.occurredAt}
                      >
                        {formatInteractionDate(interaction.occurredAt)}
                      </time>
                    </div>
                    {interaction.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                        {interaction.description}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </section>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState(
    () => authService.getUser() || { name: "User", email: "" }
  );
  const [contacts, setContacts] = useState([]);
  const [deletedContacts, setDeletedContacts] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [dashboardError, setDashboardError] = useState("");
  const [followUpsResult, setFollowUpsResult] = useState({
    key: null,
    tasks: [],
    error: "",
  });
  const [pendingFollowUpsResult, setPendingFollowUpsResult] = useState({
    version: null,
    tasks: [],
    error: "",
  });
  const [followUpStatus, setFollowUpStatus] = useState("pending");
  const [followUpRefreshVersion, setFollowUpRefreshVersion] = useState(0);
  const [followUpMutationId, setFollowUpMutationId] = useState(null);
  const [followUpActionError, setFollowUpActionError] = useState("");
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsError, setContactsError] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [showAddFollowUp, setShowAddFollowUp] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [followUpContacts, setFollowUpContacts] = useState([]);
  const [followUpContactsLoading, setFollowUpContactsLoading] = useState(false);
  const [followUpContactsError, setFollowUpContactsError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);
  const [refreshData, setRefreshData] = useState(0);
  const validSections = new Set(navigation.map(({ id }) => id));
  const requestedSection = searchParams.get("view");
  const activeSection = validSections.has(requestedSection)
    ? requestedSection
    : "overview";
  const search = searchParams.get("search") || "";
  const companyFilter = searchParams.get("company") || "";
  const tagFilter = searchParams.get("tag") || "";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const allowedPageSizes = [10, 25, 50];
  const requestedPageSize = Number.parseInt(searchParams.get("limit") || "10", 10);
  const pageSize = allowedPageSizes.includes(requestedPageSize) ? requestedPageSize : 10;
  const allowedSortFields = ["name", "createdAt", "updatedAt", "followUp"];
  const requestedPrimarySort = searchParams.get("sortBy") || "updatedAt";
  const primarySort = allowedSortFields.includes(requestedPrimarySort)
    ? requestedPrimarySort
    : "updatedAt";
  const requestedSecondarySort = searchParams.get("thenBy") || "";
  const secondarySort =
    allowedSortFields.includes(requestedSecondarySort) &&
    requestedSecondarySort !== primarySort
      ? requestedSecondarySort
      : "";
  const sortBy = [primarySort, secondarySort].filter(Boolean).join(",");
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const updateTableParams = useCallback((changes, resetPage = false) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") next.delete(key);
      else next.set(key, String(value));
    });
    if (resetPage) next.set("page", "1");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  function setActiveSection(section) {
    updateTableParams({ view: section === "overview" ? null : section }, true);
  }

  function setSearch(value) {
    updateTableParams({ search: value }, true);
  }

  const followUpRequestKey = `${followUpStatus}:${followUpRefreshVersion}`;
  const followUps = followUpsResult.tasks;
  const followUpsLoading = followUpsResult.key !== followUpRequestKey;
  const followUpsError = followUpsLoading ? "" : followUpsResult.error;
  const pendingFollowUps = pendingFollowUpsResult.tasks;
  const pendingFollowUpsLoading =
    pendingFollowUpsResult.version !== followUpRefreshVersion;
  const pendingFollowUpsError = pendingFollowUpsLoading
    ? ""
    : pendingFollowUpsResult.error;

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setContactsLoading(true);
      setContactsError("");
      const filters = {
        page,
        limit: pageSize,
        sortBy,
        order,
        search,
        company: companyFilter,
        tag: tagFilter,
      };
      const request =
        activeSection === "trash"
          ? contactService.listTrash(filters)
          : contactService.list({
              ...filters,
              ...(activeSection === "favorites" ? { favorite: true } : {}),
            });

      request
        .then(({ contacts: resultContacts, pagination: resultPagination }) => {
          if (cancelled) return;
          const lastPage = Math.max(1, resultPagination.totalPages);
          if (page > lastPage) {
            updateTableParams({ page: lastPage });
            return;
          }
          if (activeSection === "trash") setDeletedContacts(resultContacts);
          else setContacts(resultContacts);
          setPagination(resultPagination);
        })
        .catch((error) => {
          if (!cancelled) setContactsError(error.message || "Failed to load contacts.");
        })
        .finally(() => {
          if (!cancelled) setContactsLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    activeSection,
    companyFilter,
    order,
    page,
    pageSize,
    refreshData,
    search,
    sortBy,
    tagFilter,
    updateTableParams,
  ]);

  useEffect(() => {
    let cancelled = false;
    dashboardService
      .getSummary()
      .then((summary) => {
        if (!cancelled) {
          setDashboardSummary(summary);
          setDashboardError("");
        }
      })
      .catch((error) => {
        console.error("Failed to load dashboard summary:", error);
        if (!cancelled) {
          setDashboardError(error.message || "Failed to load dashboard summary.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const requestKey = `${followUpStatus}:${followUpRefreshVersion}`;
    const activeRequest = loadFollowUpTasks(followUpStatus);
    activeRequest
      .then((tasks) => {
        if (!cancelled) {
          setFollowUpsResult({ key: requestKey, tasks, error: "" });
          if (followUpStatus === "pending") {
            setPendingFollowUpsResult({
              version: followUpRefreshVersion,
              tasks,
              error: "",
            });
          }
        }
      })
      .catch((error) => {
        console.error("Failed to load follow-ups:", error);
        if (!cancelled) {
          setFollowUpsResult({
            key: requestKey,
            tasks: [],
            error: error.message || "Failed to load follow-ups.",
          });
          if (followUpStatus === "pending") {
            setPendingFollowUpsResult({
              version: followUpRefreshVersion,
              tasks: [],
              error: error.message || "Failed to load pending follow-ups.",
            });
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [followUpStatus, followUpRefreshVersion]);

  useEffect(() => {
    if (
      followUpStatus === "pending" ||
      pendingFollowUpsResult.version === followUpRefreshVersion
    ) {
      return;
    }

    let cancelled = false;
    loadFollowUpTasks("pending")
      .then((tasks) => {
        if (!cancelled) {
          setPendingFollowUpsResult({
            version: followUpRefreshVersion,
            tasks,
            error: "",
          });
        }
      })
      .catch((error) => {
        console.error("Failed to load pending follow-ups:", error);
        if (!cancelled) {
          setPendingFollowUpsResult({
            version: followUpRefreshVersion,
            tasks: [],
            error: error.message || "Failed to load pending follow-ups.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    followUpStatus,
    followUpRefreshVersion,
    pendingFollowUpsResult.version,
  ]);

  useEffect(() => {
    authService
      .getMe()
      .then((user) => {
        if (user) setCurrentUser(user);
      })
      .catch((error) => {
        console.error("Failed to load current user:", error);
      });
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };


  const today = getLocalDateString();
  const formattedToday = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const dueCount =
    (dashboardSummary?.overdueFollowUps ?? 0) +
    (dashboardSummary?.upcomingFollowUps ?? 0);
  const addedThisMonth = dashboardSummary?.addedThisMonth ?? 0;
  const filteredContacts = activeSection === "trash" ? deletedContacts : contacts;
  const sortedFollowUps = useMemo(
    () =>
      [...followUps].sort(
        (a, b) => new Date(a.dueAt) - new Date(b.dueAt),
      ),
    [followUps],
  );
  const sortedPendingFollowUps = useMemo(
    () =>
      [...pendingFollowUps].sort(
        (a, b) => new Date(a.dueAt) - new Date(b.dueAt),
      ),
    [pendingFollowUps],
  );
  const filteredFollowUps = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sortedFollowUps;
    return sortedFollowUps.filter((task) =>
      [
        task.title,
        task.description,
        task.contact?.name,
        task.contact?.email,
        task.contact?.company,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [search, sortedFollowUps]);

  const contactGroups = getContactGroups(filteredContacts);
  const availableLetters = new Set(Object.keys(contactGroups));
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  async function refreshDashboardSummary() {
    try {
      const summary = await dashboardService.getSummary();
      setDashboardSummary(summary);
      setDashboardError("");
    } catch (error) {
      console.error("Failed to refresh dashboard summary:", error);
      setDashboardError(
        error.message || "Failed to refresh dashboard summary.",
      );
    }
  }

  async function openFollowUpModal() {
    setShowAddFollowUp(true);
    setFollowUpContacts([]);
    setFollowUpContactsLoading(true);
    setFollowUpContactsError("");
    try {
      const result = await contactService.list({
        page: 1,
        limit: 100,
        sortBy: "name",
        order: "asc",
      });
      setFollowUpContacts(result.contacts);
    } catch (error) {
      setFollowUpContactsError(
        error.message || "Failed to load contacts for follow-up tasks.",
      );
    } finally {
      setFollowUpContactsLoading(false);
    }
  }

  async function createFollowUp(task) {
    setFollowUpActionError("");
    await followUpService.create(task);
    setShowAddFollowUp(false);
    setFollowUpStatus("pending");
    setFollowUpRefreshVersion((version) => version + 1);
    await refreshDashboardSummary();
  }

  async function updateFollowUpCompletion(task) {
    const id = task.id || task._id;
    if (!id || followUpMutationId) return;

    setFollowUpMutationId(id);
    setFollowUpActionError("");
    try {
      await followUpService.update(id, { completed: !task.completed });
      if (task.completed) setFollowUpStatus("pending");
      setFollowUpRefreshVersion((version) => version + 1);
      await refreshDashboardSummary();
    } catch (error) {
      setFollowUpActionError(
        error.message || "Failed to update the follow-up task.",
      );
    } finally {
      setFollowUpMutationId(null);
    }
  }

  async function deleteFollowUp(task) {
    const id = task.id || task._id;
    if (
      !id ||
      followUpMutationId ||
      !window.confirm(`Delete the follow-up task "${task.title}"?`)
    ) {
      return;
    }

    setFollowUpMutationId(id);
    setFollowUpActionError("");
    try {
      await followUpService.remove(id);
      setFollowUpRefreshVersion((version) => version + 1);
      await refreshDashboardSummary();
    } catch (error) {
      setFollowUpActionError(
        error.message || "Failed to delete the follow-up task.",
      );
    } finally {
      setFollowUpMutationId(null);
    }
  }

  async function handleExport() {
    setContactsError("");
    if (activeSection === "followups") {
      setContactsError("Exporting follow-up tasks is not available yet.");
      return;
    }
    try {
      const view = ["favorites", "trash"].includes(activeSection)
        ? activeSection
        : "all";
      const { blob, filename } = await contactService.exportCsv({
        view,
        search: search.trim(),
        company: companyFilter,
        tag: tagFilter,
      });
      saveFile(blob, filename);
    } catch (error) {
      setContactsError(error.message);
    }
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow choosing the same file again
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    setContactsError("");
    try {
      const result = await contactService.importCsv(file);
      setImportResult(result);
      if (result.imported > 0) {
        updateTableParams({ page: "1" });
        setRefreshData((value) => value + 1);
        await refreshDashboardSummary();
      }
    } catch (error) {
      setContactsError(error.message);
    } finally {
      setImporting(false);
    }
  }

  async function handlePhotoChange(id, event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingPhotoId(id);
    setContactsError("");
    try {
      const updatedContact = await contactService.uploadPhoto(id, file);
      setContacts((current) => current.map((item) => (item.id === id ? updatedContact : item)));
    } catch (error) {
      setContactsError(error.message);
    } finally {
      setUploadingPhotoId(null);
    }
  }

  async function addContact(contact) {
    const { followUpTask, ...contactDetails } = contact;
    const createdContact = await contactService.create(contactDetails);
    updateTableParams({ page: "1" });
    setRefreshData((value) => value + 1);
    setContactsError("");
    setShowAddContact(false);

    if (!followUpTask) {
      refreshDashboardSummary();
      return;
    }

    try {
      await followUpService.create({
        contactId: createdContact.id,
        title: followUpTask.title,
        dueAt: followUpTask.dueAt,
      });
      setFollowUpStatus("pending");
      setFollowUpRefreshVersion((version) => version + 1);
      refreshDashboardSummary();
    } catch (error) {
      refreshDashboardSummary();
      setContactsError(
        `Contact saved, but its follow-up task could not be created: ${
          error.message || "Please try again."
        }`,
      );
    }
  }

  async function updateContact(contact) {
    const updatedContact = await contactService.update(editingContact.id, contact);
    setContacts((current) =>
      current.map((item) => (item.id === updatedContact.id ? updatedContact : item)),
    );
    setEditingContact(null);
    setContactsError("");
    setRefreshData((value) => value + 1);
  }

  async function toggleFavorite(id) {
    const contact = contacts.find((item) => item.id === id);
    if (!contact) return;
    try {
      const updatedContact = await contactService.update(id, {
        favorite: !contact.favorite,
      });
      setContacts((current) =>
        current.map((item) => (item.id === id ? updatedContact : item)),
      );
      setContactsError("");
      setRefreshData((value) => value + 1);
      await refreshDashboardSummary();
    } catch (error) {
      setContactsError(error.message || "Failed to update contact.");
    }
  }

  async function deleteContact(id) {
    try {
      const deletedContact = await contactService.remove(id);
      setContacts((current) => current.filter((item) => item.id !== id));
      setDeletedContacts((current) => [deletedContact, ...current]);
      setContactsError("");
      setRefreshData((value) => value + 1);
      setFollowUpRefreshVersion((version) => version + 1);
      refreshDashboardSummary();
    } catch (error) {
      setContactsError(error.message || "Failed to move contact to trash.");
    }
  }

  async function restoreContact(id) {
    try {
      const restoredContact = await contactService.restore(id);
      setDeletedContacts((current) => current.filter((item) => item.id !== id));
      setContacts((current) => [restoredContact, ...current]);
      setContactsError("");
      setRefreshData((value) => value + 1);
      setFollowUpRefreshVersion((version) => version + 1);
      refreshDashboardSummary();
    } catch (error) {
      setContactsError(error.message || "Failed to restore contact.");
    }
  }

  const pageTitle =
    navigation.find((item) => item.id === activeSection)?.label ?? "Overview";

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
        <Link
          aria-label="ContactX home"
          className="px-3 text-xl font-bold tracking-tight"
          to="/"
        >
          Contact<span className="text-blue-600">X</span>
        </Link>

        <nav aria-label="Main navigation" className="mt-9 space-y-1">
          <p className="mb-2 px-3 text-[11px] font-semibold text-slate-400">
            WORKSPACE
          </p>
            {navigation.map(({ id, label, icon: Icon }) => (
              <button
                aria-current={activeSection === id ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                  activeSection === id
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
                key={id}
                onClick={() => setActiveSection(id)}
                type="button"
              >
                <Icon size={18} />
                {label}
                {id === "followups" && dueCount > 0 && (
                  <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                    {dueCount}
                  </span>
                )}
              </button>
            ))}
        </nav>

        <div className="mt-auto border-t border-slate-100 px-2 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
              D
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">
                {currentUser?.name || "Your account"}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">Personal workspace</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-60">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-7 lg:px-9">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                aria-label="ContactX home"
                className="text-lg font-bold tracking-tight lg:hidden"
                to="/"
              >
                Contact<span className="text-blue-600">X</span>
              </Link>
              <span className="hidden truncate text-sm font-medium text-slate-600 lg:block">
                {pageTitle}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                aria-label="Notifications"
                className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100"
                type="button"
              >
                <Bell size={19} />
                {dueCount > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-rose-500" />
                )}
              </button>
              <div className="hidden h-8 w-px bg-slate-200 sm:block" />
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {getInitials(currentUser?.name || "Alex Morgan")}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-slate-800">
                    {currentUser?.name || "Alex Morgan"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {currentUser?.email || "Personal workspace"}
                  </p>
                </div>
                <ChevronDown className="hidden text-slate-400 sm:block" size={15} />
              </div>
              <button
                type="button"
                aria-label="Sign out"
                className="ml-1 rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                title="Sign out"
                onClick={handleLogout}
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-7 lg:px-9">
          <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200 pb-2 lg:hidden">
            {navigation.map(({ id, label, icon: Icon }) => (
              <button
                className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium ${
                  activeSection === id
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-500"
                }`}
                key={id}
                onClick={() => setActiveSection(id)}
                type="button"
              >
                <Icon size={15} />
                {label}
                {id === "followups" && dueCount > 0 && (
                  <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                    {dueCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {formattedToday}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-[34px]">
                {getGreeting()}, {currentUser?.name ? currentUser.name.split(" ")[0] : "Friend"}
              </h1>

              <p className="mt-2 text-sm text-slate-500 sm:text-base">
                Here&apos;s what&apos;s happening with your relationships.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 ${
                  activeSection === "followups" ? "cursor-not-allowed opacity-50" : ""
                }`}
                disabled={activeSection === "followups"}
                onClick={handleExport}
                type="button"
                title={
                  activeSection === "followups"
                    ? "Follow-up task export is not available yet"
                    : undefined
                }
              >
                <ArrowDownToLine size={16} />
                Export
              </button>
              {activeSection !== "trash" && (
                <label
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 ${
                    importing ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  <Upload size={16} />
                  {importing ? "Importing..." : "Import CSV"}
                  <input accept=".csv,text/csv" className="sr-only" onChange={handleImport} type="file" />
                </label>
              )}
              {activeSection !== "trash" && (
                <button
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  onClick={() => setShowAddContact(true)}
                  type="button"
                >
                  <Plus size={17} />
                  Add contact
                </button>
              )}
              {activeSection === "followups" && (
                <button
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  onClick={openFollowUpModal}
                  type="button"
                >
                  <Plus size={17} />
                  Add task
                </button>
              )}
            </div>
          </section>

          {contactsError && (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
              {contactsError}
            </p>
          )}
          {dashboardError && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
              Dashboard statistics could not be refreshed: {dashboardError}
            </p>
          )}
          {importResult && (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900" role="status">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">
                  Imported {importResult.imported} of {importResult.total} rows
                  {importResult.failed > 0 && `, ${importResult.failed} skipped`}.
                </p>
                <button
                  aria-label="Dismiss import result"
                  className="rounded p-0.5 text-blue-700 hover:bg-blue-100"
                  onClick={() => setImportResult(null)}
                  type="button"
                >
                  <X size={16} />
                </button>
              </div>
              {importResult.errors.length > 0 && (
                <ul className="mt-2 max-h-40 list-disc overflow-y-auto pl-5 text-xs text-blue-800">
                  {importResult.errors.map((error) => (
                    <li key={error.line}>
                      Line {error.line}
                      {error.name ? ` (${error.name})` : ""}: {error.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <section
            aria-label="Contact summary"
            className="mt-6 grid grid-cols-2 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white sm:grid-cols-4"
          >
            {[
              {
                label: "Total contacts",
                value: dashboardSummary?.totalContacts ?? 0,
              },
              { label: "Added this month", value: addedThisMonth },
              { label: "Follow-ups due", value: dueCount },
              {
                label: "Favourites",
                value: dashboardSummary?.favoriteContacts ?? 0,
              },
            ].map(({ label, value }) => (
              <article
                className="px-4 py-3.5 sm:px-5"
                key={label}
              >
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                  {value}
                </p>
              </article>
            ))}
          </section>

          <section className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {activeSection === "trash"
                      ? "Deleted contacts"
                      : activeSection === "followups"
                        ? "Follow-up tasks"
                        : "Contacts"}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {activeSection === "followups"
                      ? `${filteredFollowUps.length} ${
                          filteredFollowUps.length === 1 ? "task" : "tasks"
                        }`
                      : `${pagination.total} ${
                          pagination.total === 1 ? "contact" : "contacts"
                        }`}
                  </p>
                </div>
                <label className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-slate-400 transition focus-within:border-blue-400 sm:w-64">
                  <Search size={16} />
                  <input
                    aria-label={
                      activeSection === "followups"
                        ? "Search follow-up tasks"
                        : "Search contacts"
                    }
                    className="w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={
                      activeSection === "followups"
                        ? "Search follow-ups..."
                        : "Search contacts..."
                    }
                    type="search"
                    value={search}
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
                <label className="sr-only" htmlFor="contact-company-filter">
                  Filter by company
                </label>
                <input
                  id="contact-company-filter"
                  className="min-h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-700 outline-none focus:border-blue-400"
                  onChange={(event) =>
                    updateTableParams({ company: event.target.value }, true)
                  }
                  placeholder="Company"
                  value={companyFilter}
                />
                <label className="sr-only" htmlFor="contact-tag-filter">
                  Filter by tag
                </label>
                <input
                  id="contact-tag-filter"
                  className="min-h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-700 outline-none focus:border-blue-400"
                  onChange={(event) =>
                    updateTableParams({ tag: event.target.value }, true)
                  }
                  placeholder="Tag"
                  value={tagFilter}
                />
                <label className="sr-only" htmlFor="contact-sort">
                  Sort contacts by
                </label>
                <select
                  id="contact-sort"
                  className="min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
                  onChange={(event) =>
                    updateTableParams({ sortBy: event.target.value }, true)
                  }
                  value={primarySort}
                >
                  <option value="updatedAt">Recently updated</option>
                  <option value="name">Name</option>
                  <option value="createdAt">Date added</option>
                  <option value="followUp">Follow-up date</option>
                </select>
                <label className="sr-only" htmlFor="contact-sort-then">
                  Then sort by
                </label>
                <select
                  id="contact-sort-then"
                  className="min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
                  onChange={(event) =>
                    updateTableParams({ thenBy: event.target.value }, true)
                  }
                  value={secondarySort}
                >
                  <option value="">Then by (optional)</option>
                  {allowedSortFields
                    .filter((field) => field !== primarySort)
                    .map((field) => (
                      <option key={field} value={field}>
                        Then by {field === "createdAt" ? "date added" : field === "updatedAt" ? "recently updated" : field === "followUp" ? "follow-up date" : "name"}
                      </option>
                    ))}
                </select>
                <button
                  aria-label={`Sort ${order === "asc" ? "descending" : "ascending"}`}
                  className="min-h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() =>
                    updateTableParams({ order: order === "asc" ? "desc" : "asc" }, true)
                  }
                  type="button"
                >
                  {order === "asc" ? "Ascending" : "Descending"}
                </button>
                <label className="ml-auto flex items-center gap-2 text-xs text-slate-500">
                  Rows
                  <select
                    aria-label="Rows per page"
                    className="min-h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-700"
                    onChange={(event) =>
                      updateTableParams({ limit: event.target.value }, true)
                    }
                    value={pageSize}
                  >
                    {allowedPageSizes.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </label>
              </div>

              {activeSection === "followups" && (
                <div
                  aria-label="Filter follow-up tasks"
                  className="flex gap-1 border-b border-slate-200 px-4 py-3 sm:px-5"
                  role="tablist"
                >
                  {[
                    { id: "all", label: "All" },
                    { id: "pending", label: "Pending" },
                    { id: "completed", label: "Completed" },
                  ].map(({ id, label }) => (
                    <button
                      aria-selected={followUpStatus === id}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        followUpStatus === id
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      }`}
                      key={id}
                      onClick={() => setFollowUpStatus(id)}
                      role="tab"
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {activeSection === "followups" && followUpActionError && (
                <p
                  className="mx-4 mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:mx-5"
                  role="alert"
                >
                  {followUpActionError}
                </p>
              )}

              <div className="flex items-stretch">
                <div className="min-w-0 flex-1">
                  {activeSection === "followups" ? (
                    followUpsLoading ? (
                      <div className="px-5 py-12 text-center text-sm text-slate-500">
                        Loading follow-up tasks...
                      </div>
                    ) : followUpsError ? (
                      <div className="px-5 py-12 text-center">
                        <p className="text-sm font-medium text-slate-700">
                          Follow-up tasks could not be loaded
                        </p>
                        <p className="mt-1 text-xs text-rose-600" role="alert">
                          {followUpsError}
                        </p>
                      </div>
                    ) : filteredFollowUps.length === 0 ? (
                      <div className="px-5 py-12 text-center">
                        <p className="text-sm font-medium text-slate-700">
                          {search.trim()
                            ? "No follow-up tasks found"
                            : `No ${followUpStatus} follow-up tasks`}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {search.trim()
                            ? "Try another search."
                            : followUpStatus === "completed"
                              ? "Completed tasks will appear here."
                              : "Create a task to keep your next steps visible."}
                        </p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {filteredFollowUps.map((task) => {
                          const dueDate = String(task.dueAt).slice(0, 10);
                          const contactName =
                            task.contact?.name || "Unknown contact";
                          const contactDetails = [
                            task.contact?.email,
                            task.contact?.company,
                          ]
                            .filter(Boolean)
                            .join(" · ");
                          const statusLabel = task.completed
                            ? "Completed"
                            : dueDate < today
                              ? "Overdue"
                              : "Upcoming";
                          const statusClass = task.completed
                            ? "bg-emerald-50 text-emerald-700"
                            : dueDate < today
                              ? "bg-rose-50 text-rose-700"
                              : "bg-blue-50 text-blue-700";

                          return (
                            <li
                              className="flex flex-col gap-3 px-4 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:px-5"
                              key={task.id || task._id}
                            >
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                                {getInitials(contactName)}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-sm font-medium text-slate-800">
                                    {task.title}
                                  </p>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass}`}
                                  >
                                    {statusLabel}
                                  </span>
                                </div>
                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                  {contactName}
                                  {contactDetails ? ` · ${contactDetails}` : ""}
                                </p>
                                {task.description && (
                                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center justify-between gap-3 sm:ml-auto sm:justify-end">
                                <span className="shrink-0 text-xs text-slate-500">
                                  Due {formatFollowUp(dueDate)}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    aria-label={
                                      task.completed
                                        ? `Reopen ${task.title}`
                                        : `Mark ${task.title} complete`
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={Boolean(followUpMutationId)}
                                    onClick={() =>
                                      updateFollowUpCompletion(task)
                                    }
                                    type="button"
                                  >
                                    {task.completed ? (
                                      <RotateCcw size={14} />
                                    ) : (
                                      <Check size={14} />
                                    )}
                                    {task.completed ? "Reopen" : "Complete"}
                                  </button>
                                  <button
                                    aria-label={`Delete ${task.title}`}
                                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={Boolean(followUpMutationId)}
                                    onClick={() => deleteFollowUp(task)}
                                    title="Delete task"
                                    type="button"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )
                  ) : (
                    <>
                  {Object.entries(contactGroups).map(([letter, group]) => (
                    <section
                      aria-label={`${letter} contacts`}
                      className="scroll-mt-4"
                      id={`contact-letter-${letter}`}
                      key={letter}
                    >
                      <h3 className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 sm:px-5">
                        {letter}
                        <span className="ml-2 font-normal text-slate-400">
                          {group.length}
                        </span>
                      </h3>
                      <ul className="divide-y divide-slate-100">
                        {group.map((contact) => (
                          <li
                            className="flex min-h-[68px] items-center gap-3 px-4 py-2.5 hover:bg-slate-50 sm:px-5"
                            key={contact.id}
                          >
                            <label
                              className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-medium text-slate-600 ${
                                activeSection === "trash" ? "" : "cursor-pointer hover:ring-2 hover:ring-blue-200"
                              }`}
                              title={activeSection === "trash" ? undefined : "Upload photo"}
                            >
                              {contact.photoUrl ? (
                                <img alt="" className="h-full w-full object-cover" src={contact.photoUrl} />
                              ) : (
                                getInitials(contact.name)
                              )}
                              {uploadingPhotoId === contact.id && (
                                <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-[10px]">
                                  ...
                                </span>
                              )}
                              {activeSection !== "trash" && (
                                <input
                                  accept="image/jpeg,image/png,image/webp"
                                  aria-label={`Upload photo for ${contact.name}`}
                                  className="sr-only"
                                  onChange={(event) => handlePhotoChange(contact.id, event)}
                                  type="file"
                                />
                              )}
                            </label>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-800">
                                {contact.name}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-slate-500">
                                {contact.email || contact.phone || "No details"}
                              </p>
                            </div>
                            <div className="hidden min-w-0 flex-1 sm:block">
                              <p className="truncate text-sm text-slate-700">
                                {contact.company || "—"}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-slate-500">
                                {contact.role || (contact.tags ?? []).join(", ") || "—"}
                              </p>
                            </div>
                            <div className="hidden w-28 shrink-0 md:block">
                              <p className="text-xs text-slate-600">
                                {contact.lastContact}
                              </p>
                            </div>
                            {activeSection === "trash" ? (
                              <button
                                aria-label={`Restore ${contact.name}`}
                                className="rounded p-1.5 text-blue-600 transition hover:bg-blue-50"
                                onClick={() => restoreContact(contact.id)}
                                title="Restore contact"
                                type="button"
                              >
                                <RotateCcw size={17} />
                              </button>
                            ) : (
                              <>
                                <button
                                  aria-label={`Edit ${contact.name}`}
                                  className="rounded p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                                  onClick={() => {
                                    setEditingContact(contact);
                                    setShowAddContact(true);
                                  }}
                                  title="Edit contact"
                                  type="button"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  aria-label={`View interaction history for ${contact.name}`}
                                  className="rounded p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-700"
                                  onClick={() => setSelectedContact(contact)}
                                  title="Interaction history"
                                  type="button"
                                >
                                  <MessageSquare size={17} />
                                </button>
                                <button
                                  aria-label={
                                    contact.favorite
                                      ? `Remove ${contact.name} from favourites`
                                      : `Add ${contact.name} to favourites`
                                  }
                                  className={`rounded p-1.5 transition hover:bg-slate-100 ${
                                    contact.favorite
                                      ? "text-rose-500"
                                      : "text-slate-300 hover:text-slate-500"
                                  }`}
                                  onClick={() => toggleFavorite(contact.id)}
                                  type="button"
                                >
                                  <Heart
                                    fill={contact.favorite ? "currentColor" : "none"}
                                    size={17}
                                  />
                                </button>
                                <button
                                  aria-label={`Move ${contact.name} to trash`}
                                  className="rounded p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
                                  onClick={() => deleteContact(contact.id)}
                                  title="Move to trash"
                                  type="button"
                                >
                                  <Trash2 size={17} />
                                </button>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                  {contactsLoading ? (
                    <div className="px-5 py-12 text-center text-sm text-slate-500">
                      Loading contacts...
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                      <p className="text-sm font-medium text-slate-700">
                        {contactsError && contacts.length === 0 && deletedContacts.length === 0
                          ? "Contacts could not be loaded"
                          : activeSection === "trash"
                            ? "Trash is empty"
                            : "No contacts found"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {contactsError && contacts.length === 0 && deletedContacts.length === 0
                          ? "Check the API and MongoDB connection, then reload."
                          : activeSection === "trash"
                            ? "Deleted contacts will appear here."
                            : "Try another search or add someone new."}
                      </p>
                    </div>
                  ) : null}
                    </>
                  )}
                </div>

                {activeSection !== "followups" && (
                  <nav
                    aria-label="Jump to contact letter"
                    className="hidden w-8 shrink-0 flex-col items-center justify-center border-l border-slate-100 py-2 lg:flex"
                  >
                    {alphabet.map((letter) => (
                      <button
                        aria-label={`Jump to ${letter}`}
                        className={`flex h-[18px] w-full items-center justify-center text-[10px] font-medium ${
                          availableLetters.has(letter)
                            ? "text-blue-700 hover:bg-blue-50"
                            : "cursor-default text-slate-300"
                        }`}
                        disabled={!availableLetters.has(letter)}
                        key={letter}
                        onClick={() =>
                          document
                            .getElementById(`contact-letter-${letter}`)
                            ?.scrollIntoView({ behavior: "smooth", block: "start" })
                        }
                        type="button"
                      >
                        {letter}
                      </button>
                    ))}
                  </nav>
                )}
              </div>
              {activeSection === "followups" ? (
                <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:px-5">
                  {filteredFollowUps.length}{" "}
                  {filteredFollowUps.length === 1 ? "task" : "tasks"}
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:px-5">
                  <span className="text-xs text-slate-500">
                    {pagination.total === 0
                      ? "0 contacts"
                      : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, pagination.total)} of ${pagination.total} contacts`}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={page <= 1 || contactsLoading}
                      onClick={() => updateTableParams({ page: page - 1 })}
                      type="button"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-slate-500">
                      Page {page} of {Math.max(1, pagination.totalPages)}
                    </span>
                    <button
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={page >= pagination.totalPages || contactsLoading}
                      onClick={() => updateTableParams({ page: page + 1 })}
                      type="button"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            <aside className="rounded-xl border border-slate-200 bg-white">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Follow-ups
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Due or coming up
                  </p>
                </div>
                <CalendarDays className="text-slate-400" size={17} />
              </div>

              <div className="divide-y divide-slate-100 px-4">
                {pendingFollowUpsLoading ? (
                  <p className="py-6 text-center text-xs text-slate-500">
                    Loading follow-ups...
                  </p>
                ) : pendingFollowUpsError ? (
                  <p className="py-6 text-center text-xs text-rose-600" role="alert">
                    Follow-ups could not be loaded: {pendingFollowUpsError}
                  </p>
                ) : sortedPendingFollowUps.length === 0 ? (
                  <div className="px-2 py-8 text-center">
                    <Check className="mx-auto text-slate-400" size={20} />
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      No follow-ups scheduled
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Your upcoming tasks will appear here.
                    </p>
                  </div>
                ) : (
                  sortedPendingFollowUps.slice(0, 4).map((task) => {
                    const dueDate = String(task.dueAt).slice(0, 10);
                    const contactName = task.contact?.name || "Unknown contact";

                    return (
                      <article
                        className="flex items-center gap-3 py-3"
                        key={task.id || task._id}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">
                          {getInitials(contactName)}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-slate-800">
                            {task.title}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500">
                            {contactName}
                            {[
                              task.contact?.email,
                              task.contact?.company,
                            ]
                              .filter(Boolean)
                              .map((detail) => ` · ${detail}`)
                              .join("")}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 text-[11px] ${
                            dueDate < today
                              ? "font-medium text-rose-600"
                              : "text-slate-500"
                          }`}
                        >
                          {dueDate < today ? "Overdue" : formatFollowUp(dueDate)}
                        </span>
                      </article>
                    );
                  })
                )}
              </div>

              <button
                className="flex w-full items-center justify-between border-t border-slate-200 px-4 py-3 text-xs font-medium text-blue-700 hover:bg-slate-50"
                onClick={() => setActiveSection("followups")}
                type="button"
              >
                View follow-ups
                <span aria-hidden="true">→</span>
              </button>
            </aside>
          </section>

          <p className="mt-7 text-center text-[11px] text-slate-400">
            ContactX Workspace · Contacts saved securely
          </p>

        </div>
      </main>

      {showAddContact && (
        <ContactModal
          contact={editingContact}
          onClose={() => {
            setShowAddContact(false);
            setEditingContact(null);
          }}
          onSave={editingContact ? updateContact : addContact}
        />
      )}
      {showAddFollowUp && (
        <FollowUpModal
          contacts={followUpContacts}
          contactsError={followUpContactsError}
          contactsLoading={followUpContactsLoading}
          onClose={() => setShowAddFollowUp(false)}
          onSave={createFollowUp}
        />
      )}
      {selectedContact && (
        <InteractionHistoryModal
          contact={selectedContact}
          key={selectedContact.id || selectedContact._id}
          onClose={() => setSelectedContact(null)}
        />
      )}
    </div>
  );
}
