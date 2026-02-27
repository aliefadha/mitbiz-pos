import { useNavigate } from '@tanstack/react-router';
import { authClient, signIn, signOut } from '../lib/auth-client';

export function useRegister() {
  return {
    mutate: async (input: { name: string; email: string; password: string }) => {
      const { error } = await authClient.signUp.email({
        name: input.name,
        email: input.email,
        password: input.password,
        callbackURL: `${import.meta.env.VITE_APP_URL || 'http://localhost:3000'}/verify-email`,
      });

      if (error) {
        throw error;
      }
    },
    isPending: false,
    isError: false,
  };
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
      const { error } = await signIn.email({
        email: input.email,
        password: input.password,
      });

      if (error) {
        throw error;
      }

      navigate({ to: '/dashboard' });
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
