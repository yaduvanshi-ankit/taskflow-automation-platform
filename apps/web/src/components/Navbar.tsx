'use client';
import type { AuthUser } from '../lib/store';

export function Navbar({ user, onSignOut }: { user: AuthUser | null; onSignOut: () => void }) {
  return (
    <header>
      <div>
        <p className="eyebrow">TASKFLOW / WORKSPACE</p>
        <h1>Good to see you, {user?.name}.</h1>
        {user?.role === 'admin' && <p className="muted small">Signed in as admin</p>}
      </div>
      <button type="button" className="secondary" onClick={onSignOut}>
        Sign out
      </button>
    </header>
  );
}
