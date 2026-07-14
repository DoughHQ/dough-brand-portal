'use server'

import { reviewCorrectionSubmission } from '@/lib/corrections'

export async function reviewCorrectionAction(
  submissionId: string,
  action: 'approve' | 'reject',
  humanNotes?: string | null
): Promise<{ ok: boolean; error?: string }> {
  return reviewCorrectionSubmission(submissionId, action, humanNotes)
}
