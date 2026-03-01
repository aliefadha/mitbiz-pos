import { Link } from '@tanstack/react-router';
import { ArrowLeft, Home, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ForbiddenPageProps {
  resource?: string;
}

export function ForbiddenPage({ resource }: ForbiddenPageProps) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      {/* Dialog card */}
      <div className="relative w-full max-w-md mx-4 rounded-xl bg-white p-8 shadow-2xl border border-gray-100">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 ring-4 ring-orange-50">
            <ShieldAlert className="h-8 w-8 text-orange-600" />
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
            <Link to="/dashboard" className="w-full">
              <Button className="w-full h-11 rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Dashboard
              </Button>
            </Link>

            <Link to="/" className="w-full">
              <Button
                variant="outline"
                className="w-full h-11 rounded-lg border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Home className="mr-2 h-4 w-4" />
                Beranda
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
