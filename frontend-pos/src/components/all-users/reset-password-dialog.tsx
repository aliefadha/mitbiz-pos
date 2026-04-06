import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { User } from '@/lib/api/users';
import { usersApi } from '@/lib/api/users';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ResetPasswordDialogProps {
  user: User;
  children: React.ReactNode;
  onSuccess?: () => void;
}

export function ResetPasswordDialog({ user, children, onSuccess }: ResetPasswordDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleReset = async () => {
    setIsLoading(true);
    setResetUrl(null);
    try {
      const result = await usersApi.requestPasswordReset(user.email);

      if (!result.resetUrl) {
        toast.error('User tidak ditemukan');
        return;
      }

      setResetUrl(result.resetUrl);

      const token = result.resetUrl.split('/reset-password/')[1];
      if (!token) {
        toast.error('Token tidak valid');
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: '12345678',
          token,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset password');
      }

      toast.success('Password berhasil direset');
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mereset password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!resetUrl) return;
    await navigator.clipboard.writeText(resetUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setResetUrl(null);
      setIsCopied(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">
          Password user ini akan direset ke: <span className="font-semibold">12345678</span>
        </p>
        {resetUrl && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Reset URL:</p>
            <div className="flex gap-2">
              <Input value={resetUrl} readOnly className="text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button onClick={handleReset} disabled={isLoading}>
            {isLoading ? 'Mereset...' : 'Reset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
