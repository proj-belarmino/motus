import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useApi } from "../../context/ApiContext";
import {
  validateEmail,
  validatePassword,
  sanitizeInput,
} from "../../utils/validators";
import { Input } from "../../components/ui/Input";
import { Check, X } from "lucide-react";
import { ApiError } from "../../types";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const api = useApi();
  const navigate = useNavigate();

  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value.replace(/\s/g, ""));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value.replace(/\s/g, ""));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setServerError("");

    if (!emailValidation.isValid || !passwordValidation.isValid) return;

    try {
      setLoading(true);
      await api.register({
        email: sanitizeInput(email),
        password: sanitizeInput(password),
      });
      navigate("/login");
    } catch (error) {
      const err = error as ApiError;
      if (err.response?.status === 409) {
        setServerError("An account with this email address already exists.");
      } else {
        setServerError(
          "Registration failed due to a server error. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground transition-colors">
      <header className="flex h-24 items-center justify-between border-b border-border bg-surface px-8 shadow-sm">
        <h1 className="text-4xl font-bold tracking-tighter text-primary drop-shadow-sm">
          NycoFlix
        </h1>
        <Link
          to="/login"
          className="text-lg font-bold hover:text-primary transition-colors"
        >
          Sign In
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[440px] flex-grow flex-col justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-wider text-muted">
            Step 1 of 1
          </p>
          <h2 className="text-3xl font-extrabold text-foreground">
            Create a password to start your membership
          </h2>
          <p className="mt-4 text-lg text-muted">
            Just a few more steps and you're done! We hate paperwork, too.
          </p>
        </div>

        {serverError && (
          <div className="mb-6 rounded-md bg-error/10 border border-error p-4 text-sm text-error font-medium text-center">
            {serverError}
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
            label="Add a password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            onBlur={() => setTouched({ ...touched, password: true })}
            touched={touched.password}
            disabled={loading}
            autoComplete="new-password"
          />

          {touched.password && (
            <div className="mt-2 rounded-lg border border-border bg-surface-hover p-4 shadow-sm">
              <p className="mb-3 text-sm font-bold">Password requirements:</p>
              <ul className="flex flex-col space-y-2 text-sm font-medium">
                <ValidationItem
                  isValid={!/\s/.test(password) && password.length > 0}
                  text="No spaces allowed"
                />
                <ValidationItem
                  isValid={password.length >= 8}
                  text="At least 8 characters"
                />
                <ValidationItem
                  isValid={/[A-Z]/.test(password)}
                  text="One uppercase letter"
                />
                <ValidationItem
                  isValid={/[a-z]/.test(password)}
                  text="One lowercase letter"
                />
                <ValidationItem
                  isValid={/[0-9]/.test(password)}
                  text="One number"
                />
                <ValidationItem
                  isValid={/[!@#$%^&*(),.?":{}|<>]/.test(password)}
                  text="One special character"
                />
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-md bg-primary py-4 text-xl font-bold text-white shadow-md transition hover:bg-primary-hover disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Processing..." : "Next"}
          </button>
        </form>
      </main>
    </div>
  );
}

const ValidationItem = ({
  isValid,
  text,
}: {
  isValid: boolean;
  text: string;
}) => (
  <li
    className={`flex items-center space-x-3 transition-colors ${isValid ? "text-green-500" : "text-muted"}`}
  >
    {isValid ? (
      <Check className="h-4 w-4 flex-shrink-0" />
    ) : (
      <X className="h-4 w-4 flex-shrink-0 text-error" />
    )}
    <span>{text}</span>
  </li>
);
