'use client';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { FormEvent, useState } from 'react';
import { login, register } from '../lib/api';
import { useAppDispatch } from '../lib/hooks';
import { setSession } from '../lib/store';

const errorMessage = (error: unknown) =>
  isAxiosError(error) ? error.response?.data?.error?.message || error.message : 'Something went wrong. Please try again.';

export function AuthPage() {
  const dispatch = useAppDispatch();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const authAction = useMutation({
    mutationFn: () => (isRegister ? register(name, email, password) : login(email, password)),
    onSuccess: (data) => dispatch(setSession(data))
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    authAction.mutate();
  };

  return (
    <main className="auth">
      <section>
        <p className="eyebrow">TASKFLOW</p>
        <h1>Automate work, visibly.</h1>
        <p className="muted">Secure tasks, background processing and live status in one focused workspace.</p>
        <form onSubmit={handleSubmit} aria-label={isRegister ? 'Create account' : 'Sign in'}>
          <h2>{isRegister ? 'Create account' : 'Welcome back'}</h2>
          {isRegister && (
            <input aria-label="Name" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
          )}
          <input aria-label="Email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input
            aria-label="Password"
            type="password"
            placeholder="Password (8+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          {authAction.error && (
            <p className="error" role="alert">
              {errorMessage(authAction.error)}
            </p>
          )}
          <button type="submit" disabled={authAction.isPending}>
            {authAction.isPending ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <button
          type="button"
          className="link"
          onClick={() => {
            authAction.reset();
            setIsRegister((value) => !value);
          }}
        >
          {isRegister ? 'Already have an account? Sign in' : 'New here? Create an account'}
        </button>
      </section>
    </main>
  );
}
