<template>
  <v-container fluid class="cashier-container">
    <!-- Background decorativo festa junina -->
    <div class="festive-bg" aria-hidden="true" />

    <div class="cashier-wrapper">
      <!-- Header -->
      <div class="cashier-header mb-6">
        <div class="header-icon">
          <v-icon size="36" color="white">mdi-cash-register</v-icon>
        </div>
        <div>
          <h1 class="cashier-title">Caixa</h1>
          <p class="cashier-subtitle">Festa Junina · Gestão de Cartões</p>
        </div>
      </div>

      <!-- Card principal -->
      <v-card class="cashier-card" elevation="4" rounded="xl">
        <!-- Tabs -->
        <v-tabs
          v-model="tab"
          grow
          class="cashier-tabs"
          bg-color="transparent"
          selected-class="tab-active"
          color="primary"
        >
          <v-tab :value="0" class="cashier-tab">
            <v-icon start size="18">mdi-link-variant</v-icon>
            Vínculo
          </v-tab>
          <v-tab :value="1" class="cashier-tab">
            <v-icon start size="18">mdi-battery-charging</v-icon>
            Recarga
          </v-tab>
          <v-tab :value="2" class="cashier-tab">
            <v-icon start size="18">mdi-swap-horizontal</v-icon>
            Transferência
          </v-tab>
        </v-tabs>

        <v-divider />

        <!-- Indicador de contexto da aba -->
        <div class="tab-context-bar" :class="`context-${tab}`">
          <v-icon size="14" class="mr-1">{{ tabContextIcon }}</v-icon>
          <span>{{ tabContextText }}</span>
        </div>

        <!-- Conteúdo das abas -->
        <v-window v-model="tab" class="tab-window">
          <v-window-item :value="0">
            <LinkCardTab />
          </v-window-item>
          <v-window-item :value="1">
            <RechargeTab />
          </v-window-item>
          <v-window-item :value="2">
            <TransferTab />
          </v-window-item>
        </v-window>
      </v-card>

      <!-- Footer info -->
      <div class="cashier-footer">
        <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
        Operações processadas em tempo real
      </div>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import LinkCardTab from '@/components/cashier/LinkCardTab.vue'
import RechargeTab from '@/components/cashier/RechargeTab.vue'
import TransferTab from '@/components/cashier/TransferTab.vue'

const tab = ref(0)

const tabContextIcon = computed(() => {
  const icons = ['mdi-account-plus', 'mdi-wallet-plus', 'mdi-swap-horizontal-bold']
  return icons[tab.value] ?? icons[0]
})

const tabContextText = computed(() => {
  const texts = [
    'Vincule um novo cartão a um cliente e defina o saldo inicial',
    'Adicione saldo a um cartão já existente',
    'Transfira saldo entre dois cartões',
  ]
  return texts[tab.value] ?? texts[0]
})
</script>

<style scoped>
.cashier-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 24px 16px;
  background: linear-gradient(135deg, #1a0a00 0%, #3d1a00 40%, #1a0a00 100%);
}

/* Fundo decorativo com linhas de bandeirinha */
.festive-bg {
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(
      -45deg,
      rgba(255, 160, 0, 0.04) 0px,
      rgba(255, 160, 0, 0.04) 2px,
      transparent 2px,
      transparent 24px
    );
  pointer-events: none;
}

.cashier-wrapper {
  width: 100%;
  max-width: 540px;
  position: relative;
  z-index: 1;
}

/* Header */
.cashier-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, #E65100, #BF360C);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(230, 81, 0, 0.5);
  flex-shrink: 0;
}

.cashier-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.cashier-subtitle {
  font-size: 0.8rem;
  color: rgba(255, 200, 100, 0.7);
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-top: 2px;
}

/* Card */
.cashier-card {
  background: #fff;
  overflow: hidden;
}

/* Tabs */
.cashier-tabs {
  padding-top: 4px;
}

.cashier-tab {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: none;
  min-height: 52px;
}

/* Context bar */
.tab-context-bar {
  display: flex;
  align-items: center;
  font-size: 0.73rem;
  padding: 7px 20px;
  font-weight: 500;
  transition: background 0.3s;
}

.context-0 {
  background: rgba(var(--v-theme-primary), 0.07);
  color: rgb(var(--v-theme-primary));
}
.context-1 {
  background: rgba(var(--v-theme-secondary), 0.09);
  color: rgb(var(--v-theme-secondary));
}
.context-2 {
  background: rgba(var(--v-theme-warning), 0.09);
  color: rgb(var(--v-theme-warning));
}

/* Window */
.tab-window {
  padding: 0;
}

/* Footer */
.cashier-footer {
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
