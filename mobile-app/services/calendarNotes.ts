import AsyncStorage from "@react-native-async-storage/async-storage";

export const CALENDAR_NOTES_STORAGE_KEY = "calendarNotes";

export interface CalendarNote {
  id: string;
  date: string;
  note: string;
  symptoms: string[];
  emoji: string;
}

function isCalendarNote(value: unknown): value is CalendarNote {
  if (!value || typeof value !== "object") return false;

  const note = value as Partial<CalendarNote>;
  return (
    typeof note.id === "string" &&
    typeof note.date === "string" &&
    typeof note.note === "string" &&
    note.note.trim().length > 0 &&
    Array.isArray(note.symptoms) &&
    note.symptoms.every((symptom) => typeof symptom === "string") &&
    typeof note.emoji === "string"
  );
}

export async function loadCalendarNotes(): Promise<CalendarNote[]> {
  const stored = await AsyncStorage.getItem(CALENDAR_NOTES_STORAGE_KEY);
  if (!stored) return [];

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed)) return [];

  return parsed.filter(isCalendarNote);
}

export async function saveCalendarNotes(notes: CalendarNote[]): Promise<void> {
  await AsyncStorage.setItem(CALENDAR_NOTES_STORAGE_KEY, JSON.stringify(notes));
}
