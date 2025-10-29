/**
 * Password Reset Email Template
 */

import { commonStyles } from './styles';

interface PasswordResetData {
  resetToken: string;
  universalLink: string;
  webLink: string;
}

export function generatePasswordResetHTML(data: PasswordResetData): string {
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
          <h2>🔐 Password Reset Request</h2>
        </div>
        <div class="content">
          <p>You requested to reset your password. Choose one of the options below:</p>
          
          <div class="button-container">
            <a href="${data.universalLink}" class="button button-primary">Reset Password Now</a>
          </div>
          
          <div class="mobile-instructions">
            <strong>📱 Using Mobile App?</strong>
            <p style="margin: 10px 0 0 0;">Copy the reset code below and paste it in the app:</p>
          </div>
          
          <div class="token-box">
            <strong>Reset Code:</strong><br>
            ${data.resetToken}
          </div>
          
          <p><strong>Web Link:</strong></p>
          <div class="token-box">
            ${data.webLink}
          </div>
          
          <p class="expiry">⏰ This link will expire in <strong>1 hour</strong></p>
        </div>
        
        <div class="footer">
          <p>If you didn't request this, please ignore this email. Your password will not be changed.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generatePasswordResetText(data: PasswordResetData): string {
  return `
🔐 Password Reset Request

You requested to reset your password.

OPTION 1: Click the link below (web):
${data.universalLink}

OPTION 2: Copy the reset code below (mobile app):
${data.resetToken}

OPTION 3: Direct link (web):
${data.webLink}

⏰ IMPORTANT: This will expire in 1 hour.

If you didn't request this, please ignore this email.
  `;
}

