import { Ionicons } from "@expo/vector-icons";
import { ComponentProps, useEffect, useMemo, useRef } from "react";
import {
  AccessibilityInfo,
  findNodeHandle,
  InteractionManager,
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type CalendarTutorialTarget =
  | "intro"
  | "prediction"
  | "calendar"
  | "registration"
  | "history"
  | "privacy";

export interface CalendarTutorialStep {
  target: CalendarTutorialTarget;
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>["name"];
}

export const CALENDAR_TUTORIAL_STEPS: CalendarTutorialStep[] = [
  {
    target: "intro",
    title: "Entenda os nomes",
    description:
      "Período menstrual é o sangramento. O ciclo vai do primeiro dia de uma menstruação ao primeiro dia da próxima.",
    icon: "information-circle-outline",
  },
  {
    target: "prediction",
    title: "Confira a previsão",
    description:
      "Aqui aparece uma estimativa da próxima menstruação. Com um registro, usamos 28 dias; depois, calculamos com seu histórico. No calendário, ela fica em rosa tracejado.",
    icon: "sparkles-outline",
  },
  {
    target: "calendar",
    title: "Use o calendário",
    description:
      "Use as setas destacadas para trocar o mês. Toque no nome do mês ou em Ir para hoje para voltar ao mês atual.",
    icon: "calendar-outline",
  },
  {
    target: "registration",
    title: "Registre um período",
    description:
      "Depois do tutorial, toque no botão destacado. Escolha o primeiro e o último dia, confira as datas e salve. Os dias registrados ficam vermelhos.",
    icon: "add-circle-outline",
  },
  {
    target: "history",
    title: "Veja seu histórico",
    description:
      "Os períodos salvos aparecem aqui. Se uma data estiver errada, exclua e registre novamente.",
    icon: "time-outline",
  },
  {
    target: "privacy",
    title: "Dados no aparelho",
    description:
      "Nesta versão, os registros ficam só neste aparelho. A previsão é apenas uma estimativa.",
    icon: "phone-portrait-outline",
  },
];

interface CalendarTutorialProps {
  visible: boolean;
  stepIndex: number;
  isRegistering: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
  onCardHeightChange: (height: number) => void;
  reduceMotion: boolean;
}

export function CalendarTutorial({
  visible,
  stepIndex,
  isRegistering,
  onPrevious,
  onNext,
  onClose,
  onCardHeightChange,
  reduceMotion,
}: CalendarTutorialProps) {
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const bodyScrollRef = useRef<ScrollView>(null);
  const announcementRef = useRef<View>(null);
  const step = useMemo(() => {
    const selectedStep = CALENDAR_TUTORIAL_STEPS[stepIndex];

    return selectedStep?.target === "registration" && isRegistering
      ? {
          ...selectedStep,
          title: "Conclua o registro",
          description:
            "Seu rascunho está preservado. Ao fechar o tutorial, confira as datas selecionadas e toque em Salvar registro.",
        }
      : selectedStep;
  }, [isRegistering, stepIndex]);
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === CALENDAR_TUTORIAL_STEPS.length - 1;
  const useCompactLayout = fontScale >= 1.4;

  useEffect(() => {
    if (!visible || !step) {
      return;
    }

    bodyScrollRef.current?.scrollTo({ y: 0, animated: false });

    const focusTask = InteractionManager.runAfterInteractions(() => {
      const node = findNodeHandle(announcementRef.current);

      if (node) {
        AccessibilityInfo.setAccessibilityFocus(node);
      }
    });

    return () => focusTask.cancel();
  }, [step, visible]);

  if (!step) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? "none" : "fade"}
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.layer,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <Pressable accessible={false} style={styles.backdrop} />

        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          style={styles.card}
          onLayout={(event: LayoutChangeEvent) =>
            onCardHeightChange(event.nativeEvent.layout.height)
          }
        >
          <View
            style={[
              styles.topRow,
              useCompactLayout && styles.topRowCompact,
            ]}
          >
            <View
              style={[
                styles.stepPill,
                useCompactLayout && styles.stepPillCompact,
              ]}
            >
              <Text style={styles.stepPillText}>
                PASSO {stepIndex + 1} DE {CALENDAR_TUTORIAL_STEPS.length}
              </Text>
            </View>

            <TouchableOpacity
              accessibilityLabel="Pular tutorial"
              accessibilityRole="button"
              hitSlop={10}
              style={[
                styles.closeButton,
                useCompactLayout && styles.closeButtonCompact,
              ]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Pular</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={bodyScrollRef}
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {!useCompactLayout && (
              <View style={styles.targetHint}>
                <Ionicons name="arrow-up" size={15} color="#7e22ce" />
                <Text style={styles.targetHintText}>
                  Observe a área destacada acima
                </Text>
              </View>
            )}

            <View
              ref={announcementRef}
              accessible
              accessibilityLabel={`Passo ${stepIndex + 1} de ${
                CALENDAR_TUTORIAL_STEPS.length
              }. ${step.title}. ${step.description}`}
              accessibilityLiveRegion="polite"
              style={styles.contentRow}
            >
              <View style={styles.iconBox}>
                <Ionicons name={step.icon} size={25} color="#7e22ce" />
              </View>
              <View style={styles.copy}>
                <Text style={styles.title}>{step.title}</Text>
                <Text style={styles.description}>{step.description}</Text>
              </View>
            </View>

            <View style={styles.progressRow} accessible={false}>
              {CALENDAR_TUTORIAL_STEPS.map((tutorialStep, index) => (
                <View
                  key={`${tutorialStep.target}-${index}`}
                  style={[
                    styles.progressDot,
                    index === stepIndex && styles.progressDotActive,
                    index < stepIndex && styles.progressDotCompleted,
                  ]}
                />
              ))}
            </View>
          </ScrollView>

          <View
            style={[
              styles.actions,
              useCompactLayout && styles.actionsCompact,
            ]}
          >
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ disabled: isFirstStep }}
              activeOpacity={0.75}
              disabled={isFirstStep}
              style={[
                styles.previousButton,
                isFirstStep && styles.previousButtonDisabled,
              ]}
              onPress={onPrevious}
            >
              <Ionicons
                name="arrow-back"
                size={17}
                color={isFirstStep ? "#9ca3af" : "#6b21a8"}
              />
              <Text
                style={[
                  styles.previousButtonText,
                  isFirstStep && styles.previousButtonTextDisabled,
                ]}
              >
                Anterior
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityLabel={
                isLastStep ? "Concluir tutorial" : "Próximo passo"
              }
              accessibilityRole="button"
              activeOpacity={0.82}
              style={styles.nextButton}
              onPress={onNext}
            >
              <Text style={styles.nextButtonText}>
                {isLastStep ? "Concluir" : "Próximo"}
              </Text>
              <Ionicons
                name={isLastStep ? "checkmark" : "arrow-forward"}
                size={18}
                color="#ffffff"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  layer: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  backdrop: {
    backgroundColor: "rgba(15, 23, 42, 0.14)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#e9d5ff",
    borderRadius: 28,
    borderWidth: 1,
    elevation: 24,
    maxWidth: 520,
    maxHeight: "60%",
    padding: 18,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.24,
    shadowRadius: 30,
    width: "100%",
    alignSelf: "center",
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  topRowCompact: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 8,
  },
  stepPill: {
    backgroundColor: "#f3e8ff",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepPillCompact: {
    alignSelf: "flex-start",
  },
  stepPillText: {
    color: "#6b21a8",
    flexShrink: 1,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  closeButtonCompact: {
    alignSelf: "flex-end",
  },
  closeButtonText: {
    color: "#4b5563",
    fontSize: 12,
    fontWeight: "800",
  },
  bodyScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  bodyContent: {
    flexGrow: 0,
  },
  targetHint: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#faf5ff",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    marginBottom: 13,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  targetHintText: {
    color: "#7e22ce",
    flex: 1,
    flexShrink: 1,
    fontSize: 10,
    fontWeight: "800",
  },
  contentRow: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  iconBox: {
    alignItems: "center",
    backgroundColor: "#f3e8ff",
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    marginRight: 13,
    width: 52,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 22,
    marginBottom: 6,
  },
  description: {
    color: "#4b5563",
    fontSize: 13,
    lineHeight: 19,
  },
  progressRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginVertical: 17,
  },
  progressDot: {
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  progressDotActive: {
    backgroundColor: "#7e22ce",
    width: 22,
  },
  progressDotCompleted: {
    backgroundColor: "#d8b4fe",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionsCompact: {
    flexDirection: "column",
  },
  previousButton: {
    alignItems: "center",
    backgroundColor: "#faf5ff",
    borderColor: "#e9d5ff",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 50,
  },
  previousButtonDisabled: {
    backgroundColor: "#f9fafb",
    borderColor: "#f3f4f6",
  },
  previousButtonText: {
    color: "#6b21a8",
    fontSize: 14,
    fontWeight: "800",
  },
  previousButtonTextDisabled: {
    color: "#9ca3af",
  },
  nextButton: {
    alignItems: "center",
    backgroundColor: "#7e22ce",
    borderRadius: 16,
    flex: 1.2,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 50,
  },
  nextButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
});
