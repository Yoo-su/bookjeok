"use client";

import { LoginForm } from "@/features/auth/components/forms/login-form";

export const LoginView = () => {
  return (
    <div
      className="flex items-center justify-center min-h-dvh bg-gray-50"
      data-clarity-mask="true"
    >
      <LoginForm />
    </div>
  );
};
