import * as nodemailer from 'nodemailer';
import { emailConfig } from '../config';
import {
  generatePasswordResetHTML,
  generatePasswordResetText,
  generateEmailVerificationHTML,
  generateEmailVerificationText,
  generateWelcomeHTML,
  generateWelcomeText,
  generateNotificationHTML,
  generateNotificationText,
} from '../templates/emails';

/**
 * Email Service
 * 
 * Handles all email sending operations
 */

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Create email transporter
 */
function createTransporter() {
  if (!emailConfig.host) {
    throw new Error('Email configuration not found. Please set up SMTP settings in environment variables.');
  }

  return nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure, // true for 465, false for other ports
    auth: {
      user: emailConfig.user,
      pass: emailConfig.password,
    },
  });
}

/**
 * Send email
 */
export async function sendEmail(options: EmailOptions) {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${emailConfig.fromName}" <${emailConfig.from}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Send password reset email (Mobile-Friendly)
 */
export async function sendPasswordResetEmail(email: string, resetToken: string, resetUrl?: string) {
  // Generate both web and mobile links
  const webLink = resetUrl || `${emailConfig.baseUrl}/reset-password?token=${resetToken}`;
  const universalLink = `${emailConfig.baseUrl}/auth/reset?token=${resetToken}`; // Opens app if installed

  const html = generatePasswordResetHTML({
    resetToken,
    universalLink,
    webLink,
  });

  const text = generatePasswordResetText({
    resetToken,
    universalLink,
    webLink,
  });

  return sendEmail({
    to: email,
    subject: '🔐 Password Reset Request',
    text,
    html,
  });
}

/**
 * Send email verification email (Mobile-Friendly)
 */
export async function sendVerificationEmail(email: string, verificationToken: string, verificationUrl?: string) {
  // Generate both web and mobile links
  const webLink = verificationUrl || `${emailConfig.baseUrl}/verify-email?token=${verificationToken}`;
  const universalLink = `${emailConfig.baseUrl}/auth/verify?token=${verificationToken}`; // Opens app if installed

  const html = generateEmailVerificationHTML({
    verificationToken,
    universalLink,
    webLink,
  });

  const text = generateEmailVerificationText({
    verificationToken,
    universalLink,
    webLink,
  });

  return sendEmail({
    to: email,
    subject: '✅ Verify Your Email',
    text,
    html,
  });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(email: string, name: string) {
  const html = generateWelcomeHTML({ name });
  const text = generateWelcomeText({ name });

  return sendEmail({
    to: email,
    subject: '🎉 Welcome!',
    text,
    html,
  });
}

/**
 * Send notification email (for password changes, etc.)
 */
export async function sendNotificationEmail(email: string, title: string, message: string) {
  const html = generateNotificationHTML({ title, message });
  const text = generateNotificationText({ title, message });

  return sendEmail({
    to: email,
    subject: title,
    text,
    html,
  });
}
