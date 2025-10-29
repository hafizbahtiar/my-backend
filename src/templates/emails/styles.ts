/**
 * Common Email Styles
 */

export const commonStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    line-height: 1.6;
    background-color: #f5f5f5;
  }
  
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .header {
    text-align: center;
    padding: 20px 0;
    border-bottom: 1px solid #eee;
  }
  
  .header h2 {
    margin: 0;
  }
  
  .content {
    padding: 20px 0;
  }
  
  .button-container {
    text-align: center;
    margin: 30px 0;
  }
  
  .button {
    display: inline-block;
    padding: 14px 28px;
    background-color: #007bff;
    color: white !important;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);
  }
  
  .button-primary {
    background-color: #007bff;
  }
  
  .button-success {
    background-color: #28a745;
    box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
  }
  
  .token-box {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 15px;
    margin: 20px 0;
    word-break: break-all;
    font-family: 'Courier New', monospace;
    font-size: 12px;
  }
  
  .mobile-instructions {
    background-color: #fff3cd;
    border-left: 4px solid #ffc107;
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
  }
  
  .footer {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #eee;
    font-size: 12px;
    color: #666;
    text-align: center;
  }
  
  .expiry {
    color: #dc3545;
    font-weight: 600;
  }
  
  .alert {
    padding: 15px;
    background-color: #f8f9fa;
    border-left: 4px solid #007bff;
    border-radius: 4px;
  }
`;

