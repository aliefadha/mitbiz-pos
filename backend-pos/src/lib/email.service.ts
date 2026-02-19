import { createTransport, Transporter } from 'nodemailer';

export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });
  }

  async sendVerificationEmail(email: string, verifyUrl: string) {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@mitbiz.com',
      to: email,
      subject: 'Verifikasi Email Anda - Mitbiz POS',
      html: `
        <h1>Email Verification</h1>
        <p>Click the button below to verify your email address:</p>
        <a href="${verifyUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Verify Email
        </a>
        <p>Or copy and paste this link: ${verifyUrl}</p>
        <p>This link will expire in 24 hours.</p>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, resetUrl: string) {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@mitbiz.com',
      to: email,
      subject: 'Reset Password - Mitbiz POS',
      html: `
        <h1>Password Reset</h1>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
        <p>Or copy and paste this link: ${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
      `,
    });
  }
}

export const emailService = new EmailService();
