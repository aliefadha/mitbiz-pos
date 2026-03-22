import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { OnboardingStepper } from '@/components/onboarding/onboarding-stepper';
import { Button } from '@/components/ui/button';

function OnboardingSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center text-center space-y-0">
      {/* Stepper - all completed */}
      <OnboardingStepper currentStep={4} />

      {/* Success Icon */}
      <div className="flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-green-100 mt-2 mb-5 lg:mb-6">
        <Check className="w-10 h-10 lg:w-12 lg:h-12 text-green-500 stroke-[2.5]" />
      </div>

      {/* Title */}
      <h2 className="text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-gray-900">
        Akun Berhasil Dibuat! 🎉
      </h2>

      {/* Subtitle */}
      <p className="mt-2 text-xs lg:text-sm leading-relaxed text-gray-500 max-w-xs lg:max-w-sm">
        Selamat datang di Mitbiz POS. Bisnis Anda sudah siap untuk dikelola. Cek email untuk
        verifikasi akun.
      </p>

      {/* CTA Button */}
      <div className="w-full pt-8 lg:pt-10">
        <Button
          onClick={() => navigate({ to: '/' })}
          className="h-10 lg:h-12 w-full rounded-full bg-blue-600 text-sm lg:text-base font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.98]"
        >
          Mulai Mitbiz POS
        </Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/_onboarding/onboarding/success')({
  component: OnboardingSuccessPage,
});
