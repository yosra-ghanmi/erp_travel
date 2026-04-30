import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Input, Panel } from "../components/ui";
import { requestPasswordReset, resetPassword } from "../services/erpApi";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [secretWord, setSecretWord] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [requested, setRequested] = useState(false);
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const requestSecretWord = async (event) => {
    event.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);
    setInfo(null);
    setSent(false);

    try {
      const response = await requestPasswordReset({ email });
      setRequested(true);
      setInfo(
        response.message ||
          "If the email exists, a secret word has been sent. Paste it below to reset your password."
      );
    } catch (err) {
      console.error("Request reset password failed:", err);
      setError(
        err.response?.data?.detail ||
          "Failed to send the secret word. Please verify the email address and SMTP configuration."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const submitReset = async (event) => {
    event.preventDefault();
    if (!email || !secretWord || !newPassword) return;

    setIsLoading(true);
    setError(null);
    setInfo(null);

    try {
      await resetPassword({
        email,
        secret_word: secretWord,
        new_password: newPassword,
      });
      setSent(true);
      setSecretWord("");
      setNewPassword("");
      setInfo(
        "Password reset successful. You can now log in with your new password."
      );
    } catch (err) {
      console.error("Reset password failed:", err);
      setError(
        err.response?.data?.detail ||
          "Failed to reset password. Please verify the secret word and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <Panel title="Password Recovery">
          <p className="mb-4 text-sm text-slate-500">
            Request a secret word by email, then paste it here with your new
            password to reset your account access.
          </p>
          <form className="space-y-3" onSubmit={requestSecretWord}>
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading
                ? "Sending..."
                : requested
                ? "Resend Secret Word"
                : "Send Secret Word"}
            </Button>
          </form>

          {requested ? (
            <form className="mt-4 space-y-3" onSubmit={submitReset}>
              <Input
                type="text"
                placeholder="Paste secret word"
                value={secretWord}
                onChange={(event) => setSecretWord(event.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                minLength={6}
              />
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          ) : null}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {info && (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {info}
            </p>
          )}
          {sent && (
            <div className="mt-3 rounded-md bg-emerald-50 p-3 dark:bg-emerald-900/20">
              <p className="text-sm text-emerald-600">
                Password has been reset successfully. You can now log in with
                your new password.
              </p>
            </div>
          )}

          <p className="mt-4 text-sm">
            <Link to="/login" className="text-brand-600">
              Back to login
            </Link>
          </p>
        </Panel>
      </div>
    </div>
  );
}
