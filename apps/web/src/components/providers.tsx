'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { useEffect, useState } from 'react';
import { store } from '../lib/store';
import { bootstrapSession } from '../lib/api';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 15_000 } } }));
  useEffect(() => {
    // Restore a session from the httpOnly refresh cookie so a reload doesn't sign the user out.
    void bootstrapSession();
  }, []);
  return (
    <Provider store={store}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </Provider>
  );
}
