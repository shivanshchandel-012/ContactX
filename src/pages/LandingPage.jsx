
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  ArrowRight,
  Menu,
  X,
  Search,
  Heart,
  CalendarCheck,
  FileSpreadsheet,
  BarChart3,
  ShieldCheck,
  Check,
  Clock3,
  Bell,
  Star,
  LayoutDashboard,
  Zap,
  Sparkles,
  Layers3,
  ArrowUpRight,
  MoveUpRight,
} from "lucide-react";

/* -------------------- DATA -------------------- */

const features = [
  {
    icon: Users,
    number: "01",
    title: "Your entire network, in one place.",
    description:
      "Bring people, companies, roles, and the little details that matter into one clear workspace.",
    tone: "blue",
  },
  {
    icon: Search,
    number: "02",
    title: "Find the right person, fast.",
    description:
      "Search, sort, and filter your contacts by name, company, designation, or custom tags.",
    tone: "violet",
  },
  {
    icon: CalendarCheck,
    number: "03",
    title: "Turn reminders into relationships.",
    description:
      "Keep calls, meetings, and follow-ups visible so important conversations keep moving.",
    tone: "emerald",
  },
  {
    icon: FileSpreadsheet,
    number: "04",
    title: "Move your data without friction.",
    description:
      "Import contacts from CSV and export the records you need whenever you need them.",
    tone: "amber",
  },
  {
    icon: Heart,
    number: "05",
    title: "Keep your people close.",
    description:
      "Favourite important contacts and get back to the relationships that deserve your attention.",
    tone: "rose",
  },
  {
    icon: BarChart3,
    number: "06",
    title: "See your progress at a glance.",
    description:
      "Get an overview of your contacts, recent additions, and follow-ups due.",
    tone: "cyan",
  },
];

const contacts = [
  {
    name: "Olivia Rhye",
    initials: "OR",
    email: "olivia@untitledui.com",
    company: "Untitled UI",
    role: "Product Designer",
    tag: "Design",
    color: "bg-violet-100 text-violet-700",
    tagColor: "bg-violet-50 text-violet-700",
  },
  {
    name: "Phoenix Baker",
    initials: "PB",
    email: "phoenix@acme.com",
    company: "Acme Inc.",
    role: "Engineering Lead",
    tag: "Work",
    color: "bg-amber-100 text-amber-700",
    tagColor: "bg-blue-50 text-blue-700",
  },
  {
    name: "Lana Steiner",
    initials: "LS",
    email: "lana@circooles.com",
    company: "Circooles",
    role: "Marketing Manager",
    tag: "Marketing",
    color: "bg-emerald-100 text-emerald-700",
    tagColor: "bg-emerald-50 text-emerald-700",
  },
  {
    name: "Demi Wilkinson",
    initials: "DW",
    email: "demi@layers.com",
    company: "Layers",
    role: "UX Researcher",
    tag: "Personal",
    color: "bg-pink-100 text-pink-700",
    tagColor: "bg-rose-50 text-rose-700",
  },
];

const steps = [
  {
    number: "01",
    icon: Layers3,
    title: "Bring it all together",
    description:
      "Add contacts one by one or import your existing list. Your network finally has a home.",
    detail: "One organized workspace",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "Make every detail useful",
    description:
      "Add tags, company details, notes, and interaction history that make every contact more meaningful.",
    detail: "Context at your fingertips",
  },
  {
    number: "03",
    icon: CalendarCheck,
    title: "Follow through naturally",
    description:
      "Know who to reach out to next, what you last discussed, and which follow-up needs attention.",
    detail: "Relationships that move forward",
  },
];

const faqs = [
  {
    question: "What is ContactX?",
    answer:
      "ContactX is a contact manager and mini CRM for organizing people, recording interactions, and keeping follow-ups visible.",
  },
  {
    question: "Can I import my existing contacts?",
    answer:
      "ContactX is designed to support CSV import and export, making it easier to bring existing contact lists into your workspace.",
  },
  {
    question: "Can I track calls and meetings?",
    answer:
      "ContactX is designed to keep interaction histories for calls, emails, and meetings, including notes and follow-up dates.",
  },
  {
    question: "Is ContactX connected to a database?",
    answer:
      "This landing page uses sample dashboard data. Persistent contact storage and authentication will work once the backend is connected.",
  },
];

/* -------------------- SCROLL REVEAL -------------------- */

function useScrollReveal() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = container.querySelectorAll("[data-reveal]");

    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) =>
        element.classList.add("is-visible")
      );
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -30px 0px",
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return containerRef;
}

/* -------------------- LOGO -------------------- */

