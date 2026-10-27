import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Heart,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import demoContacts from "../data/demo-contacts.json";
import { authService } from "../services/authService";

const navigate = useNavigate();

const [currentUser, setCurrentUser] = useState(null);

useEffect(() => {
  authService.getMe().then(user => {
    if (user) setCurrentUser(user);
  });
}, []);

const handleLogout = () => {
  authService.logout();
  setCurrentUser(null);
  navigate("/login");
};

const navigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "contacts", label: "All contacts", icon: Users },
  { id: "favorites", label: "Favourites", icon: Heart },
  { id: "followups", label: "Follow-ups", icon: CalendarDays },
];

const avatarColors = {
  violet: "bg-violet-100 text-violet-700",
  amber: "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
  pink: "bg-pink-100 text-pink-700",
  blue: "bg-blue-100 text-blue-700",
  rose: "bg-rose-100 text-rose-700",
};

const tagColors = [
  "bg-blue-50 text-blue-700",
  "bg-violet-50 text-violet-700",
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700",
];

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekAhead() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return getLocalDateString(date);
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

function downloadContacts(contacts) {
  const columns = ["name", "email", "phone", "company", "role", "tags"];
  const escapeCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = [
    columns.join(","),
    ...contacts.map((contact) =>
      columns
        .map((column) =>
          escapeCell(
            column === "tags" ? contact.tags.join(", ") : contact[column],
          ),
        )
        .join(","),
    ),
  ];
  const url = URL.createObjectURL(
    new Blob([rows.join("\r\n")], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "contactx-contacts.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function ContactModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    role: "",
    tags: "",
    followUp: "",
  });
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Enter a name to add this contact.");
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    onSave({
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      favorite: false,
      lastContact: "Just added",
      color: "blue",
    });
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
            <p className="text-sm font-semibold text-blue-600">YOUR NETWORK</p>
            <h2
              className="mt-1 text-2xl font-bold tracking-tight text-slate-900"
              id="add-contact-title"
            >
              Add a contact
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Keep the people who matter close.
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
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Follow-up date
              </span>
              <input
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                onChange={(event) =>
                  setForm({ ...form, followUp: event.target.value })
                }
                type="date"
                value={form.followUp}
              />
            </label>
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
              Add contact
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(
    () => authService.getUser() || { name: "User", email: "" }
  );
  const [contacts, setContacts] = useState(() => {
    try {
      const saved = localStorage.getItem("contactx_contacts");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback to demoContacts
    }
    return demoContacts;
  });
  const [activeSection, setActiveSection] = useState("overview");
  const [search, setSearch] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("contactx_contacts", JSON.stringify(contacts));
    } catch (e) {
      console.error("Failed to save contacts:", e);
    }
  }, [contacts]);


  useEffect(() => {
    authService.getMe().then((user) => {
      if (user) setCurrentUser(user);
    });
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };


  const currentMonth = getLocalDateString().slice(0, 7);
  const today = getLocalDateString();
  const weekAhead = getWeekAhead();
  const formattedToday = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const dueCount = contacts.filter(
    (contact) => contact.followUp && contact.followUp <= today,
  ).length;
  const addedThisMonth = contacts.filter(
    (contact) => contact.createdAt?.startsWith(currentMonth),
  ).length;

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return contacts.filter((contact) => {
      const matchesSearch =
        !query ||
        [
          contact.name,
          contact.email,
          contact.phone,
          contact.company,
          contact.role,
          ...contact.tags,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      if (!matchesSearch) return false;
      if (activeSection === "favorites") return contact.favorite;
      if (activeSection === "followups") {
        return contact.followUp && contact.followUp <= weekAhead;
      }
      return true;
    });
  }, [activeSection, contacts, search, weekAhead]);

  const visibleContacts =
    activeSection === "overview" ? filteredContacts.slice(0, 5) : filteredContacts;

  function addContact(contact) {
    setContacts((current) => [
      {
        ...contact,
        id: Math.max(0, ...current.map((item) => item.id)) + 1,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setShowAddContact(false);
  }

  function toggleFavorite(id) {
    setContacts((current) =>
      current.map((contact) =>
        contact.id === id
          ? { ...contact, favorite: !contact.favorite }
          : contact,
      ),
    );
  }

  const pageTitle =
    navigation.find((item) => item.id === activeSection)?.label ?? "Overview";

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200/80 bg-white px-5 py-6 lg:flex">
        <Link
          aria-label="ContactX home"
          className="px-2 text-2xl font-extrabold tracking-tight"
          to="/"
        >
          Contact<span className="text-blue-600">X</span>
        </Link>

        <div className="mt-10 px-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Workspace
          </p>
          <nav aria-label="Main navigation" className="mt-3 space-y-1">
            {navigation.map(({ id, label, icon: Icon }) => (
              <button
                aria-current={activeSection === id ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
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
        </div>

        <div className="mt-9 px-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Your lists
          </p>
          <div className="mt-4 space-y-3">
            {[
              ["Work", "bg-blue-500"],
              ["Personal", "bg-violet-500"],
              ["Customers", "bg-emerald-500"],
            ].map(([label, color]) => (
              <div
                className="flex items-center gap-3 text-sm text-slate-600"
                key={label}
              >
                <span className={`h-2 w-2 rounded-full ${color}`} />
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-violet-50 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <Sparkles size={17} />
          </div>
          <p className="mt-3 text-sm font-bold text-slate-800">
            Make every connection count.
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Your people, details, and next steps—all in one place.
          </p>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-7 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                aria-label="ContactX home"
                className="text-xl font-extrabold tracking-tight lg:hidden"
                to="/"
              >
                Contact<span className="text-blue-600">X</span>
              </Link>
              <div className="hidden text-sm text-slate-400 sm:block">
                Workspace <span className="mx-1.5">/</span>
                <span className="font-semibold text-slate-700">
                  {pageTitle}
                </span>
              </div>
              <span className="truncate text-sm font-semibold text-slate-700 sm:hidden">
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

        <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10">
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {navigation.map(({ id, label, icon: Icon }) => (
              <button
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                  activeSection === id
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600"
                }`}
                key={id}
                onClick={() => setActiveSection(id)}
                type="button"
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
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
            <div className="flex flex-wrap gap-2.5">
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                onClick={() => downloadContacts(filteredContacts)}
                type="button"
              >
                <ArrowDownToLine size={16} />
                Export
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
                onClick={() => setShowAddContact(true)}
                type="button"
              >
                <Plus size={17} />
                Add contact
              </button>
            </div>
          </section>

          <section
            aria-label="Contact summary"
            className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4"
          >
            {[
              {
                label: "Total contacts",
                value: contacts.length,
                detail: "In your network",
                icon: Users,
                tone: "blue",
              },
              {
                label: "Added this month",
                value: addedThisMonth,
                detail: "New connections",
                icon: ArrowUpRight,
                tone: "violet",
              },
              {
                label: "Follow-ups due",
                value: dueCount,
                detail: dueCount ? "Keep the conversation going" : "You're all caught up",
                icon: CalendarDays,
                tone: "amber",
              },
              {
                label: "Favourites",
                value: contacts.filter((contact) => contact.favorite).length,
                detail: "People to keep close",
                icon: Heart,
                tone: "rose",
              },
            ].map(({ label, value, detail, icon: Icon, tone }) => (
              <article
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.025)] sm:p-5"
                key={label}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500 sm:text-sm">
                    {label}
                  </span>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      tone === "blue"
                        ? "bg-blue-50 text-blue-600"
                        : tone === "violet"
                          ? "bg-violet-50 text-violet-600"
                          : tone === "amber"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    <Icon size={17} />
                  </span>
                </div>
                <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                  {value}
                </p>
                <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
                  {detail}
                </p>
              </article>
            ))}
          </section>

          <section className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)]">
            <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.025)]">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:px-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {activeSection === "overview"
                      ? "Recent contacts"
                      : pageTitle}
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    {activeSection === "overview"
                      ? "The latest people in your network"
                      : `${filteredContacts.length} ${
                          filteredContacts.length === 1 ? "contact" : "contacts"
                        }`}
                  </p>
                </div>
                <label className="flex min-h-10 items-center gap-2.5 rounded-xl border border-slate-200 px-3 text-slate-400 transition focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50 sm:w-64">
                  <Search size={16} />
                  <input
                    aria-label="Search contacts"
                    className="w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search contacts..."
                    type="search"
                    value={search}
                  />
                </label>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left">
                  <thead>
                    <tr className="bg-slate-50/80">
                      {["Contact", "Company", "Tags", "Last interaction", ""].map(
                        (heading) => (
                          <th
                            className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400"
                            key={heading || "actions"}
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleContacts.map((contact) => (
                      <tr
                        className="transition hover:bg-slate-50/70"
                        key={contact.id}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                avatarColors[contact.color] ??
                                "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {getInitials(contact.name)}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {contact.name}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-400">
                                {contact.email || contact.phone || "No details yet"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-slate-700">
                            {contact.company || "—"}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {contact.role || "—"}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            {contact.tags.length ? (
                              contact.tags.slice(0, 2).map((tag, index) => (
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                    tagColors[index % tagColors.length]
                                  }`}
                                  key={tag}
                                >
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-slate-500">
                            {contact.lastContact}
                          </span>
                          {contact.followUp && (
                            <span className="mt-1 flex items-center gap-1 text-[10px] font-medium text-amber-600">
                              <Clock3 size={11} />
                              Follow up {formatFollowUp(contact.followUp)}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            aria-label={
                              contact.favorite
                                ? `Remove ${contact.name} from favourites`
                                : `Add ${contact.name} to favourites`
                            }
                            className={`rounded-lg p-2 transition hover:bg-rose-50 ${
                              contact.favorite
                                ? "text-rose-500"
                                : "text-slate-300 hover:text-rose-400"
                            }`}
                            onClick={() => toggleFavorite(contact.id)}
                            type="button"
                          >
                            <Heart
                              fill={contact.favorite ? "currentColor" : "none"}
                              size={17}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {visibleContacts.length === 0 && (
                      <tr>
                        <td className="px-5 py-14 text-center" colSpan={5}>
                          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <Users size={20} />
                          </div>
                          <p className="mt-3 text-sm font-semibold text-slate-700">
                            No contacts found
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Try another search or add someone new.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
                <span className="text-xs text-slate-400">
                  Showing {visibleContacts.length} of {filteredContacts.length}{" "}
                  contacts
                </span>
                <button
                  className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                  onClick={() => setActiveSection("contacts")}
                  type="button"
                >
                  View all contacts <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>

            <aside className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)] sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Upcoming follow-ups
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Stay in touch, one step at a time
                  </p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <CalendarDays size={17} />
                </span>
              </div>

              <div className="mt-5 space-y-2">
                {contacts
                  .filter(
                    (contact) =>
                      contact.followUp &&
                      contact.followUp >= today &&
                      contact.followUp <= weekAhead,
                  )
                  .sort((a, b) => a.followUp.localeCompare(b.followUp))
                  .slice(0, 4)
                  .map((contact) => (
                    <article
                      className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-blue-100 hover:bg-blue-50/30"
                      key={contact.id}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          avatarColors[contact.color] ??
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {getInitials(contact.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-800">
                          {contact.name}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-slate-400">
                          {contact.company || "Personal connection"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                        {formatFollowUp(contact.followUp)}
                      </span>
                    </article>
                  ))}
                {contacts.filter(
                  (contact) =>
                    contact.followUp &&
                    contact.followUp >= today &&
                    contact.followUp <= weekAhead,
                ).length === 0 && (
                  <div className="rounded-xl bg-slate-50 px-4 py-8 text-center">
                    <Check className="mx-auto text-emerald-500" size={22} />
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      You&apos;re all caught up
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Add a follow-up when you want to reconnect.
                    </p>
                  </div>
                )}
              </div>

              <button
                className="mt-4 flex w-full items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                onClick={() => setActiveSection("followups")}
                type="button"
              >
                See all follow-ups
                <ArrowUpRight size={14} />
              </button>
              <div className="mt-5 flex items-start gap-3 rounded-xl bg-blue-50/80 p-3.5">
                <BriefcaseBusiness
                  className="mt-0.5 shrink-0 text-blue-600"
                  size={16}
                />
                <p className="text-[11px] leading-5 text-slate-600">
                  A thoughtful follow-up can turn a good conversation into a
                  lasting relationship.
                </p>
              </div>
            </aside>
          </section>

          <p className="mt-7 text-center text-[11px] text-slate-400">
            ContactX Workspace · Contacts saved securely
          </p>

        </div>
      </main>

      {showAddContact && (
        <ContactModal
          onClose={() => setShowAddContact(false)}
          onSave={addContact}
        />
      )}
    </div>
  );
}
