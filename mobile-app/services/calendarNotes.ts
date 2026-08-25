import AsyncStorage from "@react-native-async-storage/async-storage";

export const CALENDAR_NOTES_STORAGE_KEY = "calendarNotes";

export interface CalendarNote {
  id: string;
  date: string;
  note: string;
  symptoms: string[];
  emoji: string;
}

let notesWriteQueue: Promise<void> = Promise.resolve();

function normalizeCalendarNote(value: unknown): CalendarNote | null {
  if (!value || typeof value !== "object") return null;

  const note = value as Partial<CalendarNote>;
  if (
    typeof note.id !== "string" ||
    typeof note.date !== "string" ||
    typeof note.note !== "string" ||
    note.note.trim().length === 0
  ) {
    return null;
  }

  return {
    id: note.id,
    date: note.date,
    note: note.note,
    symptoms: Array.isArray(note.symptoms)
      ? note.symptoms.filter((symptom): symptom is string => typeof symptom === "string")
      : [],
    emoji: typeof note.emoji === "string" && note.emoji ? note.emoji : "📝",
  };
}

export async function loadCalendarNotes(): Promise<CalendarNote[]> {
  const stored = await AsyncStorage.getItem(CALENDAR_NOTES_STORAGE_KEY);
  if (!stored) return [];

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map(normalizeCalendarNote)
    .filter((note): note is CalendarNote => note !== null);
}

export async function saveCalendarNotes(notes: CalendarNote[]): Promise<void> {
  const serialized = JSON.stringify(notes);
  const write = notesWriteQueue.then(() =>
    AsyncStorage.setItem(CALENDAR_NOTES_STORAGE_KEY, serialized)
  );
  notesWriteQueue = write.catch(() => undefined);
  await write;
}
