import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { Badge } from '@/components/ui/badge';
import { getSessionWithCache } from '@/lib/session-cache';

export const Route = createFileRoute('/_onboarding')({
  component: OnboardingLayout,
  beforeLoad: async () => {
    const session = await getSessionWithCache();
    if (!session) {
      throw redirect({ to: '/login' });
    }
    return { session };
  },
});

function OnboardingLayout() {
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
                Mulai Kelola Bisnis
                <br />
                Lebih Cerdas Hari Ini
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

      {/* Right Panel - Content */}
      <div className="flex flex-col w-full h-full px-6 md:w-7/12 lg:w-1/2 font-sans">
        <div className="flex-1 flex flex-col justify-center w-full max-w-[500px] lg:max-w-[700px] mx-auto rounded-2xl bg-white p-5 px-10 shadow-sm overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
