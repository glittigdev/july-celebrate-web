<template>
  <v-container fluid class="card-container">
    <div class="festive-bg" aria-hidden="true" />

    <div class="card-wrapper">
      <!-- Header -->
      <div class="card-header mb-6">
        <div class="header-icon">
          <v-icon size="36" color="white">mdi-credit-card-outline</v-icon>
        </div>
        <div>
          <h1 class="card-title">
            {{ card ? `Cartão #${card.card}` : (loadError ? 'Cartão' : 'Carregando...') }}
          </h1>
          <p class="card-subtitle">Consulta de Saldo</p>
        </div>
      </div>

      <!-- Erro de página -->
      <v-alert
        v-if="loadError"
        type="error"
        rounded="xl"
        class="mb-4"
        border="start"
        elevation="2"
        prepend-icon="mdi-credit-card-off"
      >
        <span class="font-weight-medium">{{ loadError }}</span>
      </v-alert>

      <!-- Carregando -->
      <v-card v-else-if="loadingPage" class="info-card" elevation="4" rounded="xl">
        <div class="loading-overlay py-12">
          <v-progress-circular indeterminate color="primary" size="52" width="4" />
          <p class="mt-3 text-body-2 text-medium-emphasis">Carregando cartão...</p>
        </div>
      </v-card>

      <!-- Card principal -->
      <v-card v-else-if="card" class="info-card" elevation="4" rounded="xl">
        <!-- Context bar -->
        <div class="card-context-bar">
          <v-icon size="14" class="mr-1">mdi-credit-card-outline</v-icon>
          <span>Cartão #{{ card.card }}</span>
          <v-spacer />
          <v-chip
            :color="statusColor"
            size="x-small"
            variant="tonal"
            class="ml-2"
          >
            {{ card.status }}
          </v-chip>
        </div>

        <v-divider />

        <!-- Saldo -->
        <div class="tab-content pb-4">
          <div class="balance-section text-center py-4">
            <p class="balance-label">Saldo disponível</p>
            <p class="balance-value">R$ {{ fmt(card.value_available) }}</p>
            <p class="loaded-label">
              Valor carregado: <strong>R$ {{ fmt(card.total_value) }}</strong>
            </p>
          </div>
        </div>

        <v-divider />

        <!-- Extrato -->
        <div class="tab-content pt-4">
          <p class="extrato-title mb-3">
            <v-icon size="16" class="mr-1">mdi-receipt-text-outline</v-icon>
            Extrato de consumo
          </p>

          <!-- Vazio -->
          <div v-if="transactions.length === 0" class="empty-state">
            <v-icon size="40" color="grey-lighten-1">mdi-receipt-text-remove-outline</v-icon>
            <p class="mt-2 text-body-2 text-medium-emphasis">
              Nenhum consumo realizado até o momento.
            </p>
          </div>

          <!-- Tabela -->
          <div v-else class="table-wrapper">
            <table class="extrato-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Produto</th>
                  <th>Barraca</th>
                  <th class="text-right">Qtd</th>
                  <th class="text-right">Unit.</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tx in transactions" :key="tx._id">
                  <td class="td-date">{{ formatDate(tx.createdAt) }}</td>
                  <td>{{ tx.product?.name ?? '—' }}</td>
                  <td>{{ tx.stand?.name ?? '—' }}</td>
                  <td class="text-right">{{ tx.qtd }}</td>
                  <td class="text-right">R$ {{ fmt(tx.product_value) }}</td>
                  <td class="text-right td-total">R$ {{ fmt(tx.value_total_operation) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </v-card>

      <div class="card-footer">
        <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
        Operações processadas em tempo real
      </div>
    </div>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCardInfo } from '@/composables/useCardInfo'

const route = useRoute()
const { card, transactions, loadError, loadingPage, loadCard } = useCardInfo()

const statusColor = computed(() => {
  if (!card.value) return 'grey'
  const s = card.value.status
  if (s === 'Em uso') return 'success'
  if (s === 'Virgem') return 'warning'
  return 'grey'
})

function fmt(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  const id = route.query.id
  if (!id || typeof id !== 'string') {
    loadError.value = 'ID do cartão não informado.'
    return
  }
  loadCard(id)
})
</script>

<style scoped>
.card-container {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 24px 16px;
  background: linear-gradient(135deg, #1a0a00 0%, #3d1a00 40%, #1a0a00 100%);
}

.festive-bg {
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    -45deg,
    rgba(255, 160, 0, 0.04) 0px,
    rgba(255, 160, 0, 0.04) 2px,
    transparent 2px,
    transparent 24px
  );
  pointer-events: none;
}

.card-wrapper {
  width: 100%;
  max-width: 540px;
  position: relative;
  z-index: 1;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, #e65100, #bf360c);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(230, 81, 0, 0.5);
  flex-shrink: 0;
}

.card-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.card-subtitle {
  font-size: 0.8rem;
  color: rgba(255, 200, 100, 0.7);
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-top: 2px;
}

.info-card {
  background: #fff;
  overflow: hidden;
}

.card-context-bar {
  display: flex;
  align-items: center;
  font-size: 0.73rem;
  padding: 7px 20px;
  font-weight: 500;
  background: rgba(var(--v-theme-primary), 0.07);
  color: rgb(var(--v-theme-primary));
}

/* Saldo */
.balance-section {
  padding: 8px 0;
}

.balance-label {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 6px;
}

.balance-value {
  font-size: 2.8rem;
  font-weight: 800;
  color: rgb(var(--v-theme-primary));
  letter-spacing: -0.03em;
  line-height: 1;
  margin-bottom: 8px;
}

.loaded-label {
  font-size: 0.83rem;
  color: rgba(0, 0, 0, 0.5);
}

/* Extrato */
.extrato-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  color: rgba(0, 0, 0, 0.4);
}

.table-wrapper {
  overflow-x: auto;
}

.extrato-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.extrato-table th {
  padding: 8px 10px;
  text-align: left;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.45);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  white-space: nowrap;
}

.extrato-table td {
  padding: 10px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.75);
}

.extrato-table tr:last-child td {
  border-bottom: none;
}

.td-date {
  white-space: nowrap;
  font-size: 0.76rem;
  color: rgba(0, 0, 0, 0.5);
}

.td-total {
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
}

.text-right {
  text-align: right !important;
}

/* Footer */
.card-footer {
  text-align: center;
  font-size: 0.72rem;
  color: rgba(255, 200, 120, 0.45);
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}
</style>
