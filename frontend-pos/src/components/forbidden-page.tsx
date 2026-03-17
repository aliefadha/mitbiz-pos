import { Link } from '@tanstack/react-router';
import { Home, LogOut, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useLogout } from '@/hooks/use-auth';
import { Card, CardContent } from './ui/card';

interface ForbiddenPageProps {
  resource?: string;
}

export function ForbiddenPage({ resource }: ForbiddenPageProps) {
  const { user } = useAuth();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-linear-to-br from-[#0a1e5c] via-[#0d2a6e] to-[#1a4fa0] px-6 font-sans">
      {/* Background Image */}
      <div className="pointer-events-none absolute -bottom-8 -left-8 z-0 h-[450px] w-[450px]">
        <img src="/images/login.png" className="h-full w-full object-cover" />
      </div>

      {/* Background glow effects */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 h-[400px] w-[400px] rounded-full bg-blue-300/8 blur-[100px]" />

      {/* Center Panel */}
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
            <ShieldAlert className="h-10 w-10 text-orange-600" />
          </div>

          {/* Title */}
          <h2 className="mb-2 text-xl font-bold tracking-tight text-gray-900">Akses Ditolak</h2>

          {/* Description */}
          <p className="mb-6 text-gray-600 text-sm leading-relaxed">
            Anda tidak memiliki izin untuk mengakses{' '}
            {resource ? (
              <span className="font-medium text-gray-800">halaman {resource}</span>
            ) : (
              'halaman ini'
            )}
            . Silakan hubungi administrator untuk mendapatkan akses.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col w-full gap-2">
            <Link to={user?.roleScope === 'global' ? '/admin' : '/dashboard'} className="w-full">
              <Button className="h-11 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg">
                <Home className="mr-2 h-4 w-4" />
                Beranda
              </Button>
            </Link>
            <Button
              onClick={handleLogout}
              className="h-11 w-full rounded-lg bg-transparent border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
