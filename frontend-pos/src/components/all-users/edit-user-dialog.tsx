'use client';

import { Pencil } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { User } from '@/lib/api/users';
import { usersApi } from '@/lib/api/users';
import { ResetPasswordDialog } from './reset-password-dialog';

interface EditUserDialogProps {
  user: User;
  onSuccess?: () => void;
}

export function EditUserDialog({ user, onSuccess }: EditUserDialogProps) {
  const form = useForm({
    defaultValues: {
      name: user.name || '',
      email: user.email || '',
    },
  });

  useEffect(() => {
    form.reset({
      name: user.name || '',
      email: user.email || '',
    });
  }, [user, form]);

  const onSubmit = async (data: { name: string }) => {
    try {
      await usersApi.updateUser(user.id, { name: data.name });
      toast.success('User berhasil diperbarui');
      onSuccess?.();
    } catch {
      toast.error('Gagal memperbarui user');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="text-gray-500 hover:text-gray-700">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              rules={{ required: 'Nama wajib diisi' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2">
              <ResetPasswordDialog user={user} onSuccess={onSuccess}>
                <Button type="button" variant="outline" disabled={form.formState.isSubmitting}>
                  Reset Password
                </Button>
              </ResetPasswordDialog>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
