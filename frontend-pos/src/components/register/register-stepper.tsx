import { Check } from 'lucide-react';

const STEPS = [
  { label: 'Akun', step: 1 },
  { label: 'Bisnis', step: 2 },
  { label: 'Outlet', step: 3 },
] as const;

export function RegisterStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-6 lg:mb-8">
      {STEPS.map((s, index) => (
        <div key={s.step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`
                flex items-center justify-center w-8 h-8 lg:w-9 lg:h-9 rounded-full border-2 text-xs lg:text-sm font-semibold transition-all
                ${
                  s.step < currentStep
                    ? 'border-green-500 bg-green-500 text-white'
                    : s.step === currentStep
                      ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'border-gray-300 bg-white text-gray-400'
                }
              `}
            >
              {s.step < currentStep ? <Check className="w-4 h-4" /> : s.step}
            </div>
            <span
              className={`mt-1.5 text-[10px] lg:text-xs font-medium ${
                s.step < currentStep
                  ? 'text-green-600'
                  : s.step === currentStep
                    ? 'text-blue-600'
                    : 'text-gray-400'
              }`}
            >
              {s.label}
            </span>
          </div>

          {index < STEPS.length - 1 && (
            <div
              className={`w-14 lg:w-20 h-[2px] mx-1 -mt-4 ${
                s.step < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
