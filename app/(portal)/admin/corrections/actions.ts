'use server'

import { reviewCorrectionSubmission } from '@/lib/corrections'

export async function reviewCorrectionAction(
  submissionId: string,
  action: 'approve' | 'reject'
): Promise<{ ok: boolean; error?: string }> {
  return reviewCorrectionSubmission(submissionId, action)
}
