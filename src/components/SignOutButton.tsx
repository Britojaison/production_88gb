"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="btn btn-secondary !px-2.5 !py-1.5 text-xs"
    >
      Sign out
    </button>
  );
}
