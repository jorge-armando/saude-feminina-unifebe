import AsyncStorage from "@react-native-async-storage/async-storage";

export const USER_NAME_STORAGE_KEY = "userName";
export const WELCOME_STORAGE_KEY = "hasCompletedWelcome";
export const USER_CREATED_AT_STORAGE_KEY = "userCreatedAt";
export const MAX_USER_NAME_LENGTH = 40;

export interface LocalUserProfile {
  name: string;
  createdAt: string | null;
}

export class UserProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserProfileError";
  }
}

export function normalizeUserName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function validateUserName(value: string) {
  const normalizedName = normalizeUserName(value);

  if (!normalizedName) {
    throw new UserProfileError("Informe como você gostaria de ser chamada.");
  }

  if (normalizedName.length > MAX_USER_NAME_LENGTH) {
    throw new UserProfileError(
      `O nome pode ter no máximo ${MAX_USER_NAME_LENGTH} caracteres.`,
    );
  }

  return normalizedName;
}

function parseCreatedAt(value: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

export async function loadLocalUserProfile(): Promise<LocalUserProfile | null> {
  const entries = await AsyncStorage.multiGet([
    WELCOME_STORAGE_KEY,
    USER_NAME_STORAGE_KEY,
    USER_CREATED_AT_STORAGE_KEY,
  ]);
  const values = Object.fromEntries(entries);
  const name = normalizeUserName(values[USER_NAME_STORAGE_KEY] ?? "");

  if (values[WELCOME_STORAGE_KEY] !== "true" || !name) {
    return null;
  }

  return {
    name: name.slice(0, MAX_USER_NAME_LENGTH),
    createdAt: parseCreatedAt(values[USER_CREATED_AT_STORAGE_KEY]),
  };
}

export async function createLocalUserProfile(
  value: string,
): Promise<LocalUserProfile> {
  const name = validateUserName(value);
  const createdAt = new Date().toISOString();

  await AsyncStorage.multiSet([
    [USER_NAME_STORAGE_KEY, name],
    [USER_CREATED_AT_STORAGE_KEY, createdAt],
    [WELCOME_STORAGE_KEY, "true"],
  ]);

  return { name, createdAt };
}

export async function updateLocalUserName(value: string) {
  const name = validateUserName(value);
  await AsyncStorage.setItem(USER_NAME_STORAGE_KEY, name);
  return name;
}

