import { Thread, Message, Contact } from 'mailspring-exports';

interface ParsedEventData {
  summary: string;
  description?: string;
  attendees: Array<{ email: string }>;
  suggestedDate?: Date;
}

/**
 * Clean up an email subject to use as an event title.
 * Removes common prefixes like Re:, Fwd:, etc.
 */
function cleanSubject(subject: string): string {
  return subject
    .replace(/^(Re|Fwd|Fw|Aw|Wg):\s*/gi, '')
    .replace(/^(Re|Fwd|Fw|Aw|Wg):\s*/gi, '') // Handle double prefixes
    .trim();
}

/**
 * Extract unique email addresses from thread participants.
 */
function extractAttendees(participants: Contact[]): Array<{ email: string }> {
  const seen = new Set<string>();
  const result: Array<{ email: string }> = [];

  for (const p of participants) {
    const email = p.email.toLowerCase();
    if (!seen.has(email)) {
      seen.add(email);
      result.push({ email });
    }
  }

  return result;
}

/**
 * Attempt to extract a date/time from the email subject.
 * Looks for common patterns like "Meeting on Monday", "Call at 3pm", etc.
 */
function extractDateFromSubject(subject: string): Date | undefined {
  const now = new Date();

  // Match patterns like "tomorrow", "today"
  if (/\btomorrow\b/i.test(subject)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d;
  }

  // Match day names
  const dayNames = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
  ];
  for (let i = 0; i < dayNames.length; i++) {
    const regex = new RegExp(`\\b${dayNames[i]}\\b`, 'i');
    if (regex.test(subject)) {
      const d = new Date(now);
      const currentDay = d.getDay();
      let daysUntil = i - currentDay;
      if (daysUntil <= 0) daysUntil += 7;
      d.setDate(d.getDate() + daysUntil);
      d.setHours(9, 0, 0, 0);
      return d;
    }
  }

  // Match time patterns like "at 3pm", "at 14:00"
  const timeMatch = subject.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const ampm = timeMatch[3]?.toLowerCase();

    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;

    const d = new Date(now);
    d.setHours(hours, minutes, 0, 0);
    if (d <= now) d.setDate(d.getDate() + 1);
    return d;
  }

  return undefined;
}

/**
 * Create a short description from the email snippet.
 */
function createDescription(thread: Thread, message?: Message): string {
  const parts: string[] = [];
  parts.push(`Created from email: "${thread.subject}"`);
  if (message?.snippet) {
    const snippet = message.snippet.substring(0, 200);
    parts.push(`\n\n${snippet}${message.snippet.length > 200 ? '...' : ''}`);
  }
  return parts.join('');
}

/**
 * Parse a thread to extract event data for pre-filling the event form.
 */
export function parseThreadForEvent(
  thread: Thread,
  message?: Message
): ParsedEventData {
  const summary = cleanSubject(thread.subject);
  const attendees = extractAttendees(thread.participants);
  const suggestedDate = extractDateFromSubject(thread.subject);
  const description = createDescription(thread, message);

  return {
    summary,
    description,
    attendees,
    suggestedDate,
  };
}
