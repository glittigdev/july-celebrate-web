import { ref } from 'vue'
import type { CardData, TransactionItem } from '@/services/api'
import { cardApi } from '@/services/api'

export function useCardInfo() {
  const card = ref<CardData | null>(null)
  const transactions = ref<TransactionItem[]>([])
  const loadError = ref('')
  const loadingPage = ref(false)

  async function loadCard(id: string) {
    loadingPage.value = true
    loadError.value = ''
    try {
      const response = await cardApi.getCardInfo(id)
      if (response.data.status === 200) {
        card.value = response.data.data.card
        transactions.value = response.data.data.transactions
      } else {
        loadError.value = 'Cartão não encontrado.'
      }
    } catch {
      loadError.value = 'Cartão não encontrado.'
    } finally {
      loadingPage.value = false
    }
  }

  return { card, transactions, loadError, loadingPage, loadCard }
}
