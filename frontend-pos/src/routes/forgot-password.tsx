import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useForgotPassword } from "../hooks/use-auth";
import { authClient } from "../lib/auth-client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (session) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

function ForgotPasswordPage() {
  const forgotPasswordMutation = useForgotPassword();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      await forgotPasswordMutation.mutate({ email });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Gagal mengirim email reset password.");
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-linear-to-br from-[#0a1e5c] via-[#0d2a6e] to-[#1a4fa0] ">
      {/* Left Panel - Branding */}
      <div className="relative hidden md:flex md:flex-col md:w-5/12 lg:w-1/2 pt-10">
        {/* Logo */}
        <div className="relative z-10 p-10">
          <img src="/images/logo-login.png" className="w-40 h-auto" />
        </div>

        {/* Hero Text & Badges - vertically centered */}
        <div className="flex flex-col justify-center px-10 mt-40">
          <div className="relative z-10">
            <h1 className="mb-6 text-[1.5rem] lg:text-[2.5rem] leading-[1.15] font-bold tracking-tight text-white font-sans">
              Sistem Kasir Multi Cabang
              <br />
              yang Lebih Terkontrol
            </h1>
            <div className="flex flex-wrap gap-2 md:gap-3 font-sans">
              <Badge
                variant="outline"
                className="rounded-full border-[#0C73E0] px-3 md:px-4 py-1 md:py-1.5 text-xs lg:text-sm font-medium text-white backdrop-blur-sm"
              >
                Transaksi Real-time
              </Badge>
              <Badge
                variant="outline"
                className="rounded-full border-[#0C73E0] px-3 md:px-4 py-1 md:py-1.5 text-xs lg:text-sm font-medium text-white backdrop-blur-sm"
              >
                Manajemen Stok Otomatis
              </Badge>
              <Badge
                variant="outline"
                className="rounded-full border-[#0C73E0] px-3 md:px-4 py-1 md:py-1.5 text-xs lg:text-sm font-medium text-white backdrop-blur-sm"
              >
                Laporan Per Cabang
              </Badge>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute -bottom-8 -left-8 z-0 h-[450px] w-[450px]">
          <img src="/images/login.png" className="h-full w-full object-cover" />
        </div>

        {/* Subtle background glow effects */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 h-[400px] w-[400px] rounded-full bg-blue-300/8 blur-[100px]" />
      </div>

      {/* Right Panel - Forgot Password Form */}
      <div className="flex w-full items-center justify-center px-6 md:w-7/12 lg:w-1/2 font-sans">
        <div className="w-full max-w-[700px] rounded-2xl bg-white p-10 lg:p-24 shadow-sm">
          {!success ? (
            <>
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl lg:text-xl font-bold tracking-tight text-gray-900">
                  Lupa Password
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  Masukkan email yang terdaftar, kami akan
                  <br />
                  mengirimkan link untuk reset password.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Masukkan email Anda"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 rounded-lg border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500"
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={forgotPasswordMutation.isPending}
                  className="h-12 w-full rounded-full bg-blue-600 text-base font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.98]"
                >
                  {forgotPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    "Kirim Link Reset"
                  )}
                </Button>

                <p className="pt-2 text-center text-sm text-gray-500">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Kembali ke halaman login
                  </Link>
                </p>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl md:text-2xl lg:text-xl font-bold tracking-tight text-gray-900">
                Cek Email Anda
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                Kami telah mengirimkan link reset password ke
                <br />
                <span className="font-semibold text-gray-700">{email}</span>
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Tidak menerima email? Cek folder spam atau coba lagi.
              </p>

              <div className="mt-8 space-y-3">
                <Button
                  type="button"
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                  }}
                  variant="outline"
                  className="h-12 w-full rounded-full border-gray-200 text-base font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98]"
                >
                  Coba Email Lain
                </Button>

                <p className="pt-2 text-center text-sm text-gray-500">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Kembali ke halaman login
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
