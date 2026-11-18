"use client";

import { useEffect, useState } from "react";

type SessionUser = { name?: string | null; email?: string | null; role?: string };

/**
 * Logins are a cookie shared by every tab of this site, so signing in as someone else
 * in another tab silently switches this tab too. When the tab regains focus, compare the
 * live session with the user this page was rendered for and block the page if it changed.
 */
export function SessionWatcher({ email }: { email?: string }) {
  const [changed, setChanged] = useState<null | { user: SessionUser | null }>(null);

  useEffect(() => {
    if (!email) return;
    let checking = false;

    async function check() {
      if (checking || document.visibilityState !== "visible") return;
      checking = true;
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { user?: SessionUser };
        const current = data?.user?.email ?? null;
        if (current?.toLowerCase() !== email!.toLowerCase()) {
          setChanged({ user: data?.user ?? null });
        }
      } catch {
        // offline / dev server restarting — try again on next focus
      } finally {
        checking = false;
      }
    }

    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [email]);

  if (!changed) return null;

  const who = changed.user?.email
    ? `${changed.user.name ?? changed.user.email}${
        changed.user.role ? ` (${changed.user.role === "MANAGEMENT" ? "Management" : "Video team"})` : ""
      }`
    : null;

  return (
    <div className="session-overlay" role="alertdialog" aria-modal="true" aria-labelledby="session-changed-title">
      <div className="session-dialog">
        <h2 id="session-changed-title">
          {who ? "You switched accounts in another tab" : "You were signed out"}
        </h2>
        <p>
          {who
            ? `This browser is now signed in as ${who}. This tab still shows the previous account, so reload before doing anything here.`
            : "Your session ended in another tab. Sign in again to continue."}
        </p>
        <p className="session-hint">
          To use two accounts side by side, open the second one in a private/incognito window or a different browser profile.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => window.location.assign(who ? "/" : "/login")}
        >
          {who ? "Continue as this account" : "Go to sign in"}
        </button>
      </div>
    </div>
  );
}
