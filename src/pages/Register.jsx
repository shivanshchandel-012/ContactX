
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  UserRound,
  CheckCircle2,
  Users,
  ShieldCheck,
} from "lucide-react";
import { authService } from "../services/authService";

const Register = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await authService.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      navigate("/login", {
        state: {
          message: "Account created successfully! Please sign in with your credentials.",
          registeredEmail: formData.email.trim(),
        },
      });

    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  const passwordChecks = [
    {
      label: "At least 8 characters",
      valid: formData.password.length >= 8,
    },
    {
      label: "Contains a number",
      valid: /\d/.test(formData.password),
    },
  ];

  return (
    <main className="register-page min-h-screen bg-white text-slate-900">
      <div className="register-background" />

      {/* Navbar */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-2xl font-extrabold tracking-tight"
          aria-label="ContactX home"
        >
          Contact<span className="text-blue-600">X</span>
        </Link>

        <Link
          to="/login"
          className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >
          Already have an account?{" "}
          <span className="text-blue-600">Log in</span>
        </Link>
      </header>

      {/* Main content */}
      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-100px)] w-full max-w-7xl items-center gap-12 px-6 py-8 sm:px-10 lg:grid-cols-2 lg:gap-20 lg:py-12">
        {/* Left side */}
        <div className="mx-auto w-full max-w-xl lg:mx-0">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>

          {/* <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700">
            <Zap size={14} />
            YOUR NETWORK, ORGANIZED
          </div> */}

          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Make every
            <br />
            connection
            <br />
            <span className="register-gradient-text">count.</span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
            Create your ContactX account and bring your contacts,
            relationships, and follow-ups together in one organized place.
          </p>

          <div className="mt-9 space-y-5">
            {[
              {
                icon: Users,
                title: "All your contacts in one place",
                description:
                  "Keep names, companies, notes, and tags organized.",
              },
              {
                icon: CheckCircle2,
                title: "Never miss a follow-up",
                description:
                  "Keep track of important conversations and next steps.",
              },
              {
                icon: ShieldCheck,
                title: "Your workspace, your control",
                description:
                  "Build a more organized way to manage your network.",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-white text-blue-600 shadow-sm">
                    <Icon size={20} />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex items-center gap-3 border-t border-slate-200 pt-6">
            <div className="flex -space-x-2">
              {["S", "A", "R", "K"].map((letter, index) => (
                <div
                  key={letter}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-bold ${
                    [
                      "bg-blue-100 text-blue-700",
                      "bg-violet-100 text-violet-700",
                      "bg-emerald-100 text-emerald-700",
                      "bg-amber-100 text-amber-700",
                    ][index]
                  }`}
                >
                  {letter}
                </div>
              ))}
            </div>

            <p className="text-sm text-slate-500">
              A smarter way to manage your network.
            </p>
          </div>
        </div>

        {/* Registration card */}
        <div className="mx-auto w-full max-w-md">
          <div className="register-card rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-9">
            <div className="mb-7">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <UserRound size={23} />
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Create your account
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Get started with ContactX in just a few steps.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Full name
                </label>

                <div className="register-input-wrap">
                  <UserRound size={18} className="text-slate-400" />

                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="register-input"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <div className="register-input-wrap">
                  <Mail size={18} className="text-slate-400" />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="register-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="register-input-wrap">
                  <LockKeyhole size={18} className="text-slate-400" />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={8}
                    required
                    className="register-input"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-slate-400 transition hover:text-slate-700"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  {passwordChecks.map((check) => (
                    <span
                      key={check.label}
                      className={`inline-flex items-center gap-1.5 text-xs ${
                        check.valid ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      <CheckCircle2 size={14} />
                      {check.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Confirm password
                </label>

                <div className="register-input-wrap">
                  <LockKeyhole size={18} className="text-slate-400" />

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="register-input"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((prev) => !prev)
                    }
                    className="text-slate-400 transition hover:text-slate-700"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="register-submit group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create account"}
                {!loading && (
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                )}
              </button>

              <p className="text-center text-xs leading-5 text-slate-500">
                By creating an account, you agree to our{" "}
                <Link
                  to="/terms"
                  className="font-semibold text-slate-700 hover:text-blue-600"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="font-semibold text-slate-700 hover:text-blue-600"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">OR</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <p className="text-center text-sm text-slate-600">
              Already registered?{" "}
              <Link
                to="/login"
                className="font-bold text-blue-600 hover:text-blue-700"
              >
                Log in
              </Link>
            </p>
          </div>

          <p className="mt-5 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} ContactX. Built for better connections.
          </p>
        </div>
      </section>
    </main>
  );
};

export default Register;
