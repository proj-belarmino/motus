import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useApi } from "../../context/ApiContext";
import { validateEmail } from "../../utils/validators";
import { Input } from "../../components/ui/Input";
import { ApiError } from "../../types";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setAuthSession } = useAuth();
  const api = useApi();
  const navigate = useNavigate();

  const emailValidation = validateEmail(email);
  const isPasswordInvalid = password.length === 0 || /\s/.test(password);

  // Automatically strip spaces on change instead of blocking keydown events
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value.replace(/\s/g, ""));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value.replace(/\s/g, ""));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setGlobalError("");

    if (!emailValidation.isValid || isPasswordInvalid) return;

    try {
      setLoading(true);
      const { token, user } = await api.login({
        email,
        password,
      });

      setAuthSession(token, user);
      navigate("/");
    } catch (error) {
      const err = error as ApiError;
      if (err.response?.status === 401 || err.response?.status === 403) {
        setGlobalError(
          "Sorry, we can't find an account with this email address or the password is incorrect.",
        );
      } else {
        setGlobalError(
          "An unexpected server error occurred. Please try again later.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background md:items-center md:justify-center md:bg-transparent transition-colors">
      <div className="absolute inset-0 z-[-1] hidden bg-[url('https://assets.nflxext.com/ffe/siteui/vlv3/a73c4363-1dcd-4719-b3b1-3725418fd91d/fe1147dd-78be-44aa-a0e5-2d2994305a13/BR-en-20231016-popsignuptwoweeks-perspective_alpha_website_large.jpg')] bg-cover opacity-30 md:block" />
      <div className="absolute inset-0 z-[-1] hidden bg-gradient-to-t from-background via-background/80 to-background/30 md:block" />

      <header className="absolute left-0 top-0 w-full p-6">
        <h1 className="text-4xl font-bold tracking-tighter text-primary md:text-5xl drop-shadow-md">
          NycoFlix
        </h1>
      </header>

      <div className="z-10 mt-20 w-full max-w-[450px] rounded-xl border border-border bg-surface/95 px-10 py-16 text-foreground shadow-2xl backdrop-blur-md sm:px-16 md:mt-0 transition-colors">
        <h2 className="mb-8 text-3xl font-bold">Sign In</h2>

        {globalError && (
          <div className="mb-6 rounded-md bg-error/10 border border-error p-4 text-sm text-error font-medium">
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            id="email"
            label="Email address"
            type="email"
            value={email}
            onChange={handleEmailChange}
            onBlur={() => setTouched({ ...touched, email: true })}
            error={emailValidation.error}
            touched={touched.email}
            disabled={loading}
            autoComplete="email"
          />

          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            onBlur={() => setTouched({ ...touched, password: true })}
            error={isPasswordInvalid ? "Password is required." : undefined}
            touched={touched.password}
            disabled={loading}
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-md bg-primary py-3.5 text-base font-bold text-white shadow transition hover:bg-primary-hover disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="mt-12 text-base text-muted">
          New to NycoFlix?{" "}
          <Link
            to="/register"
            className="font-semibold text-foreground hover:underline"
          >
            Sign up now.
          </Link>
        </div>
      </div>
    </div>
  );
}
