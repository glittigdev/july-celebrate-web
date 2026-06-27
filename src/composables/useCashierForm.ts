import { ref } from 'vue'

type AlertType = 'success' | 'error' | 'warning' | 'info'

/**
 * Composable reutilizável para formulários do caixa.
 * Centraliza loading, alerta e auto-dismiss.
 */
export function useCashierForm() {
  const loading = ref(false)
  const alertMessage = ref('')
  const alertType = ref<AlertType>('success')
  let dismissTimer: ReturnType<typeof setTimeout> | null = null

  function showAlert(message: string, type: AlertType, durationMs = 6000) {
    if (dismissTimer) clearTimeout(dismissTimer)
    alertMessage.value = message
    alertType.value = type
    dismissTimer = setTimeout(() => {
      alertMessage.value = ''
    }, durationMs)
  }

  function clearAlert() {
    if (dismissTimer) clearTimeout(dismissTimer)
    alertMessage.value = ''
  }

  return { loading, alertMessage, alertType, showAlert, clearAlert }
}
