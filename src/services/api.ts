import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8080'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
})

export interface ApiEnvelope<T = { message: string }> {
  status: number
  debugMessage?: string
  message?: string
  data: T
}

export interface CardInfo {
  person: string
  value_available: number
  status: string
}

export interface Stand {
  _id: string
  name: string
  active?: boolean
}

export interface Product {
  _id: string
  name: string
  value: number
  available?: boolean
}

// ── Caixa ────────────────────────────────────────────────────────────────────

export const cashierApi = {
  linkCard: (payload: {
    card: string
    name: string
    value: number
    depositType: string
    visitor: boolean
  }) =>
    api.post<ApiEnvelope>('/cashier/link-card', {
      ...payload,
      operationType: 'LINK',
    }),

  recharge: (payload: { card: string; value: number; depositType: string }) =>
    api.post<ApiEnvelope>('/cashier/recharge', payload),

  /**
   * Transferência de saldo entre cartões.
   * Endpoint esperado: POST /cashier/transfer
   * Corpo: { originCard, destinationCard, value }
   */
  transfer: (payload: { originCard: string; destinationCard: string; value: number }) =>
    api.post<ApiEnvelope>('/cashier/transfer', payload),

  /**
   * Consulta saldo de um cartão.
   * Endpoint esperado: GET /cashier/balance?card=XXXXX
   */
  getCardBalance: (card: string) =>
    api.get<{ status: number; data: { card: CardInfo } }>(`/cashier/balance?card=${card}`),

  donation: (payload: { card: string }) => api.post<ApiEnvelope>('/cashier/donation', payload),

  withdrawal: (payload: { card: string }) =>
    api.post<{ message: string; balance: number }>('/cashier/withdrawal', payload),
}

// ── Barraca ───────────────────────────────────────────────────────────────────

export const standApi = {
  getStands: () => api.get<{ stand: Stand[] }>('/stand/info'),

  getProducts: (standId: string) => api.get<{ products: Product[] }>(`/product/info?id=${standId}`),

  registerConsumo: (payload: {
    senha: string
    produtoId: string
    quantidade: number
    valorTotal: number
    codigoCartao: string
    barracaId: string
  }) => api.post<ApiEnvelope<{ message: string; saldoRestante: number }>>('/consumo', payload),
}

export default api
