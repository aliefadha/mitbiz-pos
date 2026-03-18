import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { OWNER_ROLE_ID } from '../constants/role-ids';
import { authClient, signIn, signOut } from '../lib/auth-client';

// Re-export the new auth hooks from context
export { useAuth, usePermissions, useUser } from '../contexts/auth-context';

// Legacy hooks for backward compatibility
export function useRegister() {
  const [isPending, setIsPending] = useState(false);
  const mutate = async (input: { name: string; email: string; password: string }) => {
    setIsPending(true);
    try {
      const { data, error } = await authClient.signUp.email({
        name: input.name,
        email: input.email,
        password: input.password,
        callbackURL: `${import.meta.env.VITE_APP_URL || 'http://localhost:3000'}/verify-email`,
        roleId: OWNER_ROLE_ID,
        roleName: 'owner',
        roleScope: 'tenant',
        tenantId: '',
        outletId: '',
        isSubscribed: false,
      });

      if (error) {
        throw error;
      }

      return data as { verificationUrl?: string } | undefined;
    } finally {
      setIsPending(false);
    }
  };
  return { mutate, isPending };
}

export function useForgotPassword() {
  return {
    mutate: async (input: { email: string }) => {
      const { error } = await authClient.requestPasswordReset({
        email: input.email,
        redirectTo: `${import.meta.env.VITE_APP_URL || 'http://localhost:3000'}/reset-password`,
      });

      if (error) {
        throw error;
      }
    },
    isPending: false,
    isError: false,
  };
}

export function useResetPassword() {
  return {
    mutate: async (input: { token: string; newPassword: string }) => {
      const { error } = await authClient.resetPassword({
        newPassword: input.newPassword,
        token: input.token,
      });

      if (error) {
        throw error;
      }
    },
    isPending: false,
    isError: false,
  };
}

export function useLogin() {
  const navigate = useNavigate({ from: '/login' });

  return {
    mutate: async (input: { email: string; password: string }) => {
      const { data, error } = await signIn.email({
        email: input.email,
        password: input.password,
        // this should be change
        callbackURL: `${import.meta.env.VITE_APP_URL || 'http://localhost:3000'}`,
      });

      if (error) {
        throw error;
      }

      // Check user role scope and redirect accordingly
      const userRoleScope = (data?.user as unknown as { roleScope?: string })?.roleScope;

      if (userRoleScope === 'global') {
        navigate({ to: '/admin' });
      } else {
        navigate({ to: '/dashboard' });
      }
    },
    isPending: false,
    isError: false,
  };
}

export function useLogout() {
  const navigate = useNavigate({ from: '/dashboard' });

  return {
    mutate: async () => {
      const { error } = await signOut();

      if (error) {
        throw error;
      }

      navigate({ to: '/login' });
    },
    isPending: false,
    isError: false,
  };
}
