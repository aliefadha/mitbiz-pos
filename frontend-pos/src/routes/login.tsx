import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '../hooks/use-auth';
import { authClient } from '../lib/auth-client';

export const Route = createFileRoute('/login')({
  component: LoginPage,
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (session) {
      throw redirect({ to: '/dashboard' });
    }
  },
});

function LoginPage() {
  const loginMutation = useLogin();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await loginMutation.mutate({ email, password });
    } catch (err: any) {
      const message = err?.message || '';
      if (message === 'Invalid email or password') {
        setError('Email atau password salah');
      } else if (message === 'Email not verified') {
        setError('Email belum diverifikasi');
      } else {
        setError(message || 'Terjadi kesalahan saat login');
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

      {/* Right Panel - Login Form */}
      <div className="flex flex-col w-full h-full px-6 md:w-7/12 lg:w-1/2 font-sans">
        <div className="flex-1 flex flex-col justify-center w-full max-w-[480px] lg:max-w-[700px] mx-auto rounded-2xl bg-white p-5 px-10 lg:p-24 shadow-sm">
          <div className="mb-5 lg:mb-8">
            <h2 className="text-lg md:text-xl lg:text-xl font-bold tracking-tight text-gray-900">
              Masuk ke Mitbiz POS
            </h2>
            <p className="mt-1.5 lg:mt-2 text-xs lg:text-sm leading-relaxed text-gray-500">
              Kelola transaksi, stok, dan laporan dalam satu
              <br />
              sistem terintegrasi.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-3 lg:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Input your email"
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
                  placeholder="Input your store password"
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
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="mt-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                >
                  Lupa password?
                </Link>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="h-10 lg:h-12 w-full rounded-full bg-blue-600 text-sm lg:text-base font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.98]"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Next'
              )}
            </Button>

            <p className="pt-2 text-center text-sm text-gray-500">
              Belum punya akun?{' '}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Daftar di sini
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
