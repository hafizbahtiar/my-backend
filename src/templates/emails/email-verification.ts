/**
 * Email Verification Email Template
 */

import { commonStyles } from './styles';

interface EmailVerificationData {
  verificationToken: string;
  universalLink: string;
  webLink: string;
}

export function generateEmailVerificationHTML(data: EmailVerificationData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        ${commonStyles}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="color: #28a745;">✅ Verify Your Email</h2>
        </div>
        <div class="content">
          <p>Thank you for signing up! Please verify your email address:</p>
          
          <div class="button-container">
            <a href="${data.universalLink}" class="button button-success">Verify Email Now</a>
          </div>
          
          <div class="mobile-instructions" style="background-color: #d1ecf1; border-left-color: #17a2b8;">
            <strong>📱 Using Mobile App?</strong>
            <p style="margin: 10px 0 0 0;">Copy the verification code below and paste it in the app:</p>
          </div>
          
          <div class="token-box">
            <strong>Verification Code:</strong><br>
            ${data.verificationToken}
          </div>
          
          <p class="expiry">⏰ This will expire in <strong>24 hours</strong></p>
        </div>
        
        <div class="footer">
          <p>If you didn't create an account, please ignore this email.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateEmailVerificationText(data: EmailVerificationData): string {
  return `
✅ Verify Your Email

Thank you for signing up! Please verify your email address:

OPTION 1: Click the link below (web):
${data.universalLink}

OPTION 2: Copy the verification code below (mobile app):
${data.verificationToken}

OPTION 3: Direct link (web):
${data.webLink}

⏰ IMPORTANT: This will expire in 24 hours.

If you didn't create an account, please ignore this email.
  `;
}

