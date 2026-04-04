import { useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { paymentsApi } from '@/lib/api/payments';

interface SubscriptionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: {
    id: string;
    name: string;
    price: string;
    cycle: string;
  };
}

function formatCurrency(amount: string | number): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(numAmount)
    .replace('IDR', 'Rp');
}

function formatBillingCycle(cycle: string): string {
  switch (cycle) {
    case 'monthly':
      return 'Monthly';
    case 'quarterly':
      return 'Quarterly';
    case 'yearly':
      return 'Yearly';
    default:
      return cycle;
  }
}

declare global {
  interface Window {
    snap: any;
  }
}

export function SubscriptionConfirmDialog({
  open,
  onOpenChange,
  plan,
}: SubscriptionConfirmDialogProps) {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSnapLoaded, setIsSnapLoaded] = useState(false);

  useEffect(() => {
    if (!open) return;

    const loadSnap = () => {
      const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;

      if (window.snap) {
        setIsSnapLoaded(true);
        return;
      }

      if (!clientKey) {
        toast.error('Payment system not configured. Please set VITE_MIDTRANS_CLIENT_KEY.');
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', clientKey);

      script.onload = () => {
        setIsSnapLoaded(true);
      };
      script.onerror = () => {
        toast.error('Failed to load payment system');
      };

      document.head.appendChild(script);
    };

    loadSnap();
  }, [open]);

  const handleConfirm = async () => {
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;

    if (!clientKey) {
      toast.error('Payment system not configured');
      return;
    }

    if (!window.snap) {
      toast.error('Payment system is not available. Please refresh the page.');
      return;
    }

    setIsProcessing(true);

    onOpenChange(false);

    try {
      const { snapToken } = await paymentsApi.createSnapToken(plan.id);

      await new Promise((resolve) => setTimeout(resolve, 100));

      window.snap.pay(snapToken, {
        onSuccess: (_result: any) => {
          toast.success('Payment successful! Your subscription is now active.');
          navigate({ to: '/cash-shifts' });
        },
        onPending: (_result: any) => {
          toast.info('Payment is pending. You will be notified when it is confirmed.');
        },
        onError: (_result: any) => {
          toast.error('Payment failed. Please try again.');
          setIsProcessing(false);
        },
        onClose: () => {
          toast.info('Payment dialog closed. You can try again later.');
          setIsProcessing(false);
        },
      });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to initialize payment. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Subscription</DialogTitle>
          <DialogDescription>You are about to subscribe to the following plan</DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-muted rounded-lg">
          <p className="font-semibold text-lg">{plan.name}</p>
          <p className="text-sm text-muted-foreground">{formatBillingCycle(plan.cycle)}</p>
          <p className="text-2xl font-bold mt-2">
            {formatCurrency(Number(plan.price))}
            <span className="text-sm font-normal text-muted-foreground">
              /{plan.cycle === 'monthly' ? 'mo' : plan.cycle === 'quarterly' ? 'qtr' : 'yr'}
            </span>
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <p className="text-blue-800">
            You will be redirected to Midtrans payment gateway to complete your subscription.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isProcessing || !isSnapLoaded}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? 'Processing...' : isSnapLoaded ? 'Continue to Payment' : 'Loading...'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
