import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApi } from "../../context/ApiContext";
import { Input } from "../../components/ui/Input";
import {
  validateEmail,
  validatePassword,
} from "../../utils/validators";
import { TokenService } from "../../services/TokenService";
import { ApiError } from "../../types";

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, setAuthSession } = useAuth();
  const api = useApi();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const emailVal = validateEmail(email);
    if (!emailVal.isValid) {
      setError(emailVal.error || "Please enter a valid email address.");
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        setError("Current password is required to set a new password.");
        return;
      }
      const passVal = validatePassword(newPassword);
      if (!passVal.isValid) {
        setError(passVal.errors[0]);
        return;
      }
    }

    try {
      setLoading(true);
      const payload: {
        name: string;
        email: string;
        currentPassword?: string;
        newPassword?: string;
      } = {
        name,
        email,
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const response = await api.updateProfile(payload);

      const token = response.token || TokenService.getToken();
      if (token && response.user) {
        setAuthSession(token, response.user);
      }

      setSuccess("Profile updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      const error = err as ApiError;
      setError(
        error.response?.data?.message ||
          "Failed to update profile. Make sure your current password is correct.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <header className="sticky top-0 z-50 flex items-center border-b border-border bg-surface/90 px-6 py-4 backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 rounded-full p-2 hover:bg-surface-hover"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold">Account Details</h1>
      </header>

      <main className="mx-auto max-w-2xl p-6 md:p-10">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-border bg-surface p-8 shadow-sm"
        >
          <h2 className="mb-6 text-xl font-semibold">Edit Profile</h2>

          {error && (
            <div className="mb-6 flex items-center space-x-2 rounded-md bg-error/10 border border-error p-4 text-sm text-error font-medium">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center space-x-2 rounded-md bg-green-500/10 border border-green-500 p-4 text-sm text-green-500 font-medium">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-5">
            <Input
              id="name"
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />

            <Input
              id="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.replace(/\s/g, ""))}
              disabled={loading}
            />

            <div className="my-6 border-t border-border pt-6">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted">
                Change Password
              </h3>
              <div className="space-y-5">
                <Input
                  id="currentPassword"
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) =>
                    setCurrentPassword(e.target.value.replace(/\s/g, ""))
                  }
                  disabled={loading}
                  placeholder=" "
                />

                <Input
                  id="newPassword"
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value.replace(/\s/g, ""))
                  }
                  disabled={loading}
                  placeholder=" "
                />
                <p className="text-xs text-muted">
                  Leave new password blank if you do not wish to change it.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 rounded-md bg-primary px-6 py-3 font-bold text-white transition hover:bg-primary-hover disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              <span>{loading ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
