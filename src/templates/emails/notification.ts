/**
 * Notification Email Template
 */

import { commonStyles } from './styles';

interface NotificationData {
  title: string;
  message: string;
}

export function generateNotificationHTML(data: NotificationData): string {
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
          <h2>${data.title}</h2>
        </div>
        <div class="content">
          <div class="alert">
            ${data.message}
          </div>
        </div>
        <div class="footer">
          <p>If you didn't perform this action, please contact support immediately.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateNotificationText(data: NotificationData): string {
  return `
${data.title}

${data.message}

If you didn't perform this action, please contact support immediately.
  `;
}

