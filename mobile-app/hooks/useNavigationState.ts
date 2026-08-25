/**
 * Mantido temporariamente para compatibilidade com as telas existentes.
 * A antiga chave `currentScreen` era somente escrita e nunca restaurada,
 * portanto a persistência sem consumidor foi removida.
 */
export function useNavigationState(_screenName: string) {
  return;
}
