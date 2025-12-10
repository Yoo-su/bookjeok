"use client";

import { LoginForm } from "@/features/auth/components/login-form";

export const LoginView = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <LoginForm />
    </div>
  );
};
