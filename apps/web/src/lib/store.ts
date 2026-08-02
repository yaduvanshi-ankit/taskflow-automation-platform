import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AuthUser = { id: string; name: string; email: string; role: 'admin' | 'user' };

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  /** Tracks whether the silent-refresh bootstrap on app load has finished. */
  status: 'checking' | 'ready';
};

const initialState: AuthState = { accessToken: null, user: null, status: 'checking' };

const auth = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<{ accessToken: string; user: AuthUser }>) => {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.status = 'ready';
    },
    clearSession: (state) => {
      state.accessToken = null;
      state.user = null;
      state.status = 'ready';
    },
    bootstrapDone: (state) => {
      state.status = 'ready';
    }
  }
});

export const { setSession, clearSession, bootstrapDone } = auth.actions;

export const store = configureStore({ reducer: { auth: auth.reducer } });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
