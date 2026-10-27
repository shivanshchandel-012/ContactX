import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  CalendarDays,
  Check,
  Clock3,
  Heart,
  LayoutDashboard,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import demoContacts from "../data/demo-contacts.json";

const navigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "contacts", label: "All contacts", icon: Users },
  { id: "favorites", label: "Favourites", icon: Heart },
  { id: "followups", label: "Follow-ups", icon: CalendarDays },
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

function getContactGroups(contacts) {
  const sortedContacts = [...contacts].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );

  return sortedContacts.reduce((groups, contact) => {
    const letter = contact.name.trim().charAt(0).toUpperCase();
    const key = /^[A-Z]$/.test(letter) ? letter : "#";
    groups[key] ??= [];
    groups[key].push(contact);
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
            <h2
              className="mt-1 text-2xl font-bold tracking-tight text-slate-900"
              id="add-contact-title"
            >
              Add a contact
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
  const [contacts, setContacts] = useState(demoContacts);
  const [activeSection, setActiveSection] = useState("overview");
  const [search, setSearch] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);

  const currentMonth = getLocalDateString().slice(0, 7);
  const today = getLocalDateString();
  const weekAhead = getWeekAhead();
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

  const contactGroups = getContactGroups(filteredContacts);
  const availableLetters = new Set(Object.keys(contactGroups));
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

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
                Demo account
              </p>
              <p className="mt-0.5 text-xs text-slate-400">Local workspace</p>
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
              <span className="hidden text-xs text-slate-400 sm:block">
                Demo data
              </span>
              <Link
                className="text-xs font-medium text-slate-500 transition hover:text-slate-800"
                to="/login"
              >
                Sign out
              </Link>
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
              </button>
            ))}
          </div>

          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {pageTitle}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage your contacts and keep track of follow-ups.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => downloadContacts(filteredContacts)}
                type="button"
              >
                <ArrowDownToLine size={16} />
                Export
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
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
            className="mt-6 grid grid-cols-2 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white sm:grid-cols-4"
          >
            {[
              { label: "Total contacts", value: contacts.length },
              { label: "Added this month", value: addedThisMonth },
              { label: "Follow-ups due", value: dueCount },
              {
                label: "Favourites",
                value: contacts.filter((contact) => contact.favorite).length,
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
                    Contacts
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {filteredContacts.length}{" "}
                    {filteredContacts.length === 1 ? "contact" : "contacts"}
                  </p>
                </div>
                <label className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-slate-400 transition focus-within:border-blue-400 sm:w-64">
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

              <div className="flex items-stretch">
                <div className="min-w-0 flex-1">
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
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                              {getInitials(contact.name)}
                            </span>
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
                                {contact.role || contact.tags.join(", ") || "—"}
                              </p>
                            </div>
                            <div className="hidden w-28 shrink-0 md:block">
                              <p className="text-xs text-slate-600">
                                {contact.lastContact}
                              </p>
                              {contact.followUp && (
                                <p
                                  className={`mt-1 flex items-center gap-1 text-[11px] ${
                                    contact.followUp < today
                                      ? "font-medium text-rose-600"
                                      : "text-slate-500"
                                  }`}
                                >
                                  <Clock3 size={11} />
                                  {contact.followUp < today
                                    ? "Overdue"
                                    : formatFollowUp(contact.followUp)}
                                </p>
                              )}
                            </div>
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
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                  {filteredContacts.length === 0 && (
                    <div className="px-5 py-12 text-center">
                      <p className="text-sm font-medium text-slate-700">
                        No contacts found
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Try another search or add someone new.
                      </p>
                    </div>
                  )}
                </div>

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
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 sm:px-5">
                <span className="text-xs text-slate-500">
                  {filteredContacts.length}{" "}
                  {filteredContacts.length === 1 ? "contact" : "contacts"}
                </span>
                <button
                  className="text-xs font-medium text-blue-700 hover:text-blue-800"
                  onClick={() => setActiveSection("contacts")}
                  type="button"
                >
                  View all contacts <span aria-hidden="true">→</span>
                </button>
              </div>
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
                {contacts
                  .filter(
                    (contact) =>
                      contact.followUp &&
                      contact.followUp <= weekAhead,
                  )
                  .sort((a, b) => a.followUp.localeCompare(b.followUp))
                  .slice(0, 4)
                  .map((contact) => (
                    <article
                      className="flex items-center gap-3 py-3"
                      key={contact.id}
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-medium text-slate-600"
                      >
                        {getInitials(contact.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-800">
                          {contact.name}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">
                          {contact.company || "Personal connection"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-[11px] ${
                          contact.followUp < today
                            ? "font-medium text-rose-600"
                            : "text-slate-500"
                        }`}
                      >
                        {contact.followUp < today
                          ? "Overdue"
                          : formatFollowUp(contact.followUp)}
                      </span>
                    </article>
                  ))}
                {contacts.filter(
                  (contact) =>
                    contact.followUp &&
                    contact.followUp <= weekAhead,
                ).length === 0 && (
                  <div className="px-2 py-8 text-center">
                    <Check className="mx-auto text-slate-400" size={20} />
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      No follow-ups scheduled
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Add a date to a contact to see it here.
                    </p>
                  </div>
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

          <p className="mt-5 text-xs text-slate-400">
            Demo data is temporary and resets when you refresh.
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
