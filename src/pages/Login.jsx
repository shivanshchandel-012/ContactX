
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const message = location.state?.message;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    navigate("/dashboard");
  };

  return (
    <main className="register-page min-h-screen bg-white text-slate-900">
      <div className="register-background" />

      {/* Navbar */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-10">
        <Link
          to="/"
          className="text-2xl font-extrabold tracking-tight"
          aria-label="ContactX home"
        >
          Contact<span className="text-blue-600">X</span>
        </Link>

        <Link
          to="/register"
          className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >
          Don't have an account?{" "}
          <span className="text-blue-600">Sign up</span>
        </Link>
      </header>

      {/* Login content */}
      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-100px)] w-full max-w-7xl items-center gap-12 px-6 py-8 sm:px-10 lg:grid-cols-2 lg:gap-20 lg:py-12">
        {/* Left section */}
        <div className="mx-auto w-full max-w-xl">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Good to see
            <br />
            you <span className="register-gradient-text">again.</span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
            Sign in to keep your contacts organized and your
            important relationships moving forward.
          </p>

          <div className="mt-9 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-white text-blue-600 shadow-sm">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h3 className="font-bold text-slate-800">
                Your network, all in one place
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Pick up where you left off and stay on top of
                your connections.
              </p>
            </div>
          </div>
        </div>

        {/* Login card */}
        <div className="mx-auto w-full max-w-md">
          <div className="register-card rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-9">
            <div className="mb-7">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <LockKeyhole size={23} />
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sign in to access your account.
              </p>
            </div>

            {message && (
              <div
                role="status"
                className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700"
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <div className="register-input-wrap">
                  <Mail size={18} className="shrink-0 text-slate-400" />

                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    required
                    className="register-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="login-password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="register-input-wrap">
                  <LockKeyhole
                    size={18}
                    className="shrink-0 text-slate-400"
                  />

                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
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
              </div>

              {/* Validation feedback */}
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
                className="register-submit group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Sign in
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">
                NEW TO CONTACTX?
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <p className="text-center text-sm text-slate-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-blue-600 hover:text-blue-700"
              >
                Create account
              </Link>
            </p>
          </div>

          {/* Copyright */}
          <p className="mt-5 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} ContactX. Built for better connections.
          </p>
        </div>
      </section>
    </main>
  );
}
