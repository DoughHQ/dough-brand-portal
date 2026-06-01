// ============================================================
// DOUGH — Onboarding (steps 0–8)
// World-class first impression. Black background, step accents.
// ============================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { ScreenShell } from '../../components/ScreenShell';
import {
  updateUserOnboarding,
  getArchetypeDefaults,
  getOnboardingBattlePairs,
  getArchetypeAccent,
  type ArchetypeDefault,
  type OnboardingBattlePair,
} from '../../lib/api/onboarding';
import ToSModal from '../ToSScreen/ToSModal';
import { colors } from '../../theme';
import { StatusBar } from 'expo-status-bar';
import { screenHeaderPaddingTop } from '../../lib/safeAreaHeader';

const { width: SCREEN_W } = Dimensions.get('window');

const DIETARY_PILLS = [
  { id: 'vegetarian', emoji: '🌿', label: 'Vegetarian' },
  { id: 'vegan', emoji: '🌱', label: 'Vegan' },
  { id: 'gluten_free', emoji: '🌾', label: 'Gluten-Free' },
  { id: 'dairy_free', emoji: '🥛', label: 'Dairy-Free' },
  { id: 'nut_free', emoji: '🥜', label: 'Nut-Free' },
  { id: 'pescatarian', emoji: '🐟', label: 'Pescatarian' },
  { id: 'keto', emoji: '🥩', label: 'Keto' },
  { id: 'paleo', emoji: '🏔️', label: 'Paleo' },
  { id: 'whole30', emoji: '🍃', label: 'Whole30' },
  { id: 'low_sodium', emoji: '🧂', label: 'Low-Sodium' },
  { id: 'low_sugar', emoji: '🍬', label: 'Low-Sugar' },
  { id: 'no_artificial', emoji: '🚫', label: 'No Artificial Ingredients' },
  { id: 'no_seed_oils', emoji: '🫒', label: 'No Seed Oils' },
  { id: 'kosher', emoji: '✡️', label: 'Kosher' },
  { id: 'halal', emoji: '☪️', label: 'Halal' },
];

const FOOD_INTEREST_PILLS = [
  '🍕 Pizza', '🍔 Burgers', '🌮 Tacos', '🍜 Ramen', '🧀 Cheese', '🥓 Bacon', '🍟 Fries', '🌭 Hot Dogs',
  '🥗 Salads', '🍣 Sushi', '🥙 Wraps', '🥑 Avocado', '🥦 Veggies', '🍱 Bento', '🫙 Pickles',
  '🍫 Chocolate', '🍦 Ice Cream', '🍰 Cake', '🍩 Donuts', '🧇 Waffles', '🍪 Cookies', '🥞 Pancakes',
  '🌶️ Spicy', '🔥 Extra Hot', '🫕 Curry', '🌯 Burritos', '🍗 Wings',
  '🥩 Steak', '🦞 Seafood', '🍷 Wine & Dine', '🧆 Mediterranean', '🫒 Olive Oil', '🥐 Pastry', '☕ Coffee',
  '🥜 Nut Butters', '🍿 Popcorn', '🧃 Juice', '🥤 Smoothies', '🍎 Fruit', '🧁 Snack Bars',
];

const TASTE_QUESTIONS: { left: string; right: string; dbKey: string; accent: string }[] = [
  { left: 'SWEET 🍬', right: 'SALTY 🧂', dbKey: 'taste_sweet_vs_salty', accent: colors.primary },
  { left: 'RICH & INDULGENT 🧀', right: 'LIGHT & FRESH 🥗', dbKey: 'taste_rich_vs_light', accent: colors.primaryAccent },
  { left: 'SPICY 🌶️', right: 'MILD 😌', dbKey: 'taste_spicy_vs_mild', accent: colors.primary },
  { left: 'DARK & BITTER ☕', right: 'SWEET & MELLOW 🍯', dbKey: 'taste_bitter_vs_sweet', accent: colors.secondaryAccent },
  { left: 'SAVORY & UMAMI 🍖', right: 'BRIGHT & TANGY 🍋', dbKey: 'taste_savory_vs_sweet', accent: colors.primaryAccent },
  { left: 'CRUNCHY & CRISPY 🥨', right: 'SMOOTH & CREAMY 🍦', dbKey: 'taste_crunchy_vs_smooth', accent: colors.primary },
];

