'use client';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../lib/api';

export function useTaskSocket(accessToken: string | null) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!accessToken) return;
    const socket = io(SOCKET_URL, { auth: { token: accessToken } });
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    };
    socket.on('task:updated', refresh);
    return () => {
      socket.disconnect();
    };
  }, [accessToken, queryClient]);
}
