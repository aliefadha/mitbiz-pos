import { useNavigate } from '@tanstack/react-router';
import { signIn, signOut} from '../lib/auth-client';

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
      const { error } = await signOut()

      if (error) {
        throw error;
      }

      navigate({ to: '/login' });
    },
    isPending: false,
    isError: false,
  };
}