const ARCHETYPE_REVEAL: Record<string, { emoji: string; label: string; desc: string; color: string }> = {
  taste_first: { emoji: '🏆', label: 'Taste First', color: colors.primary, desc: "You eat with conviction. When something tastes incredible, that's what matters. Dough will surface the products people actually love to eat — not just the ones that look good on paper." },
  balanced: { emoji: '⚖️', label: 'Balanced', color: colors.primaryAccent, desc: "You don't compromise on any dimension. Taste, health, price, ethics — you want the full picture before you decide. Dough was designed for exactly this kind of thinking." },
  smart_shopper: { emoji: '💰', label: 'Smart Shopper', color: colors.primary, desc: "You've figured out what most people haven't: premium price doesn't always mean premium product. Dough will show you what's actually worth your money." },
  clean_eater: { emoji: '🥗', label: 'Clean Eater', color: colors.primaryAccent, desc: "You read the label. You know the difference between food and food product. Dough will help you find the real stuff — and call out the rest." },
  health_optimizer: { emoji: '💪', label: 'Health Optimizer', color: colors.primaryAccent, desc: "For you, food is fuel and food is medicine. Every choice is intentional. Dough will score every product against your specific nutritional priorities." },
  conscious_consumer: { emoji: '🌱', label: 'Conscious Consumer', color: colors.primary, desc: "You vote with your dollar. Where food comes from, how it's made, and who profits — it all matters to you. Dough's PROOFE score was built for people like you." },
};

function primaryPriorityFromArchetype(archetype: string): string {
  const map: Record<string, string> = {
    taste_first: 'TASTE',
    health_optimizer: 'HEALTH',
    clean_eater: 'HEALTH',
    smart_shopper: 'PRICE',
    conscious_consumer: 'PROOFE',
    balanced: 'TASTE',
  };
  return map[archetype] ?? 'TASTE';
}

type OnboardingProps = { onComplete?: () => void; initialStep?: number };

