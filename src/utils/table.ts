/**
 * Table Utility Functions
 * 
 * Provides reusable functions for creating beautiful console tables
 */

export interface TableData {
  label: string;
  value: string;
}

/**
 * Create a dynamic table with proper formatting
 * 
 * @param title - The title of the table
 * @param data - Array of label-value pairs to display
 * @param minWidth - Minimum width of the table (default: 40)
 * 
 * @example
 * ```ts
 * const data = [
 *   { label: 'Host', value: 'localhost' },
 *   { label: 'Port', value: '3000' }
 * ];
 * createTable('SERVER INFO', data);
 * ```
 */
export function createTable(title: string, data: TableData[], minWidth: number = 70): void {
  // Calculate dynamic width based on content
  const maxLabelLength = Math.max(...data.map(item => item.label.length));
  const maxValueLength = Math.max(...data.map(item => item.value.length));
  
  // Calculate optimal width: label + ": " + value + borders
  const contentWidth = maxLabelLength + maxValueLength + 5; // +5 for ": " and borders
  const finalWidth = Math.max(Math.max(contentWidth, title.length + 2), minWidth);
  
  // Create horizontal line
  const horizontalLine = '─'.repeat(finalWidth - 2);
  const topBorder = `┌${horizontalLine}┐`;
  const bottomBorder = `└${horizontalLine}┘`;
  const separator = `├${horizontalLine}┤`;
  
  // Center the title
  const titlePadding = Math.max(0, finalWidth - title.length - 2);
  const leftPadding = Math.floor(titlePadding / 2);
  const rightPadding = titlePadding - leftPadding;
  const centeredTitle = `│${' '.repeat(leftPadding)}${title}${' '.repeat(rightPadding)}│`;
  
  console.log(topBorder);
  console.log(centeredTitle);
  console.log(separator);
  
  // Add data rows with dynamic padding
  data.forEach(item => {
    const label = item.label.padEnd(maxLabelLength);
    const value = item.value.padEnd(finalWidth - maxLabelLength - 6); // Dynamic padding
    console.log(`│ ${label}: ${value} │`);
  });
  
  console.log(bottomBorder);
  console.log('');
}

/**
 * Create a banner with custom styling
 * 
 * @param text - The text to display in the banner
 * @param width - Width of the banner (default: 60)
 * 
 * @example
 * ```ts
 * createBanner('🚀 SERVER STARTED SUCCESSFULLY!');
 * ```
 */
export function createBanner(text: string, width: number = 70): void {
  const horizontalLine = '═'.repeat(width - 2);
  const topBorder = `╔${horizontalLine}╗`;
  const bottomBorder = `╚${horizontalLine}╝`;
  
  // Center the text
  const textPadding = Math.max(0, width - text.length - 2);
  const leftPadding = Math.floor(textPadding / 2);
  const rightPadding = textPadding - leftPadding;
  const centeredText = `║${' '.repeat(leftPadding)}${text}${' '.repeat(rightPadding)}║`;
  
  console.log(topBorder);
  console.log(centeredText);
  console.log(bottomBorder);
  console.log('');
}

/**
 * Create a simple info box
 * 
 * @param title - The title of the info box
 * @param content - Array of content lines
 * @param minWidth - Minimum width of the box (default: 40)
 * 
 * @example
 * ```ts
 * createInfoBox('STATUS', ['Server is running', 'Database connected']);
 * ```
 */
export function createInfoBox(title: string, content: string[], minWidth: number = 40): void {
  const maxContentLength = Math.max(...content.map(line => line.length));
  const boxWidth = Math.max(title.length + 2, maxContentLength + 4, minWidth);
  
  const horizontalLine = '─'.repeat(boxWidth - 2);
  const topBorder = `┌${horizontalLine}┐`;
  const bottomBorder = `└${horizontalLine}┘`;
  const separator = `├${horizontalLine}┤`;
  
  // Center the title
  const titlePadding = Math.max(0, boxWidth - title.length - 2);
  const leftPadding = Math.floor(titlePadding / 2);
  const rightPadding = titlePadding - leftPadding;
  const centeredTitle = `│${' '.repeat(leftPadding)}${title}${' '.repeat(rightPadding)}│`;
  
  console.log(topBorder);
  console.log(centeredTitle);
  console.log(separator);
  
  // Add content lines
  content.forEach(line => {
    const paddedLine = line.padEnd(boxWidth - 4);
    console.log(`│ ${paddedLine} │`);
  });
  
  console.log(bottomBorder);
  console.log('');
}

/**
 * Create a progress bar
 * 
 * @param current - Current progress value
 * @param total - Total value
 * @param width - Width of the progress bar (default: 30)
 * @param label - Optional label for the progress bar
 * 
 * @example
 * ```ts
 * createProgressBar(75, 100, 30, 'Loading');
 * ```
 */
export function createProgressBar(current: number, total: number, width: number = 30, label?: string): void {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));
  const filledWidth = Math.floor((percentage / 100) * width);
  const emptyWidth = width - filledWidth;
  
  const filled = '█'.repeat(filledWidth);
  const empty = '░'.repeat(emptyWidth);
  
  const progressBar = `[${filled}${empty}] ${percentage.toFixed(1)}%`;
  
  if (label) {
    console.log(`${label}: ${progressBar}`);
  } else {
    console.log(progressBar);
  }
}
