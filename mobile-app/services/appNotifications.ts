import { Content } from "./api";
import {
  compareLocalDates,
  CyclePrediction,
  daysBetween,
  formatShortDate,
  toLocalDate,
} from "./menstrualCycle";
import { NotificationPreferences } from "./notificationPreferences";
import { Reminder, reminderToDate, sortRemindersChronologically } from "./reminders";

export type AppNotificationSource = "reminder" | "cycle" | "content";

export interface AppNotificationItem {
  id: string;
  title: string;
  description: string;
  context: string;
  icon: string;
  source: AppNotificationSource;
  href:
    | "/user/reminders"
    | "/user/calendar"
    | "/user/content-detail";
  params?: { id: string };
  sortTimestamp: number;
}

type PredictionForNotifications = CyclePrediction & {
  /** Presente apenas nas previsões do motor V2; ausente nas do motor legado. */
  predictionAvailable?: boolean;
};

interface BuildAppNotificationsInput {
  reminders: Reminder[];
  prediction: PredictionForNotifications | null;
  contents: Content[];
  preferences: NotificationPreferences;
  now?: Date;
}

const REPEAT_LABELS: Record<Reminder["repeat"], string> = {
  none: "Sem repetição",
  daily: "Repete diariamente",
  weekly: "Repete semanalmente",
  monthly: "Repete mensalmente",
  yearly: "Repete anualmente",
};

function buildReminderItems(reminders: Reminder[], now: Date) {
  const nowTimestamp = now.getTime();

  return sortRemindersChronologically(reminders)
    .filter(
      (reminder) =>
        reminder.repeat !== "none" ||
        reminderToDate(reminder).getTime() > nowTimestamp,
    )
    .slice(0, 10)
    .map<AppNotificationItem>((reminder) => {
      const date = reminderToDate(reminder);
      const formattedDate = date.toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const formattedTime = date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return {
        id: `reminder:${reminder.id}:${reminder.updatedAt}`,
        title: reminder.title,
        description: `${formattedDate} às ${formattedTime}${
          reminder.notes ? ` • ${reminder.notes}` : ""
        }`,
        context: REPEAT_LABELS[reminder.repeat],
        icon: reminder.emoji,
        source: "reminder",
        href: "/user/reminders",
        sortTimestamp: date.getTime(),
      };
    });
}

function buildCycleItem(
  prediction: PredictionForNotifications | null,
  now: Date,
): AppNotificationItem[] {
  if (!prediction || prediction.predictionAvailable === false) {
    return [];
  }

  const today = toLocalDate(now);
  const daysUntilPrediction = daysBetween(today, prediction.startDate);
  const isOverdue = compareLocalDates(today, prediction.endDate) > 0;
  const description = isOverdue
    ? `A previsão de ${formatShortDate(
        prediction.startDate,
      )} não foi confirmada. Atualize o calendário.`
    : daysUntilPrediction === 0
      ? `O próximo período está previsto para hoje (${formatShortDate(
          prediction.startDate,
        )}).`
      : daysUntilPrediction < 0
        ? `Período previsto em andamento desde ${formatShortDate(
            prediction.startDate,
          )}.`
        : `Previsão para ${formatShortDate(prediction.startDate)}, em ${
            daysUntilPrediction
          } ${daysUntilPrediction === 1 ? "dia" : "dias"}.`;

  return [
    {
      id: `cycle:${prediction.startDate}:${prediction.endDate}`,
      title: "Previsão do próximo ciclo",
      description,
      context: "Estimativa baseada nos registros locais",
      icon: "🌸",
      source: "cycle",
      href: "/user/calendar",
      sortTimestamp: Date.parse(`${prediction.startDate}T12:00:00`),
    },
  ];
}

function buildContentItem(contents: Content[]): AppNotificationItem[] {
  const latestContent = [...contents].sort((first, second) => {
    const firstTimestamp = Date.parse(first.updated_at) || 0;
    const secondTimestamp = Date.parse(second.updated_at) || 0;
    return secondTimestamp - firstTimestamp || second.id - first.id;
  })[0];

  if (!latestContent) {
    return [];
  }

  return [
    {
      id: `content:${latestContent.id}:${latestContent.updated_at}`,
      title: "Conteúdo publicado",
      description: latestContent.title,
      context: `${latestContent.reading_time} min de leitura`,
      icon: "📚",
      source: "content",
      href: "/user/content-detail",
      params: { id: String(latestContent.id) },
      sortTimestamp: Date.parse(latestContent.updated_at) || 0,
    },
  ];
}

export function buildAppNotifications({
  reminders,
  prediction,
  contents,
  preferences,
  now = new Date(),
}: BuildAppNotificationsInput) {
  const items = [
    ...(preferences.appointmentReminders
      ? buildReminderItems(reminders, now)
      : []),
    ...(preferences.cyclePredictions ? buildCycleItem(prediction, now) : []),
    ...(preferences.contentUpdates ? buildContentItem(contents) : []),
  ];

  return items;
}

