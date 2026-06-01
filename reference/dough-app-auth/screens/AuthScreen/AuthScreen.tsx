// ============================================================
// DOUGH — Auth (Sign in / Sign up)
// Black background, brand orange accent.
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Switch,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';
import { screenHeaderPaddingTop } from '../../lib/safeAreaHeader';
import { ScreenShell } from '../../components/ScreenShell';
import {
  SESSION_MODE_KEY,
  SESSION_MODE_TEMPORARY,
} from '../../constants/session';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { setSession, setOnboardingCompleted, signOut } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [hasRemoteAuthSession, setHasRemoteAuthSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setHasRemoteAuthSession(!!data.session);
    });
  }, []);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 8;
  const confirmValid = mode === 'signin' || (password === confirmPassword && password.length > 0);

  const handleSignUp = async () => {
    if (!emailValid || !passwordValid || !confirmValid) return;
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data.user) {
      const authId = data.user.id;
      const { data: insertData, error: insertErr } = await supabase
        .from('users')
        .insert({ auth_id: authId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .select('user_id')
        .single();
      const userId = insertErr ? 1 : (insertData as any)?.user_id ?? 1;
      await supabase
        .from('user_profiles')
        .upsert({ user_id: userId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      setSession({ userId, authId });
      if (!keepSignedIn) {
        await AsyncStorage.setItem(SESSION_MODE_KEY, SESSION_MODE_TEMPORARY);
      } else {
        await AsyncStorage.removeItem(SESSION_MODE_KEY);
      }
    }
  };

  const handleSignIn = async () => {
    if (!emailValid || !passwordValid) return;
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data.user) {
      const { data: userRow } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', data.user.id)
        .single();
      if (!userRow) {
        setError('Account not found.');
        return;
      }
      const { data: profileRow } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', (userRow as any).user_id)
        .maybeSingle();
      setSession({ userId: (userRow as any).user_id, authId: data.user.id });
      setOnboardingCompleted(!!(profileRow as any)?.onboarding_completed);
      if (!keepSignedIn) {
        await AsyncStorage.setItem(SESSION_MODE_KEY, SESSION_MODE_TEMPORARY);
      } else {
        await AsyncStorage.removeItem(SESSION_MODE_KEY);
      }
    }
  };

  const submit = mode === 'signin' ? handleSignIn : handleSignUp;

  return (
    <ScreenShell style={styles.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: screenHeaderPaddingTop(insets) + 70,
              paddingBottom: insets.bottom + 40,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.hero}>Dough</Text>
          <Text style={styles.subtext}>
            {mode === 'signin' ? 'Welcome back.' : 'Create your account.'}
          </Text>

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.passwordFieldWrap}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password (min 8)"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(''); }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.passwordEyeBtn}
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.keepSignedInRow}>
              <Text style={styles.keepSignedInLabel}>Keep me signed in</Text>
              <Switch
                value={keepSignedIn}
                onValueChange={setKeepSignedIn}
                trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                thumbColor={keepSignedIn ? colors.primary : colors.textTertiary}
              />
            </View>

            {mode === 'signup' && (
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
                secureTextEntry={!showPassword}
              />
            )}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {mode === 'signup' ? (
            <View style={styles.termsRow}>
              <TouchableOpacity
                style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}
                onPress={() => setTermsAccepted((v) => !v)}
                activeOpacity={0.85}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: termsAccepted }}
                accessibilityLabel="Accept terms and privacy policy"
              >
                {termsAccepted ? (
                  <Ionicons name="checkmark" size={14} color={colors.surface} />
                ) : null}
              </TouchableOpacity>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => void Linking.openURL('https://godough.co/terms')}
                >
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => void Linking.openURL('https://godough.co/privacy')}
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              {
                opacity:
                  emailValid &&
                  passwordValid &&
                  confirmValid &&
                  (mode === 'signin' || termsAccepted)
                    ? 1
                    : 0.5,
              },
            ]}
            onPress={submit}
            disabled={
              !emailValid ||
              !passwordValid ||
              !confirmValid ||
              (mode === 'signup' && !termsAccepted) ||
              loading
            }
            activeOpacity={0.97}
          >
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.primaryBtnText}>
                {mode === 'signin' ? 'Sign in →' : 'Create account →'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
            style={styles.switchLink}
          >
            <Text style={styles.switchLinkText}>
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>

          {hasRemoteAuthSession ? (
            <TouchableOpacity
              style={styles.signOutGhostBtn}
              onPress={async () => {
                setLoading(true);
                try {
                  await signOut();
                  setHasRemoteAuthSession(false);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.signOutGhostText}>Sign out</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 24 },
  hero: {
    color: colors.textPrimary,
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtext: {
    color: colors.textSecondary,
    fontSize: 17,
    marginTop: 8,
    textAlign: 'center',
  },
  inputGroup: { marginTop: 40, gap: 12 },
  passwordFieldWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    height: 56,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingRight: 52,
    color: colors.textPrimary,
    fontSize: 16,
  },
  passwordEyeBtn: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keepSignedInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  keepSignedInLabel: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    height: 56,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    color: colors.textPrimary,
    fontSize: 16,
  },
  signOutGhostBtn: {
    marginTop: 28,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  signOutGhostText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: { color: colors.error, fontSize: 14, marginTop: 8 },
  termsRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  termsText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  primaryBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  primaryBtnText: { color: colors.surface, fontSize: 17, fontWeight: '700' },
  switchLink: { marginTop: 20, alignItems: 'center' },
  switchLinkText: { color: colors.textSecondary, fontSize: 14 },
});
