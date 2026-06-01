import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SESSION_MODE_KEY } from '../constants/session';
import { supabase } from '../services/supabase';
import type { DoughWeights } from '../lib/productDisplay';

export type UserWeights = {
  weight_taste: number;
  weight_health: number;
  weight_price: number;
  weight_proofe: number;
};

export type AuthUser = {
  userId: number;
  authId: string;
  weightTaste: number;
  weightHealth: number;
  weightProofe: number;
  weightPrice: number;
  eaterArchetype: string | null;
};

type AuthState = {
  session: { userId: number; authId: string } | null;
  onboardingCompleted: boolean;
  displayName: string | null;
  eaterArchetype: string | null;
  weights: UserWeights | null;
};

type AuthContextValue = AuthState & {
  setSession: (session: { userId: number; authId: string } | null) => void;
  setOnboardingCompleted: (v: boolean) => void;
  setDisplayName: (name: string) => void;
  setEaterArchetype: (archetype: string | null) => void;
  setWeights: (weights: UserWeights | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function resetStreakIfBrokenOnLaunch(currentUserId: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('current_activity_streak, longest_activity_streak, last_active_date')
    .eq('user_id', currentUserId)
    .maybeSingle();

  if (!profile?.last_active_date) return;

  const lastActiveRaw = profile.last_active_date as string;
  const lastActive =
    typeof lastActiveRaw === 'string'
      ? lastActiveRaw.slice(0, 10)
      : String(lastActiveRaw).slice(0, 10);

  if (lastActive === today) return;

  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (lastActive < yesterdayStr) {
    await supabase
      .from('user_profiles')
      .update({ current_activity_streak: 0 })
      .eq('user_id', currentUserId);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<{ userId: number; authId: string } | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [eaterArchetype, setEaterArchetypeState] = useState<string | null>(null);
  const [weights, setWeightsState] = useState<UserWeights | null>(null);
  const [ready, setReady] = useState(false);

  const loadUser = (authId: string, identity: { user_id: number }, profile: Record<string, unknown> | null) => {
    setSessionState({ userId: identity.user_id, authId });
    const p = profile ?? {};
    setOnboardingCompleted(!!p.onboarding_completed);
    setDisplayName((p.display_name as string) ?? null);
    setEaterArchetype((p.eater_archetype as string) ?? null);
    setWeightsState({
      weight_taste: Number(p.weight_taste) || 0.25,
      weight_health: Number(p.weight_health) || 0.25,
      weight_proofe: Number(p.weight_proofe) || 0.25,
      weight_price: Number(p.weight_price) || 0.25,
    });
  };

  useEffect(() => {
    const syncUserFromSession = async (authSession: { user: { id: string } } | null) => {
      if (!authSession?.user?.id) {
        setSessionState(null);
        setOnboardingCompleted(false);
        setDisplayName(null);
        setEaterArchetypeState(null);
        setWeightsState(null);
        return;
      }
      const { data: userRow } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', authSession.user.id)
        .single();
      if (!userRow) return;
      await resetStreakIfBrokenOnLaunch(userRow.user_id);
      const { data: profileRow } = await supabase
        .from('user_profiles')
        .select('display_name, onboarding_completed, onboarding_step, eater_archetype, weight_taste, weight_health, weight_proofe, weight_price')
        .eq('user_id', userRow.user_id)
        .maybeSingle();
      loadUser(authSession.user.id, userRow, profileRow ?? null);
    };

    supabase.auth.getSession().then(async ({ data: { session: authSession } }) => {
      await syncUserFromSession(authSession);
      setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, authSession) => {
      if (event === 'SIGNED_OUT' || !authSession?.user?.id) {
        setSessionState(null);
        setOnboardingCompleted(false);
        setDisplayName(null);
        setEaterArchetypeState(null);
        setWeightsState(null);
        return;
      }
      await syncUserFromSession(authSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const setSession = useCallback((s: { userId: number; authId: string } | null) => {
    setSessionState(s);
  }, []);

  const setEaterArchetype = useCallback((v: string | null) => setEaterArchetypeState(v), []);
  const setWeights = useCallback((v: UserWeights | null) => setWeightsState(v), []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.functions.invoke('register_user', {
      body: { action: 'signin', email, password },
    });
    if (error || !(data as any)?.success) {
      throw new Error((data as any)?.error ?? 'Sign in failed');
    }
    const payload = data as { access_token?: string; refresh_token?: string };
    if (payload.access_token && payload.refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
      });
      if (sessionError) {
        console.error('[AuthContext] setSession failed:', sessionError.message);
      } else if (__DEV__) {
        console.log('[AuthContext] setSession succeeded');
      }
    }
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (authSession?.user?.id) {
      const { data: userRow } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', authSession.user.id)
        .single();
      if (userRow) {
        const { data: profileRow } = await supabase
          .from('user_profiles')
          .select('display_name, onboarding_completed, onboarding_step, eater_archetype, weight_taste, weight_health, weight_proofe, weight_price')
          .eq('user_id', userRow.user_id)
          .maybeSingle();
        loadUser(authSession.user.id, userRow, profileRow ?? null);
      }
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.functions.invoke('register_user', {
      body: { action: 'signup', email, password },
    });
    if (error || !(data as any)?.success) {
      throw new Error((data as any)?.error ?? 'Sign up failed');
    }
    const payload = data as { access_token?: string; refresh_token?: string };
    if (payload.access_token && payload.refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
      });
      if (sessionError) {
        console.error('[AuthContext] setSession failed:', sessionError.message);
      } else if (__DEV__) {
        console.log('[AuthContext] setSession succeeded');
      }
    }
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (authSession?.user?.id) {
      const { data: userRow } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', authSession.user.id)
        .single();
      if (userRow) {
        const { data: profileRow } = await supabase
          .from('user_profiles')
          .select('display_name, onboarding_completed, onboarding_step, eater_archetype, weight_taste, weight_health, weight_proofe, weight_price')
          .eq('user_id', userRow.user_id)
          .maybeSingle();
        loadUser(authSession.user.id, userRow, profileRow ?? null);
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_MODE_KEY);
    await supabase.auth.signOut();
    setSessionState(null);
    setOnboardingCompleted(false);
    setDisplayName(null);
    setEaterArchetypeState(null);
    setWeightsState(null);
  }, []);

  const value: AuthContextValue = {
    session,
    onboardingCompleted,
    displayName,
    eaterArchetype,
    weights,
    setSession,
    setOnboardingCompleted,
    setDisplayName,
    setEaterArchetype,
    setWeights,
    signIn,
    signUp,
    signOut,
  };

  if (!ready) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

const DEFAULT_WEIGHTS: DoughWeights = {
  weight_taste: 0.25,
  weight_health: 0.25,
  weight_proofe: 0.25,
  weight_price: 0.25,
};

export function useDoughWeights(): DoughWeights {
  const { weights } = useAuth();
  return useMemo(
    () =>
      weights
        ? {
            weight_taste: weights.weight_taste,
            weight_health: weights.weight_health,
            weight_proofe: weights.weight_proofe,
            weight_price: weights.weight_price,
          }
        : DEFAULT_WEIGHTS,
    [
      weights?.weight_taste,
      weights?.weight_health,
      weights?.weight_proofe,
      weights?.weight_price,
    ]
  );
}
