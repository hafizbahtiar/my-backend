/**
 * Welcome Email Template
 */

import { commonStyles } from './styles';

interface WelcomeData {
  name: string;
}

export function generateWelcomeHTML(data: WelcomeData): string {
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
          <h2>🎉 Welcome, ${data.name}!</h2>
        </div>
        <div class="content">
          <p>Thank you for joining us. We're excited to have you!</p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
        </div>
        <div class="footer">
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateWelcomeText(data: WelcomeData): string {
  return `
🎉 Welcome, ${data.name}!

Thank you for joining us. We're excited to have you!

If you have any questions, feel free to reach out to our support team.
  `;
}

