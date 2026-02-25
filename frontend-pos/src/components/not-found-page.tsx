import { Link } from "@tanstack/react-router";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-linear-to-br from-[#0a1e5c] via-[#0d2a6e] to-[#1a4fa0] px-6 font-sans">
      {/* Background Image */}
      <div className="pointer-events-none absolute -bottom-8 -left-8 z-0 h-[450px] w-[450px]">
        <img src="/images/login.png" className="h-full w-full object-cover" />
      </div>

      {/* Background glow effects */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 h-[400px] w-[400px] rounded-full bg-blue-300/8 blur-[100px]" />

      {/* Center Panel - Not Found Display */}
      <div className="z-10 w-full max-w-md rounded-md bg-white p-10 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">
            <span className="text-4xl font-bold">404</span>
          </div>

          <h2 className="mb-10 text-xl font-bold tracking-tight text-gray-900">
            Halaman Tidak Ditemukan
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="h-12 rounded-md border-gray-200 px-8 text-base font-semibold text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
            <Link to="/">
              <Button className="h-12 rounded-md bg-blue-600 px-8 text-base font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg">
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
