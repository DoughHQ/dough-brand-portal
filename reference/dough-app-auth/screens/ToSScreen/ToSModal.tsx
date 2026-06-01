import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors } from '../../theme';

const TOS_CONTENT = `
DOUGH TERMS OF SERVICE
Last Updated: March 2026

IMPORTANT: PLEASE READ THESE TERMS CAREFULLY BEFORE USING DOUGH.

1. ACCEPTANCE OF TERMS

By creating an account or using Dough ("the App," "the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service. These Terms constitute a legally binding agreement between you and Dough Inc. ("Dough," "we," "us," or "our").

2. THE SERVICE

Dough is a food intelligence platform that allows users to discover, rate, compare, and save food products; view nutritional and sourcing information; contribute product images and data; and receive personalized food recommendations based on taste, health, value, and ethical sourcing preferences.

3. ACCOUNTS AND REGISTRATION

You must be at least 13 years of age to use Dough. By creating an account, you represent that all information you provide is accurate and complete. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to notify us immediately at legal@dough.app of any unauthorized use of your account.

4. USER-GENERATED CONTENT

4.1 Content You Submit. Dough allows users to submit photographs of food products, including images of product packaging, labels, and nutritional information ("User Content").

4.2 License Grant. By submitting User Content to Dough, you grant Dough Inc. a worldwide, non-exclusive, royalty-free, sublicensable, perpetual license to use, reproduce, modify, adapt, publish, translate, process, display, and distribute your User Content in connection with operating and improving the Service.

4.3 Your Representations. By submitting User Content, you represent that: (a) you own or have the necessary rights to submit the content; (b) the content does not violate any third-party rights; and (c) photographing the product is lawful in your jurisdiction.

4.4 Prohibited Content. You may not submit content that is obscene, defamatory, fraudulent, or that violates any applicable law.

5. RATINGS, BATTLES, AND SCORES

Dough uses a pairwise comparison ("battle") system to generate taste ratings. Scores are informational tools, not professional nutritional advice. You agree not to manipulate the rating system.

6. DATA AND PRIVACY

Your use of Dough is also governed by our Privacy Policy. Dough collects your food preferences and behavioral data to personalize your experience and improve the Service.

7. INTELLECTUAL PROPERTY

The Dough name, logo, and all software are the exclusive property of Dough Inc.

8. DISCLAIMERS

THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.

9. LIMITATION OF LIABILITY

TO THE MAXIMUM EXTENT PERMITTED BY LAW, DOUGH INC. SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES.

10. CONTACT

Dough Inc. • legal@dough.app
`.trim();

const SECTIONS = TOS_CONTENT.split(/(?=\d+\.\s)/).filter(Boolean);

export default function ToSModal({
  visible,
  onClose,
  title = 'Terms of Service',
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.handle} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{title}</Text>
          {SECTIONS.map((section, i) => {
            const isHeader = section.match(/^[A-Z\s]+$/m) || section.startsWith('DOUGH ') || section.startsWith('IMPORTANT');
            const lines = section.split('\n').filter(Boolean);
            const firstLine = lines[0] ?? '';
            const rest = lines.slice(1).join('\n');
            return (
              <View key={i} style={styles.section}>
                <Text style={isHeader ? styles.sectionHeader : styles.body}>
                  {firstLine}
                </Text>
                {rest ? <Text style={styles.body}>{rest}</Text> : null}
              </View>
            );
          })}
        </ScrollView>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.closeBtnText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textTertiary,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 24,
  },
  section: { marginBottom: 20 },
  sectionHeader: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  body: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  closeBtn: {
    height: 56,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: colors.textPrimary, fontSize: 17, fontWeight: '600' },
});
