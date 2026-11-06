export interface EmailProvider {
  sendVerification(email: string, code: string, purpose: string): Promise<boolean>;
}
