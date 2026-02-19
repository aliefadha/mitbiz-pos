import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/verify-email")({
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-linear-to-br from-[#0a1e5c] via-[#0d2a6e] to-[#1a4fa0]">
      <div className="pointer-events-none absolute -bottom-8 -left-8 z-0 h-[450px] w-[450px]">
        <img src="/images/login.png" className="h-full w-full object-cover" />
      </div>

      {/* Subtle background glow effects */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 h-[400px] w-[400px] rounded-full bg-blue-300/8 blur-[100px]" />
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-sm text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-2">
          Email Terverifikasi!
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Email Anda telah berhasil diverifikasi. Silakan masuk untuk mulai
          menggunakan Mitbiz POS.
        </p>
        <Button
          asChild
          className="h-12 w-full rounded-full bg-blue-600 text-base font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.98]"
        >
          <Link to="/login">Masuk ke Akun</Link>
        </Button>
      </div>
    </div>
  );
}
