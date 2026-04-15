import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService, type LoginPayload, type RegisterPayload } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const { addToast } = useUiStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: ({ user, token }) => {
      setAuth(user, token);
      navigate('/dashboard');
    },
    onError: (err: { message?: string }) => {
      addToast({ variant: 'error', message: err?.message ?? 'Login failed. Please try again.' });
    },
  });
}

export function useRegister() {
  const { addToast } = useUiStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: () => {
      addToast({ variant: 'success', message: 'Account created successfully. Please sign in.' });
      navigate('/login');
    },
    onError: (err: { message?: string }) => {
      addToast({ variant: 'error', message: err?.message ?? 'Registration failed. Please try again.' });
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  return () => {
    logout();
    navigate('/login');
  };
}
