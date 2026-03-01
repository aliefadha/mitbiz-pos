import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { Eye, EyeOff, Loader2, Mail } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegister } from '../hooks/use-auth';
import { authClient } from '../lib/auth-client';

export const Route = createFileRoute('/register')({
  component: RegisterPage,
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (session) {
      throw redirect({ to: '/dashboard' });
    }
  },
});

function RegisterPage() {
  const registerMutation = useRegister();
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }

    try {
      await registerMutation.mutate({ name, email, password });
      setSuccessOpen(true);
    } catch (err: any) {
      if (err?.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL') {
        setError('Email sudah terdaftar');
      } else {
        setError(err?.message || 'Gagal mendaftar. Silakan coba lagi.');
      }
    }
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-linear-to-br from-[#0a1e5c] via-[#0d2a6e] to-[#1a4fa0] py-6 lg:py-10">
      {/* Left Panel - Branding */}
      <div className="relative hidden md:flex md:flex-col flex-1 h-full md:w-5/12 lg:w-1/2 ">
        <div className="relative z-10 flex flex-col h-full px-6 lg:px-10">
          {/* Logo - at the top */}
          <div>
            <img src="/images/logo-login.png" className="w-28 lg:w-40 h-auto" />
          </div>

          {/* Hero Text & Badges - vertically centered in remaining space */}
          <div className="flex-1 flex items-center">
            <div>
              <h1 className="mb-4 lg:mb-6 text-[1.25rem] lg:text-[2.5rem] leading-[1.15] font-bold tracking-tight text-white font-sans">
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
        </div>

        <div className="pointer-events-none absolute -bottom-10 -left-8 z-0 h-[300px] w-[300px] lg:h-[450px] lg:w-[450px]">
          <img src="/images/login.png" className="h-full w-full object-cover" />
        </div>

        {/* Subtle background glow effects */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 h-[400px] w-[400px] rounded-full bg-blue-300/8 blur-[100px]" />
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex flex-col w-full h-full px-6 md:w-7/12 lg:w-1/2 font-sans">
        <div className="flex-1 flex flex-col justify-center w-full max-w-[500px] lg:max-w-[700px] mx-auto rounded-2xl bg-white p-5 px-10 lg:p-24 shadow-sm overflow-y-auto">
          <div className="mb-5 lg:mb-8">
            <h2 className="text-lg md:text-xl lg:text-xl font-bold tracking-tight text-gray-900">
              Daftar ke Mitbiz POS
            </h2>
            <p className="mt-1.5 lg:mt-2 text-xs lg:text-sm leading-relaxed text-gray-500">
              Buat akun baru untuk mulai mengelola
              <br />
              bisnis Anda dengan mudah.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-3 lg:space-y-5 overflow-y-scroll">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Nama Lengkap
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Masukkan nama lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-9 lg:h-11 rounded-lg border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Masukkan email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-9 lg:h-11 rounded-lg border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Buat password (min. 8 karakter)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-9 lg:h-11 rounded-lg border-gray-200 bg-white px-4 pr-10 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Konfirmasi Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Ulangi password Anda"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-9 lg:h-11 rounded-lg border-gray-200 bg-white px-4 pr-10 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="h-10 lg:h-12 w-full rounded-full bg-blue-600 text-sm lg:text-base font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.98]"
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mendaftar...
                </>
              ) : (
                'Daftar'
              )}
            </Button>

            <p className="pt-2 text-center text-sm text-gray-500">
              Sudah punya akun?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          </form>

          <Dialog
            open={successOpen}
            onOpenChange={(open) => {
              setSuccessOpen(open);
              if (!open) {
                window.location.href = '/login';
              }
            }}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">Registrasi Berhasil!</DialogTitle>
              </DialogHeader>
              <div className=" flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <p className="text-center text-sm text-gray-500">
                Silakan cek email Anda untuk klik tautan verifikasi akun.
              </p>
              <div className="mt-4">
                <Button onClick={() => setSuccessOpen(false)} className="w-full">
                  OK
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
