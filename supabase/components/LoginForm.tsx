'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import classNames from 'classnames';
import formStyles from '@/styles/components/form.module.scss';

interface Props {
  expired: boolean;
  returnUrl?: string;
}

export default function LoginForm({ expired, returnUrl }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');

    const newUsernameError = username.trim() ? '' : 'Username is required.';
    const newPasswordError = password.trim() ? '' : 'Password is required.';
    setUsernameError(newUsernameError);
    setPasswordError(newPasswordError);

    if (newUsernameError || newPasswordError) {
      if (newUsernameError) {
        usernameRef.current?.focus();
      } else {
        passwordRef.current?.focus();
      }
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, returnUrl }),
      });

      const json = await res.json();

      if (!res.ok) {
        setFormError((json.error as string) ?? 'Something went wrong, please try again.');
        return;
      }

      router.push(json.redirectTo as string);
      router.refresh();
    } catch {
      setFormError('Something went wrong, please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={formStyles.form} noValidate>
      {expired && (
        <p className="error h5 outline" role="alert">
          Your session has expired. Please log in again.
        </p>
      )}

      {formError && (
        <p role="alert" className="error h6 outline">
          <strong>{formError}</strong>
        </p>
      )}

      <div className={formStyles['form__field-group']}>
        <label htmlFor="username" className="outline">Username</label>
        <input
          id="username"
          type="text"
          ref={usernameRef}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          aria-describedby={usernameError ? 'username-error' : undefined}
          aria-invalid={usernameError ? true : undefined}
          autoComplete="username"
          disabled={loading}
        />
        {usernameError && (
          <p id="username-error" className={classNames(formStyles.error, 'error')}>
            {usernameError}
          </p>
        )}
      </div>

      <div className={formStyles['form__field-group']}>
        <label htmlFor="password" className="outline">Password</label>
        <input
          id="password"
          type="password"
          ref={passwordRef}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby={passwordError ? 'password-error' : undefined}
          aria-invalid={passwordError ? true : undefined}
          autoComplete="current-password"
          disabled={loading}
        />
        {passwordError && (
          <p id="password-error" className={classNames(formStyles.error, 'error')}>
            {passwordError}
          </p>
        )}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
