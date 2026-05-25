"use client";

import { useState } from "react";
import HomePanel from "@/components/HomePanel";
import SignUpForm from "@/components/SignUpForm";

export default function AccountsPageContent() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="h-11 rounded-md bg-[#0a2a66] px-5 text-sm font-bold text-white transition-colors hover:bg-[#061a40]"
        >
          Add Account
        </button>
      </div>

      <HomePanel
        title="Accounts"
        description="Manage user accounts created directly by User Admins or invited through email."
      />

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07183b]/40 p-4">
          <div className="relative w-full max-w-md">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="absolute -right-2 -top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold text-[#07183b] shadow"
              aria-label="Close sign up form"
            >
              x
            </button>
            <SignUpForm onSuccess={() => setIsFormOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