export default function OnboardingScreen({ onComplete, initialStep = 0 }: OnboardingProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { session, setSession, setOnboardingCompleted, setDisplayName, setEaterArchetype, setWeights, displayName, eaterArchetype, weights } = useAuth();
  const [step, setStep] = useState(initialStep);
  const [tosVisible, setTosVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [signInVisible, setSignInVisible] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [displayNameVal, setDisplayNameVal] = useState('');
  const [nameFocused, setNameFocused] = useState(false);

  const [archetypes, setArchetypes] = useState<ArchetypeDefault[]>([]);
  const [selectedArchetype, setSelectedArchetype] = useState<ArchetypeDefault | null>(null);

  const [dietary, setDietary] = useState<Set<string>>(new Set());
  const [foodInterests, setFoodInterests] = useState<Set<string>>(new Set());
  const [tasteQuestion, setTasteQuestion] = useState(0);
  const [tasteAnswers, setTasteAnswers] = useState<Record<string, number>>({});

  const [battlePairs, setBattlePairs] = useState<OnboardingBattlePair[]>([]);
  const [battlePairsLoading, setBattlePairsLoading] = useState(false);
  const [stepLoading, setStepLoading] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const entranceAnim = useRef(new Animated.Value(0)).current;

  const hapticSelect = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);
  const hapticSuccess = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  useEffect(() => {
    if (step >= 2 && step <= 8) {
      Animated.timing(progressAnim, {
        toValue: step / 8,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [step]);

  useEffect(() => {
    entranceAnim.setValue(0);
    Animated.parallel([
      Animated.timing(entranceAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [step]);

  useEffect(() => {
    getArchetypeDefaults().then(setArchetypes);
  }, []);

  useEffect(() => {
    if (step === 7) {
      setBattlePairsLoading(true);
      getOnboardingBattlePairs()
        .then(setBattlePairs)
        .finally(() => setBattlePairsLoading(false));
    }
  }, [step]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const entranceY = entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
  const entranceOpacity = entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const getStepAccent = () => {
    if (step === 0 || step === 7) return colors.primary;
    if (step === 1) return colors.surface;
    if (step === 2) return colors.primary;
    if (step === 3 && selectedArchetype) return getArchetypeAccent(selectedArchetype.archetype);
    if (step === 3) return colors.primary;
    if (step === 4) return colors.primaryAccent;
    if (step === 5) return colors.secondaryAccent;
    if (step === 6) return TASTE_QUESTIONS[tasteQuestion]?.accent ?? colors.primary;
    if (step === 8) return getArchetypeAccent(eaterArchetype ?? '') || colors.primary;
    return colors.primary;
  };
  const accent = getStepAccent();

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 8;
  const confirmValid = password === confirmPassword && password.length > 0;
  const passwordStrength = [
    password.length >= 8,
    /\d/.test(password),
    /[!@#$%^&*(),.?":{}|<>]/.test(password),
    password.length >= 12,
  ].filter(Boolean).length;

  const insertSignupConsents = async (userId: number) => {
    const now = new Date().toISOString();
    const base = {
      user_id: userId,
      consent_version: '1.0',
      granted: true,
      granted_at: now,
      collected_at: now,
      collected_by_type: 'user',
      collection_method: 'signup_checkbox',
      source_ref: 'signup_screen_v1',
    };
    const { error } = await supabase.from('user_consents').insert([
      { ...base, consent_type: 'terms_of_service', policy_doc_ref: 'https://godough.co/terms' },
      { ...base, consent_type: 'privacy_policy', policy_doc_ref: 'https://godough.co/privacy' },
    ]);
    if (error) console.error('[onboarding] consent insert failed', error);
  };

  const handleCreateAccount = async () => {
    if (!emailValid || !passwordValid || !confirmValid || !termsAccepted) return;
    setAuthLoading(true);
    setAuthError('');
    hapticSuccess();
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setAuthError(error.message);
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
        void insertSignupConsents(userId);
        setSession({ userId, authId });
        setStep(2);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!emailValid || !passwordValid) return;
    setAuthLoading(true);
    setAuthError('');
    hapticSuccess();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError(error.message);
        return;
      }
      if (data.user) {
        const { data: userRow } = await supabase.from('users').select('user_id').eq('auth_id', data.user.id).single();
        if (!userRow) {
          setSignInVisible(false);
          return;
        }
        const userId = (userRow as any).user_id;
        const { data: profileRow } = await supabase
          .from('user_profiles')
          .select('onboarding_completed')
          .eq('user_id', userId)
          .maybeSingle();
        setSession({ userId, authId: data.user.id });
        setOnboardingCompleted(!!(profileRow as any)?.onboarding_completed);
        onComplete?.();
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleStep2Next = async () => {
    if (!displayNameVal.trim() || !session) return;
    setStepLoading(true);
    setSaveError('');
    hapticSuccess();
    try {
      setDisplayName(displayNameVal.trim());
      const { error } = await updateUserOnboarding(session.userId, { display_name: displayNameVal.trim() });
      if (error) {
        setSaveError('Couldn\'t save. Try again.');
        return;
      }
      setStep(3);
    } finally {
      setStepLoading(false);
    }
  };

  const handleStep3Next = async () => {
    if (!selectedArchetype || !session) return;
    setStepLoading(true);
    setSaveError('');
    hapticSuccess();
    try {
      const primaryPriority = primaryPriorityFromArchetype(selectedArchetype.archetype);
      const payload = {
        eater_archetype: selectedArchetype.archetype,
        primary_priority: primaryPriority,
        weight_taste: selectedArchetype.weight_taste,
        weight_health: selectedArchetype.weight_health,
        weight_price: selectedArchetype.weight_price,
        weight_proofe: selectedArchetype.weight_proofe,
      };
      const { error } = await updateUserOnboarding(session.userId, payload);
      if (error) {
        setSaveError('Couldn\'t save. Try again.');
        return;
      }
      setEaterArchetype(selectedArchetype.archetype);
      setWeights({
        weight_taste: selectedArchetype.weight_taste,
        weight_health: selectedArchetype.weight_health,
        weight_price: selectedArchetype.weight_price,
        weight_proofe: selectedArchetype.weight_proofe,
      });
      setStep(4);
    } finally {
      setStepLoading(false);
    }
  };

  const handleStep4Next = async () => {
    if (!session) return;
    setStepLoading(true);
    setSaveError('');
    hapticSuccess();
    try {
      const arr = Array.from(dietary);
      const { error } = await updateUserOnboarding(session.userId, {
        dietary_restrictions: arr,
        onboarding_dietary_done: true,
      });
      if (error) {
        setSaveError('Couldn\'t save. Try again.');
        return;
      }
      setStep(5);
    } finally {
      setStepLoading(false);
    }
  };

  const handleStep5Next = async () => {
    if (!session || foodInterests.size < 3) return;
    setStepLoading(true);
    setSaveError('');
    hapticSuccess();
    try {
      const tags = Array.from(foodInterests).map((s) => s.replace(/^[^\s]+\s/, '').toLowerCase());
      const { error } = await updateUserOnboarding(session.userId, {
        food_interest_tags: tags,
        onboarding_interests_done: true,
      });
      if (error) {
        setSaveError('Couldn\'t save. Try again.');
        return;
      }
      setStep(6);
    } finally {
      setStepLoading(false);
    }
  };

  const handleTasteSelect = (value: number) => {
    hapticSelect();
    const q = TASTE_QUESTIONS[tasteQuestion];
    if (!q) return;
    const nextAnswers = { ...tasteAnswers, [q.dbKey]: value };
    setTasteAnswers(nextAnswers);
    if (tasteQuestion < 5) {
      setTimeout(() => setTasteQuestion((prev) => prev + 1), 400);
    } else {
      if (!session) return;
      setStepLoading(true);
      setSaveError('');
      hapticSuccess();
      const payload = {
        ...nextAnswers,
        taste_profile_completed: true,
        taste_profile_completed_at: new Date().toISOString(),
        onboarding_taste_done: true,
      };
      updateUserOnboarding(session.userId, payload)
        .then(({ error }) => {
          if (error) setSaveError('Couldn\'t save. Try again.');
          else setStep(7);
        })
        .finally(() => setStepLoading(false));
    }
  };

  const handleStep7Skip = async () => {
    if (!session) return;
    setStepLoading(true);
    setSaveError('');
    hapticSuccess();
    try {
      const { error } = await updateUserOnboarding(session.userId, { onboarding_battle_done: false });
      if (error) setSaveError('Couldn\'t save. Try again.');
      else setStep(8);
    } finally {
      setStepLoading(false);
    }
  };

  const handleStartBattle = useCallback(() => {
    if (!session || battlePairs.length === 0) return;
    hapticSuccess();
    const pairs = battlePairs.map((p) => ({
      product_a_id: p.product_a_id,
      product_b_id: p.product_b_id,
      battle_prompt: p.battle_prompt,
      battle_subtitle: p.battle_subtitle ?? '',
      category_name: p.category_name ?? '',
      product_a_name: p.product_a_name,
      product_a_image_url: p.product_a_image_url,
      product_a_brand_name: p.product_a_brand_name,
      product_b_name: p.product_b_name,
      product_b_image_url: p.product_b_image_url,
      product_b_brand_name: p.product_b_brand_name,
    }));
    navigation.navigate('Battle', {
      onboardingMode: true,
      onboardingPairs: pairs,
      onOnboardingBattleComplete: async () => {
        if (session) {
          try {
            await updateUserOnboarding(session.userId, {
              onboarding_battle_done: true,
              updated_at: new Date().toISOString(),
            });
          } catch (_) {}
        }
        navigation.goBack();
        setStep(8);
      },
    });
  }, [session, battlePairs, navigation]);

  const handleStep8Complete = async () => {
    if (!session) return;
    setStepLoading(true);
    setSaveError('');
    hapticSuccess();
    try {
      const { error } = await updateUserOnboarding(session.userId, {
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        onboarding_step: 8,
        onboarding_account_done: true,
      });
      if (error) {
        setSaveError('Couldn\'t save. Try again.');
        return;
      }
      setOnboardingCompleted(true);
      onComplete?.();
    } finally {
      setStepLoading(false);
    }
  };

  const truncate = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n) + '…');

  const archetypeForReveal = eaterArchetype ? ARCHETYPE_REVEAL[eaterArchetype] : null;
  const weightsForReveal = weights;

  return (
    <ScreenShell style={styles.root}>
      <StatusBar style="light" />
      {step >= 2 && step <= 8 && (
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: accent }]} />
        </View>
      )}

      {step >= 2 && (
        <TouchableOpacity
          style={[styles.backBtn, { top: screenHeaderPaddingTop(insets) }]}
          onPress={() => {
            hapticSelect();
            setStep((s) => Math.max(0, s - 1));
          }}
        >
          <Text style={styles.backChevron}>←</Text>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <Animated.View style={[styles.inner, { transform: [{ translateY: entranceY }], opacity: entranceOpacity }]}>
          {/* STEP 0 — Welcome */}
          {step === 0 && (
            <ScrollView contentContainerStyle={[styles.centered, { paddingTop: 60, paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
              <PulseEmoji>🍞</PulseEmoji>
              <Text style={styles.hero}>Dough</Text>
              <Text style={styles.subtext}>Shape Your Food.</Text>
              <View style={styles.valueRows}>
                <ValueRow emoji="⚔️" title="Battle foods" sub="Build your real taste profile" />
                <ValueRow emoji="🥗" title="Personalized scores" sub="Health ratings tuned to you" />
                <ValueRow emoji="💡" title="Real intelligence" sub="Know what's actually worth eating" />
              </View>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => { hapticSelect(); setStep(1); }} activeOpacity={0.97}>
                <Text style={styles.primaryBtnText}>Let's go →</Text>
              </TouchableOpacity>
              <Text style={styles.legal}>
                By continuing you agree to our{' '}
                <Text style={styles.legalLink} onPress={() => setTosVisible(true)}>Terms of Service</Text> and{' '}
                <Text style={styles.legalLink} onPress={() => setPrivacyVisible(true)}>Privacy Policy</Text>
              </Text>
            </ScrollView>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <ScrollView contentContainerStyle={[styles.formWrap, { paddingTop: 60, paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
              <Text style={styles.hero}>Create your account</Text>
              <Text style={styles.subtext}>Free forever. No credit card.</Text>
              <View style={styles.inputGroup}>
                <TextInput style={styles.input} placeholder="📧 Email" placeholderTextColor={colors.textSecondary} value={email} onChangeText={setEmail} onBlur={() => setEmailTouched(true)} keyboardType="email-address" autoCapitalize="none" />
                {emailTouched && !emailValid && email.length > 0 && <Text style={styles.errorText}>Invalid email</Text>}
                <TextInput style={styles.input} placeholder="🔒 Password (min 8)" placeholderTextColor={colors.textSecondary} value={password} onChangeText={setPassword} onBlur={() => setPasswordTouched(true)} secureTextEntry />
                <PasswordStrengthBar strength={passwordStrength} />
                {passwordTouched && !passwordValid && password.length > 0 && <Text style={styles.errorText}>Min 8 characters</Text>}
                <TextInput style={styles.input} placeholder="🔒 Confirm password" placeholderTextColor={colors.textSecondary} value={confirmPassword} onChangeText={setConfirmPassword} onBlur={() => setConfirmTouched(true)} secureTextEntry />
                {confirmTouched && !confirmValid && confirmPassword.length > 0 && <Text style={styles.errorText}>Passwords don't match</Text>}
              </View>
              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => { hapticSelect(); setTermsAccepted((v) => !v); }}
                activeOpacity={0.85}
              >
                <View style={[styles.termsCheckbox, termsAccepted && styles.termsCheckboxChecked]}>
                  {termsAccepted ? <Text style={styles.termsCheckmark}>✓</Text> : null}
                </View>
                <Text style={styles.termsLabel}>
                  I agree to the{' '}
                  <Text
                    style={styles.termsLink}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      void Linking.openURL('https://godough.co/terms');
                    }}
                  >
                    Terms of Service
                  </Text>
                  {' '}and{' '}
                  <Text
                    style={styles.termsLink}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      void Linking.openURL('https://godough.co/privacy');
                    }}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </TouchableOpacity>
              {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.surface, opacity: emailValid && passwordValid && confirmValid && termsAccepted ? 1 : 0.5 }]}
                onPress={handleCreateAccount}
                disabled={!emailValid || !passwordValid || !confirmValid || !termsAccepted || authLoading}
                activeOpacity={0.97}
              >
                {authLoading ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={[styles.primaryBtnText, { color: colors.textPrimary }]}>Create Account →</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSignInVisible(true)} style={styles.secondaryLink}>
                <Text style={styles.secondaryLinkText}>Already have an account? <Text style={{ color: colors.primary }}>Sign in →</Text></Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <ScrollView contentContainerStyle={[styles.formWrap, { paddingTop: 60, paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
              <Text style={styles.hero}>What do we call you?</Text>
              <Text style={styles.subtext}>Just your first name is fine.</Text>
              <TextInput
                style={[styles.nameInput, nameFocused && { borderColor: colors.primary, borderWidth: 1.5 }]}
                placeholder="Your name"
                placeholderTextColor={colors.textTertiary}
                value={displayNameVal}
                onChangeText={setDisplayNameVal}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
              />
              {displayNameVal.trim().length > 0 && (
                <Text style={[styles.niceToMeet, { color: colors.primary }]}>Nice to meet you, {displayNameVal.trim()} 👋</Text>
              )}
              {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: displayNameVal.trim().length >= 1 ? 1 : 0.5 }]}
                onPress={handleStep2Next}
                disabled={displayNameVal.trim().length < 1 || stepLoading}
                activeOpacity={0.97}
              >
                {stepLoading ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={[styles.primaryBtnText, { color: colors.textPrimary }]}>That's me →</Text>}
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* STEP 3 — Archetype */}
          {step === 3 && (
            <ScrollView contentContainerStyle={[styles.formWrap, { paddingTop: 60, paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
              <Text style={styles.hero}>How do you approach food?</Text>
              <Text style={styles.subtext}>This shapes every score you see.</Text>
              <View style={styles.archetypeGrid}>
                {archetypes.map((a) => {
                  const ac = getArchetypeAccent(a.archetype);
                  const sel = selectedArchetype?.archetype === a.archetype;
                  return (
                    <TouchableOpacity
                      key={a.archetype}
                      style={[styles.archetypeCard, sel && { backgroundColor: ac + '1F', borderColor: ac, borderWidth: 2 }]}
                      onPress={() => { hapticSelect(); setSelectedArchetype(a); }}
                      activeOpacity={0.9}
                    >
                      <Text style={[styles.archetypeEmoji, sel && { fontSize: 36 }]}>{a.emoji}</Text>
                      <Text style={styles.archetypeLabel}>{a.label}</Text>
                      <Text style={styles.archetypeTagline} numberOfLines={2}>{a.tagline}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {selectedArchetype && (
                <Text style={[styles.archetypeSelectedTagline, { color: getArchetypeAccent(selectedArchetype.archetype) }]}>{selectedArchetype.tagline}</Text>
              )}
              {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: selectedArchetype ? getArchetypeAccent(selectedArchetype.archetype) : colors.surface2 }]}
                onPress={handleStep3Next}
                disabled={!selectedArchetype || stepLoading}
                activeOpacity={0.97}
              >
                {stepLoading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryBtnText}>That's me →</Text>}
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <ScrollView contentContainerStyle={[styles.formWrap, { paddingTop: 60, paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
              <Text style={styles.hero}>Any dietary needs?</Text>
              <Text style={styles.subtext}>Select everything that applies to you.</Text>
              <Text style={styles.hint}>(You can always change these in your profile)</Text>
              <View style={styles.pillGrid}>
                {DIETARY_PILLS.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.pill, dietary.has(p.id) && { backgroundColor: colors.brandSoft, borderColor: colors.primaryAccent, borderWidth: 2 }]}
                    onPress={() => { hapticSelect(); setDietary((prev) => { const n = new Set(prev); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n; }); }}
                  >
                    <Text style={styles.pillEmoji}>{p.emoji}</Text>
                    <Text style={[styles.pillLabel, dietary.has(p.id) && { color: colors.textPrimary }]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {dietary.size > 0 && <Text style={[styles.selectedCount, { color: colors.primaryAccent }]}>{dietary.size} selected</Text>}
              {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primaryAccent }]} onPress={handleStep4Next} disabled={stepLoading} activeOpacity={0.97}>
                {stepLoading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryBtnText}>{dietary.size > 0 ? 'Looks good →' : 'No restrictions →'}</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleStep4Next} style={styles.skipLink}><Text style={styles.skipLinkText}>Skip for now</Text></TouchableOpacity>
            </ScrollView>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <ScrollView contentContainerStyle={[styles.formWrap, { paddingTop: 60, paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
              <Text style={styles.hero}>What are you into?</Text>
              <Text style={styles.subtext}>Pick your favorites. The more the better.</Text>
              <View style={styles.pillGrid}>
                {FOOD_INTEREST_PILLS.map((p) => {
                  const selected = foodInterests.has(p);
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[styles.pill, selected && { backgroundColor: colors.brandSoft, borderColor: colors.secondaryAccent, borderWidth: 2 }]}
                      onPress={() => { hapticSelect(); setFoodInterests((prev) => { const n = new Set(prev); if (n.has(p)) n.delete(p); else n.add(p); return n; }); }}
                    >
                      <Text style={[styles.pillLabel, selected && { color: colors.textPrimary }]}>{p}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[styles.selectedCount, { color: foodInterests.size >= 3 ? colors.secondaryAccent : colors.textSecondary }]}>
                {foodInterests.size} selected {foodInterests.size >= 3 ? '✓' : '— pick at least 3'}
              </Text>
              {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: foodInterests.size >= 3 ? colors.secondaryAccent : colors.surface2 }]}
                onPress={handleStep5Next}
                disabled={foodInterests.size < 3 || stepLoading}
                activeOpacity={0.97}
              >
                {stepLoading ? <ActivityIndicator color={colors.surface} /> : (
                  <Text style={styles.primaryBtnText}>{foodInterests.size >= 3 ? "These are my jams →" : "Pick at least 3 to continue"}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* STEP 6 — Taste DNA */}
          {step === 6 && tasteQuestion < TASTE_QUESTIONS.length && (
            <ScrollView contentContainerStyle={[styles.formWrap, { paddingTop: 40, paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
              <Text style={[styles.hero, { fontSize: 24 }]}>Your Taste DNA</Text>
              <Text style={styles.subtext}>Pick the one that sounds better RIGHT NOW.</Text>
              <Text style={styles.hint}>No wrong answers.</Text>
              <View style={styles.dots}>
                {TASTE_QUESTIONS.map((_, i) => (
                  <View key={i} style={[styles.dot, i === tasteQuestion && { backgroundColor: TASTE_QUESTIONS[i].accent }, i < tasteQuestion && { backgroundColor: colors.surface }]} />
                ))}
              </View>
              <View style={styles.vsRow}>
                <TouchableOpacity
                  style={[styles.vsCard, tasteAnswers[TASTE_QUESTIONS[tasteQuestion]?.dbKey] === 1 && { backgroundColor: TASTE_QUESTIONS[tasteQuestion].accent + '33', borderColor: TASTE_QUESTIONS[tasteQuestion].accent, borderWidth: 2 }]}
                  onPress={() => handleTasteSelect(1)}
                >
                  <Text style={styles.vsCardText}>{TASTE_QUESTIONS[tasteQuestion]?.left}</Text>
                </TouchableOpacity>
                <View style={styles.vsBadge}><Text style={styles.vsBadgeText}>VS</Text></View>
                <TouchableOpacity
                  style={[styles.vsCard, tasteAnswers[TASTE_QUESTIONS[tasteQuestion]?.dbKey] === -1 && { backgroundColor: TASTE_QUESTIONS[tasteQuestion].accent + '33', borderColor: TASTE_QUESTIONS[tasteQuestion].accent, borderWidth: 2 }]}
                  onPress={() => handleTasteSelect(-1)}
                >
                  <Text style={styles.vsCardText}>{TASTE_QUESTIONS[tasteQuestion]?.right}</Text>
                </TouchableOpacity>
              </View>
              {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
            </ScrollView>
          )}

          {/* STEP 7 — First Battle */}
          {step === 7 && (
            <ScrollView contentContainerStyle={[styles.formWrap, { paddingTop: 60, paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
              <Text style={styles.hero}>Time to taste.</Text>
              <Text style={[styles.subtext, { textAlign: 'center' }]}>Three iconic matchups. Your real opinions only.</Text>
              <View style={styles.contextCard}>
                <Text style={styles.contextCardTitle}>⚔️  How it works</Text>
                <Text style={styles.contextBullet}>• Two products appear — pick the one you'd rather eat</Text>
                <Text style={styles.contextBullet}>• Your choices shape your personal taste score</Text>
                <Text style={styles.contextBullet}>• No wrong answers — just your honest take</Text>
              </View>
              <View style={styles.battlePreview}>
                {battlePairsLoading ? (
                  <ActivityIndicator color={colors.textSecondary} style={{ marginVertical: 24 }} />
                ) : (
                  battlePairs.map((p) => (
                    <View key={p.pair_id} style={styles.battlePreviewRowWrap}>
                      <View style={styles.battlePreviewRow}>
                        <Text style={styles.battlePreviewName} numberOfLines={1}>{truncate(p.product_a_name, 18)}</Text>
                        <View style={styles.battlePreviewVs}><Text style={styles.battlePreviewVsText}>VS</Text></View>
                        <Text style={styles.battlePreviewName} numberOfLines={1}>{truncate(p.product_b_name, 18)}</Text>
                      </View>
                      {p.category_name ? <Text style={styles.battlePreviewCat}>{p.category_name}</Text> : null}
                    </View>
                  ))
                )}
              </View>
              {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={handleStartBattle}
                disabled={battlePairsLoading || battlePairs.length === 0}
                activeOpacity={0.97}
              >
                <Text style={styles.primaryBtnText}>Start battling →</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleStep7Skip} style={styles.skipLink}>
                <Text style={styles.skipLinkText}>Skip for now · I'll battle later</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* STEP 8 — Archetype Reveal */}
          {step === 8 && archetypeForReveal && (
            <ScrollView contentContainerStyle={[styles.centered, { paddingTop: 80, paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
              <View style={[styles.archetypeGlow, { backgroundColor: archetypeForReveal.color + '14', width: 280, height: 280, borderRadius: 140 }]} />
              <Text style={styles.archetypeEmojiBig}>{archetypeForReveal.emoji}</Text>
              <Text style={styles.youreText}>You're</Text>
              <Text style={[styles.archetypeName, { color: archetypeForReveal.color }]}>{archetypeForReveal.label}</Text>
              <View style={[styles.archetypeDivider, { backgroundColor: archetypeForReveal.color }]} />
              <Text style={styles.archetypeDesc}>{archetypeForReveal.desc}</Text>
              {weightsForReveal && (
                <View style={styles.weightPills}>
                  <View style={styles.weightPill}><Text style={[styles.weightPillText, { color: colors.primary }]}>Taste {Math.round(weightsForReveal.weight_taste * 100)}%</Text></View>
                  <View style={styles.weightPill}><Text style={[styles.weightPillText, { color: colors.primaryAccent }]}>Health {Math.round(weightsForReveal.weight_health * 100)}%</Text></View>
                  <View style={styles.weightPill}><Text style={[styles.weightPillText, { color: colors.secondaryAccent }]}>Price {Math.round(weightsForReveal.weight_price * 100)}%</Text></View>
                  <View style={styles.weightPill}><Text style={[styles.weightPillText, { color: colors.primaryAccent }]}>PROOFE {Math.round(weightsForReveal.weight_proofe * 100)}%</Text></View>
                </View>
              )}
              <Text style={styles.profileReady}>Your Dough profile is ready.</Text>
              <Text style={styles.welcomeName}>{displayNameVal || displayName || 'You'}, welcome to Dough.</Text>
              {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: archetypeForReveal.color }]}
                onPress={handleStep8Complete}
                disabled={stepLoading}
                activeOpacity={0.97}
              >
                {stepLoading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryBtnText}>Start exploring →</Text>}
              </TouchableOpacity>
            </ScrollView>
          )}
        </Animated.View>
      </KeyboardAvoidingView>

      <Modal visible={signInVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSignInVisible(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sign in</Text>
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.textSecondary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.textSecondary} value={password} onChangeText={setPassword} secureTextEntry />
            {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleSignIn} disabled={!emailValid || !passwordValid || authLoading} activeOpacity={0.97}>
              {authLoading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryBtnText}>Sign in →</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSignInVisible(false); setAuthError(''); }} style={styles.secondaryLink}>
              <Text style={styles.secondaryLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ToSModal visible={tosVisible} onClose={() => setTosVisible(false)} title="Terms of Service" />
      <ToSModal visible={privacyVisible} onClose={() => setPrivacyVisible(false)} title="Privacy Policy" />
    </ScreenShell>
  );
}

function PulseEmoji({ children }: { children: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.06, duration: 1000, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.Text style={[styles.welcomeEmoji, { transform: [{ scale }] }]}>{children}</Animated.Text>;
}

function ValueRow({ emoji, title, sub }: { emoji: string; title: string; sub: string }) {
  return (
    <View style={styles.valueRow}>
      <Text style={styles.valueEmoji}>{emoji}</Text>
      <View style={styles.valueTextWrap}>
        <Text style={styles.valueTitle}>{title}</Text>
        <Text style={styles.valueSub}>{sub}</Text>
      </View>
    </View>
  );
}

function PasswordStrengthBar({ strength }: { strength: number }) {
  return (
    <View style={styles.strengthBar}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[styles.strengthSegment, i < strength && { backgroundColor: [colors.error, colors.warning, colors.primary, colors.primaryAccent][i] }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  progressTrack: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: colors.border, zIndex: 10 },
  progressFill: { height: '100%', borderRadius: 2 },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: { color: colors.textPrimary, fontSize: 24 },
  content: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24 },
  centered: { alignItems: 'center', paddingBottom: 120 },
  formWrap: { paddingBottom: 120 },
  welcomeEmoji: { fontSize: 64, marginBottom: 16 },
  hero: { color: colors.textPrimary, fontSize: 30, fontWeight: '700', letterSpacing: -0.5, textAlign: 'center' },
  subtext: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 8 },
  valueRows: { marginTop: 40, width: '100%', borderTopWidth: 1, borderTopColor: colors.border },
  valueRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  valueEmoji: { fontSize: 28, marginRight: 16 },
  valueTextWrap: { flex: 1 },
  valueTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  valueSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  primaryBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 32 },
  primaryBtnText: { color: colors.surface, fontSize: 17, fontWeight: '700' },
  legal: { color: colors.textTertiary, fontSize: 11, marginTop: 16, textAlign: 'center' },
  legalLink: { color: colors.textSecondary, textDecorationLine: 'underline' },
  inputGroup: { marginTop: 32, gap: 16 },
  input: { height: 56, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, color: colors.textPrimary, fontSize: 16 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 8 },
  termsCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  termsCheckboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  termsCheckmark: { color: colors.surface, fontSize: 14, fontWeight: '700' },
  termsLabel: { flex: 1, color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  termsLink: { color: colors.primary, textDecorationLine: 'underline' },
  nameInput: { height: 96, backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 16, color: colors.textPrimary, fontSize: 28, fontWeight: '600', textAlign: 'center', marginTop: 32 },
  niceToMeet: { fontSize: 15, textAlign: 'center', marginTop: 12 },
  errorText: { color: colors.error, fontSize: 13, marginTop: 4 },
  strengthBar: { flexDirection: 'row', gap: 4, marginTop: 8 },
  strengthSegment: { flex: 1, height: 4, backgroundColor: colors.surface2, borderRadius: 2 },
  secondaryLink: { marginTop: 16, alignItems: 'center' },
  secondaryLinkText: { color: colors.textSecondary, fontSize: 14 },
  hint: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  archetypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 32 },
  archetypeCard: { width: (SCREEN_W - 48 - 12) / 2, height: 130, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, padding: 16, alignItems: 'center', justifyContent: 'center' },
  archetypeEmoji: { fontSize: 32, marginBottom: 8 },
  archetypeLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  archetypeTagline: { color: colors.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 3, paddingHorizontal: 8 },
  archetypeSelectedTagline: { fontSize: 14, textAlign: 'center', marginTop: 12 },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24, justifyContent: 'center' },
  pill: { height: 44, paddingHorizontal: 18, borderRadius: 22, backgroundColor: colors.surface2, borderWidth: 1.5, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 6 },
  pillEmoji: { fontSize: 16 },
  pillLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  selectedCount: { fontSize: 13, textAlign: 'center', marginTop: 16 },
  skipLink: { marginTop: 16, alignItems: 'center' },
  skipLinkText: { color: colors.textSecondary, fontSize: 14 },
  dots: { flexDirection: 'row', gap: 8, marginTop: 16, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  vsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 32, gap: 12 },
  vsCard: { flex: 1, height: 140, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', padding: 16 },
  vsCardText: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  vsBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  vsBadgeText: { color: colors.textPrimary, fontSize: 11, fontWeight: '700' },
  contextCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 20, marginTop: 24 },
  contextCardTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  contextBullet: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 4 },
  battlePreview: { marginTop: 20, gap: 8 },
  battlePreviewRowWrap: { position: 'relative' },
  battlePreviewRow: { height: 56, backgroundColor: colors.surface2, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  battlePreviewName: { color: colors.textPrimary, fontSize: 14, flex: 1 },
  battlePreviewVs: { backgroundColor: colors.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  battlePreviewVsText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  battlePreviewCat: { marginTop: 4, marginLeft: 4, color: colors.textSecondary, fontSize: 11 },
  archetypeGlow: { position: 'absolute', zIndex: -1 },
  archetypeEmojiBig: { fontSize: 64, marginTop: 24 },
  youreText: { color: colors.textSecondary, fontSize: 15, marginTop: 24 },
  archetypeName: { fontSize: 34, fontWeight: '700', letterSpacing: -0.5 },
  archetypeDivider: { width: 40, height: 2, marginVertical: 20 },
  archetypeDesc: { color: colors.textTertiary, fontSize: 15, lineHeight: 22, textAlign: 'center', paddingHorizontal: 28 },
  weightPills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 24, gap: 8 },
  weightPill: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  weightPillText: { fontSize: 13, fontWeight: '600' },
  profileReady: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginTop: 32 },
  welcomeName: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  modalWrap: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 24 },
  modalContent: { gap: 12 },
  modalTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 8 },
});