function Logo({ footer = false }) {
  return (
    <Link
      to="/"
      aria-label="ContactX home"
      className={`inline-flex items-baseline tracking-[-0.075em] ${
        footer ? "text-white" : "text-slate-950"
      }`}
    >
      <span className="text-[25px] font-bold sm:text-[27px]">
        Contact
      </span>
      <span className="ml-0.5 text-[36px] font-black leading-none text-blue-600 sm:text-[40px]">
        X
      </span>
    </Link>
  );
}

/* -------------------- NAVBAR -------------------- */

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-white/85 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        <Logo />

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
          >
            Log in
          </Link>

          <Link
            to="/register"
            className="hidden items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700 sm:inline-flex"
          >
            Get started <ArrowRight size={16} />
          </Link>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg border border-slate-200 p-2 text-slate-700 sm:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-slate-100 bg-white px-5 py-4 shadow-lg sm:hidden">
          <div className="flex flex-col gap-2">
            <Link
              onClick={() => setMenuOpen(false)}
              to="/login"
              className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700"
            >
              Log in
            </Link>

            <Link
              onClick={() => setMenuOpen(false)}
              to="/register"
              className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* -------------------- DASHBOARD PREVIEW -------------------- */

function DashboardPreview() {
  const stats = [
    { label: "Total contacts", value: "248", icon: Users },
    { label: "Added this month", value: "34", icon: Zap },
    { label: "Follow-ups due", value: "12", icon: Bell },
    { label: "Favourites", value: "28", icon: Star },
  ];

  return (
    <div className="relative mx-auto w-full max-w-5xl" data-reveal>
      <div className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-r from-blue-200/60 via-violet-100/70 to-cyan-100/60 blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_35px_100px_-35px_rgba(15,23,42,0.25)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_45px_110px_-35px_rgba(37,99,235,0.25)]">
        <div className="flex min-h-[430px]">
          <aside className="hidden w-48 shrink-0 border-r border-slate-100 bg-slate-50/80 p-5 md:block">
            <Logo />

            <div className="mt-9 space-y-2 text-sm">
              <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-2.5 font-semibold text-blue-700">
                <LayoutDashboard size={17} />
                Overview
              </div>

              <div className="flex items-center gap-3 px-3 py-2.5 text-slate-500">
                <Users size={17} />
                All contacts
              </div>

              <div className="flex items-center gap-3 px-3 py-2.5 text-slate-500">
                <Heart size={17} />
                Favourites
              </div>

              <div className="flex items-center gap-3 px-3 py-2.5 text-slate-500">
                <Clock3 size={17} />
                Follow-ups
              </div>
            </div>

            <div className="mt-10 rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold">Stay connected</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Keep your relationships moving forward.
              </p>
            </div>
          </aside>

          <div className="min-w-0 flex-1 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400">YOUR WORKSPACE</p>
                <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Good morning, Alex
                </h3>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Here&apos;s what&apos;s happening with your contacts.
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                A
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-slate-200 p-3 transition hover:border-blue-200 hover:bg-blue-50/40 sm:p-4"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-slate-500 sm:text-xs">
                        {stat.label}
                      </span>
                      <Icon size={15} className="text-blue-600" />
                    </div>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {stat.value}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
                <div>
                  <h4 className="text-sm font-bold">Recent contacts</h4>
                  <p className="mt-1 text-xs text-slate-500">
                    A quick look at your network
                  </p>
                </div>

                <span className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500">
                  <Search size={13} />
                  Search
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[470px] text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      {["Contact", "Company", "Tag", ""].map((heading) => (
                        <th
                          key={heading}
                          className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:px-4"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {contacts.map((contact) => (
                      <tr
                        key={contact.email}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-3 py-3 sm:px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${contact.color}`}
                            >
                              {contact.initials}
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-slate-800">
                                {contact.name}
                              </p>
                              <p className="mt-0.5 text-[10px] text-slate-400">
                                {contact.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3 sm:px-4">
                          <p className="text-xs font-medium text-slate-700">
                            {contact.company}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {contact.role}
                          </p>
                        </td>

                        <td className="px-3 py-3 sm:px-4">
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-semibold ${contact.tagColor}`}
                          >
                            {contact.tag}
                          </span>
                        </td>

                        <td className="px-3 py-3 sm:px-4">
                          <Heart size={14} className="text-slate-300" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                <span className="text-[10px] text-slate-400">
                  Showing 4 of 248 contacts
                </span>
                <span className="text-xs font-semibold text-blue-600">
                  View all ↗
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -right-2 top-14 hidden rounded-xl border border-white bg-white/95 p-3 shadow-xl backdrop-blur sm:block lg:-right-7">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Check size={17} />
          </div>
          <div>
            <p className="text-xs font-bold">Follow-up complete</p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Relationship on track
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- FAQ ACCORDION -------------------- */

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="divide-y divide-slate-200">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;

        return (
          <div key={faq.question} className="py-5">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <span className="text-[15px] font-semibold text-slate-900 transition hover:text-blue-700">
                {faq.question}
              </span>

              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition ${
                  isOpen
                    ? "rotate-180 border-blue-200 bg-blue-50 text-blue-600"
                    : ""
                }`}
              >
                <ArrowRight size={15} className="-rotate-45" />
              </span>
            </button>

            <div
              className={`grid transition-all duration-300 ${
                isOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="max-w-xl pt-3 text-sm leading-7 text-slate-600">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------- MAIN LANDING PAGE -------------------- */

export default function LandingPage() {
  const revealRef = useScrollReveal();

  return (
    <div
      ref={revealRef}
      className="min-h-screen overflow-hidden bg-white text-slate-900"
    >
      <Navbar />

      <main>
        {/* Hero */}
        <section className="hero-gradient relative isolate px-5 pb-20 pt-20 sm:px-8 sm:pb-28 sm:pt-28 lg:px-10 lg:pb-32 lg:pt-32">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -left-40 -top-32 h-[28rem] w-[28rem] rounded-full bg-blue-300/25 blur-[100px]" />
            <div className="absolute right-[-8rem] top-12 h-[30rem] w-[30rem] rounded-full bg-violet-300/25 blur-[110px]" />
            <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-200/20 blur-[90px]" />
          </div>

          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto max-w-4xl text-center" data-reveal>
              <h1 className="text-4xl font-extrabold leading-[1.08] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl xl:text-[82px]">
                Know your people.
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  Grow your connections.
                </span>
              </h1>

              <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                All your contacts, conversations, and next steps — brought
                together in one calm, beautifully organized workspace.
              </p>

              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-blue-600/25 transition duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-blue-600/35"
                >
                  Get started free
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>

                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white/80 px-7 py-4 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white"
                >
                  Explore ContactX <MoveUpRight size={16} />
                </a>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500 sm:text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-emerald-600" />
                  Thoughtful, organized workflows
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <Check size={15} className="text-emerald-600" />
                  Made for meaningful connections
                </span>
              </div>
            </div>

            <div className="mt-16 sm:mt-20 lg:mt-24">
              <DashboardPreview />
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="relative scroll-mt-24 px-5 py-20 sm:px-8 lg:px-10 lg:py-28"
        >
          <div className="mx-auto max-w-7xl">
            <div
              className="mb-12 flex flex-col justify-between gap-5 md:mb-16 md:flex-row md:items-end"
              data-reveal
            >
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                  A clearer way to connect
                </p>
                <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.04em] text-slate-950 sm:text-5xl">
                  Everything important.
                  <br className="hidden sm:block" /> Nothing in the way.
                </h2>
              </div>

              <p className="max-w-md text-sm leading-7 text-slate-600 sm:text-base">
                Less time hunting for details. More time building the
                relationships that move your work forward.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;

                const toneClasses = {
                  blue: "bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white",
                  violet: "bg-violet-50 text-violet-700 group-hover:bg-violet-600 group-hover:text-white",
                  emerald: "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white",
                  amber: "bg-amber-50 text-amber-700 group-hover:bg-amber-500 group-hover:text-white",
                  rose: "bg-rose-50 text-rose-700 group-hover:bg-rose-600 group-hover:text-white",
                  cyan: "bg-cyan-50 text-cyan-700 group-hover:bg-cyan-600 group-hover:text-white",
                };

                return (
                  <article
                    key={feature.number}
                    data-reveal
                    style={{ transitionDelay: `${index * 70}ms` }}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 transition-all duration-500 hover:-translate-y-2 hover:border-blue-200 hover:shadow-[0_25px_60px_-25px_rgba(37,99,235,0.25)] sm:p-7"
                  >
                    <span className="absolute right-6 top-6 text-xs font-bold tracking-widest text-slate-300 transition group-hover:text-blue-500">
                      {feature.number}
                    </span>

                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:rotate-[-5deg] group-hover:scale-110 ${toneClasses[feature.tone]}`}
                    >
                      <Icon size={22} />
                    </div>

                    <h3 className="mt-6 max-w-[17rem] text-lg font-bold leading-snug tracking-tight text-slate-900">
                      {feature.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {feature.description}
                    </p>

                    <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-blue-600 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                      Built into your workflow <ArrowUpRight size={14} />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Redesigned workflow */}
        <section
          id="how-it-works"
          className="relative overflow-hidden bg-slate-950 px-5 py-20 text-white sm:px-8 lg:px-10 lg:py-28"
        >
          <div className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-blue-600/20 blur-[110px]" />
          <div className="pointer-events-none absolute -bottom-48 -left-24 h-[28rem] w-[28rem] rounded-full bg-violet-600/20 blur-[110px]" />

          <div className="relative mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
              <div
                data-reveal
                className="lg:sticky lg:top-32 lg:self-start"
              >
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-300">
                  A simple rhythm
                </p>

                <h2 className="mt-5 text-4xl font-bold leading-[1.08] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                  Good relationships
                  <br />
                  <span className="text-slate-400">
                    don&apos;t happen by accident.
                  </span>
                </h2>

                <p className="mt-6 max-w-md text-base leading-8 text-slate-300">
                  ContactX helps you turn scattered details into a consistent,
                  thoughtful way of staying connected.
                </p>

                <Link
                  to="/register"
                  className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-blue-300"
                >
                  Build your network
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>

                <div className="mt-12 hidden items-center gap-3 border-t border-white/10 pt-6 sm:flex">
                  <div className="flex -space-x-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-950 bg-blue-400 text-[10px] font-bold text-slate-950">
                      A
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-950 bg-violet-300 text-[10px] font-bold text-slate-950">
                      J
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-950 bg-emerald-300 text-[10px] font-bold text-slate-950">
                      M
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    A little more intention in every interaction.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;

                  return (
                    <article
                      key={step.number}
                      data-reveal
                      style={{ transitionDelay: `${index * 120}ms` }}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-blue-300/40 hover:bg-white/[0.08] hover:shadow-2xl hover:shadow-blue-950/30 sm:p-8"
                    >
                      <div className="absolute right-0 top-0 h-36 w-36 translate-x-12 -translate-y-12 rounded-full bg-blue-500/0 blur-3xl transition duration-500 group-hover:bg-blue-500/20" />

                      <div className="relative flex gap-5 sm:gap-7">
                        <div className="flex shrink-0 flex-col items-center">
                          <span className="text-xs font-bold tracking-[0.2em] text-blue-300">
                            {step.number}
                          </span>

                          <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-blue-200 transition duration-300 group-hover:scale-110 group-hover:border-blue-300/30 group-hover:bg-blue-500/15">
                            <Icon size={22} />
                          </div>

                          {index !== steps.length - 1 && (
                            <div className="mt-4 h-full min-h-8 w-px bg-gradient-to-b from-white/20 to-transparent" />
                          )}
                        </div>

                        <div className="flex-1 pb-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                              {step.title}
                            </h3>

                            <ArrowUpRight
                              size={17}
                              className="text-slate-500 transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-blue-300"
                            />
                          </div>

                          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                            {step.description}
                          </p>

                          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300">
                            <Check size={13} className="text-emerald-300" />
                            {step.detail}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ: heading on left, questions on right */}
        <section
          id="faq"
          className="scroll-mt-24 px-5 py-20 sm:px-8 lg:px-10 lg:py-28"
        >
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div
              data-reveal
              className="lg:sticky lg:top-32 lg:self-start"
            >
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                Need to know
              </p>

              <h2 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.045em] text-slate-950 sm:text-5xl">
                A few things
                <br />
                you might be
                <br />
                <span className="text-slate-400">wondering.</span>
              </h2>

              <p className="mt-5 max-w-sm text-sm leading-7 text-slate-600 sm:text-base">
                A little clarity before you get started with ContactX.
              </p>

              <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
                <ShieldCheck size={15} />
                Simple by design
              </div>
            </div>

            <div data-reveal className="lg:pt-1">
              <FAQSection />
            </div>
          </div>
        </section>
      </main>

      {/* Premium footer */}
      <footer className="relative overflow-hidden bg-[#080f20] px-5 pb-7 pt-14 text-white sm:px-8 lg:px-10 lg:pt-16">
        <div className="pointer-events-none absolute -right-20 -top-40 h-80 w-80 rounded-full bg-blue-600/20 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-[1.4fr_0.6fr_0.6fr] md:gap-16">
            <div>
              <Logo footer />

              <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
                A calmer way to manage your contacts, remember the details,
                and make every connection count.
              </p>

              <Link
                to="/register"
                className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-100"
              >
                Get started
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Explore
              </p>

              <div className="mt-5 flex flex-col items-start gap-3 text-sm text-slate-300">
                <a href="#features" className="transition hover:text-white">
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="transition hover:text-white"
                >
                  How it works
                </a>
                <a href="#faq" className="transition hover:text-white">
                  FAQs
                </a>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Your account
              </p>

              <div className="mt-5 flex flex-col items-start gap-3 text-sm text-slate-300">
                <Link to="/login" className="transition hover:text-white">
                  Log in <ArrowUpRight size={13} className="ml-1 inline" />
                </Link>

                <Link to="/register" className="transition hover:text-white">
                  Create an account{" "}
                  <ArrowUpRight size={13} className="ml-1 inline" />
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-3 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
            <p>
              © {new Date().getFullYear()} ContactX. Built for better
              connections.
            </p>

            <p className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Keep your network close.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
