"use client";

import { LogoIcon } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <section className="flex min-h-screen px-4 py-16 md:py-32 bg-transparent">
        <div className="bg-muted m-auto h-fit w-full max-w-sm overflow-hidden rounded-[calc(var(--radius)+.125rem)] border shadow-md p-8 text-center">
          <h1 className="text-xl font-semibold mb-4">Invalid Reset Link</h1>
          <p className="mb-6">The reset link is missing or invalid.</p>
          <Button asChild w-full>
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-screen px-4 py-16 md:py-32 bg-transparent">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          const formData = new FormData(e.currentTarget);
          const password = formData.get("password") as string;
          const confirmPassword = formData.get("confirmPassword") as string;

          if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            setLoading(false);
            return;
          }

          const { error } = await authClient.resetPassword({
            newPassword: password,
            token: token,
          });

          if (error) {
            toast.error(error.message || "Failed to reset password");
          } else {
            toast.success("Password reset successfully");
            router.push("/sign-in");
          }
          setLoading(false);
        }}
        className="bg-muted m-auto h-fit w-full max-w-sm overflow-hidden rounded-[calc(var(--radius)+.125rem)] border shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)]"
      >
        <div className="bg-card -m-px rounded-[calc(var(--radius)+.125rem)] border p-8 pb-6">
          <div className="text-center">
            <Link href="/" aria-label="go home" className="mx-auto block w-fit">
              <LogoIcon />
            </Link>
            <h1 className="mb-1 mt-4 text-xl font-semibold">Reset Password</h1>
            <p className="text-sm">Enter your new password below</p>
          </div>

          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" title="password">
                New Password
              </Label>
              <Input
                type="password"
                required
                name="password"
                id="password"
                placeholder="********"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" title="confirmPassword">
                Confirm Password
              </Label>
              <Input
                type="password"
                required
                name="confirmPassword"
                id="confirmPassword"
                placeholder="********"
              />
            </div>

            <Button className="w-full" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
