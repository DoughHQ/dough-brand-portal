export const MIN_PASSWORD_LENGTH = 8

/** Shared new-password rule for invite welcome and password reset. */
export function validateNewPassword(
  password: string,
  confirm: string
): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  if (password !== password.trim()) {
    return "Passwords can't start or end with a space."
  }
  if (password !== confirm) {
    return 'Passwords do not match.'
  }
  return null
}
