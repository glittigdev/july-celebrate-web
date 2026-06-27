<template>
  <v-container fluid class="stand-container">
    <div class="festive-bg" aria-hidden="true" />

    <div class="stand-wrapper">
      <!-- Header -->
      <div class="stand-header mb-6">
        <div class="header-icon">
          <v-icon size="36" color="white">mdi-store</v-icon>
        </div>
        <div>
          <h1 class="stand-title">{{ stand?.name ?? (loadError ? 'Barraca' : 'Carregando...') }}</h1>
          <p class="stand-subtitle">Registro de Consumo</p>
        </div>
      </div>

      <!-- Erro de página (barraca não encontrada) -->
      <v-alert
        v-if="loadError"
        type="error"
        rounded="xl"
        class="mb-4"
        border="start"
        elevation="2"
        prepend-icon="mdi-store-off"
      >
        <span class="font-weight-medium">{{ loadError }}</span>
      </v-alert>

      <!-- Carregando página -->
      <v-card v-else-if="loadingPage" class="stand-card" elevation="4" rounded="xl">
        <div class="loading-overlay py-12">
          <v-progress-circular indeterminate color="primary" size="52" width="4" />
          <p class="mt-3 text-body-2 text-medium-emphasis">Carregando barraca...</p>
        </div>
      </v-card>

      <!-- Card principal -->
      <v-card v-else class="stand-card" elevation="4" rounded="xl">
        <div class="stand-context-bar">
          <v-icon size="14" class="mr-1">mdi-store</v-icon>
          <span>{{ stand?.name }}</span>
        </div>

        <v-divider />

        <div class="tab-content">
          <!-- Feedback de operação -->
          <v-alert
            v-if="alertMessage"
            :type="alertType"
            class="mb-5 feedback-alert"
            density="compact"
            border="start"
            rounded="lg"
            elevation="1"
          >
            <span class="font-weight-medium">{{ alertMessage }}</span>
          </v-alert>

          <!-- Loading de cobrança -->
          <div v-if="loading" class="loading-overlay">
            <v-progress-circular indeterminate color="primary" size="52" width="4" />
            <p class="mt-3 text-body-2 text-medium-emphasis">Processando cobrança...</p>
          </div>

          <!-- Formulário -->
          <v-form v-else @submit.prevent="onSubmit">
            <div class="field-group">
              <v-text-field
                v-model="senha"
                label="Senha de liberação"
                prepend-inner-icon="mdi-lock-outline"
                type="tel"
                variant="outlined"
                rounded="lg"
                color="primary"
                autocomplete="off"
              />
            </div>

            <div class="field-group">
              <v-select
                v-model="productId"
                :items="products"
                item-title="name"
                item-value="_id"
                label="Produto"
                prepend-inner-icon="mdi-food"
                variant="outlined"
                rounded="lg"
                color="primary"
                no-data-text="Nenhum produto disponível"
                @update:model-value="onProductChange"
              />
            </div>

            <!-- Preço unitário + subtotal -->
            <v-expand-transition>
              <div v-if="selectedProduct" class="subtotal-chip mb-4">
                <span>R$ {{ selectedProduct.value.toFixed(2).replace('.', ',') }} / un</span>
                <span class="subtotal-sep">·</span>
                <span class="subtotal-total">Subtotal: R$ {{ formattedTotal }}</span>
              </div>
            </v-expand-transition>

            <!-- Seletor de quantidade -->
            <v-expand-transition>
              <div v-if="productId" class="qty-row mb-4">
                <span class="qty-label">Quantidade</span>
                <QuantitySelector v-model="quantidade" :min="1" :disabled="loading" />
              </div>
            </v-expand-transition>

            <!-- Card de total -->
            <v-expand-transition>
              <v-card
                v-if="selectedProduct"
                class="total-card mb-5"
                color="surface-variant"
                rounded="lg"
                flat
              >
                <v-card-text class="text-center py-4">
                  <div class="total-label">Total</div>
                  <div class="total-value">R$ {{ formattedTotal }}</div>
                </v-card-text>
              </v-card>
            </v-expand-transition>

            <!-- Botão registrar -->
            <v-btn
              type="submit"
              color="primary"
              size="large"
              block
              rounded="lg"
              class="submit-btn"
              prepend-icon="mdi-qrcode-scan"
              :disabled="!isFormValid"
            >
              Registrar venda
            </v-btn>
          </v-form>
        </div>
      </v-card>

      <div class="stand-footer">
        <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
        Operações processadas em tempo real
      </div>
    </div>

    <!-- Scanner QR Code (fullscreen) -->
    <v-dialog v-model="isScannerOpen" fullscreen persistent>
      <div class="scanner-container">
        <div class="scanner-header">
          <v-btn icon variant="text" color="white" size="small" @click="stopScanner">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <span class="scanner-title">Aponte para o QR Code do cartão</span>
          <div style="width: 40px" />
        </div>

        <video ref="videoRef" autoplay muted playsinline class="scanner-video" />

        <div class="scanner-guide">
          <div class="corner tl" />
          <div class="corner tr" />
          <div class="corner bl" />
          <div class="corner br" />
        </div>

        <div class="scanner-hint">Posicione o QR Code dentro do quadro</div>
      </div>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { useStandConsumption } from '@/composables/useStandConsumption'
import QuantitySelector from '@/components/cashier/QuantitySelector.vue'

const {
  stand,
  products,
  loadError,
  loadingPage,
  senha,
  productId,
  quantidade,
  scanState,
  videoRef,
  loading,
  alertMessage,
  alertType,
  selectedProduct,
  formattedTotal,
  isFormValid,
  loadStand,
  startScanner,
  stopScanner,
  onProductChange,
} = useStandConsumption()

const isScannerOpen = computed(() => scanState.value === 'scanning')

async function onSubmit() {
  if (!isFormValid.value) return
  await startScanner()
}

onMounted(loadStand)
</script>

<style scoped>
.stand-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
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

.stand-wrapper {
  width: 100%;
  max-width: 540px;
  position: relative;
  z-index: 1;
}

.stand-header {
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

.stand-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.stand-subtitle {
  font-size: 0.8rem;
  color: rgba(255, 200, 100, 0.7);
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-top: 2px;
}

.stand-card {
  background: #fff;
  overflow: hidden;
}

.stand-context-bar {
  display: flex;
  align-items: center;
  font-size: 0.73rem;
  padding: 7px 20px;
  font-weight: 500;
  background: rgba(var(--v-theme-primary), 0.07);
  color: rgb(var(--v-theme-primary));
}

.subtotal-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(var(--v-theme-secondary), 0.08);
  border-radius: 8px;
  font-size: 0.85rem;
  color: rgb(var(--v-theme-secondary));
}

.subtotal-sep {
  color: rgba(0, 0, 0, 0.3);
}

.subtotal-total {
  font-weight: 600;
}

.qty-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qty-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.7);
}

.total-card {
  border: 2px solid rgba(var(--v-theme-primary), 0.2) !important;
}

.total-label {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 4px;
}

.total-value {
  font-size: 2rem;
  font-weight: 800;
  color: rgb(var(--v-theme-primary));
  letter-spacing: -0.02em;
}

.stand-footer {
  text-align: center;
  font-size: 0.72rem;
  color: rgba(255, 200, 120, 0.45);
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

/* Scanner */
.scanner-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #000;
  overflow: hidden;
}

.scanner-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent);
}

.scanner-title {
  color: white;
  font-size: 1rem;
  font-weight: 600;
}

.scanner-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scanner-guide {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -55%);
  width: 220px;
  height: 220px;
  pointer-events: none;
}

.corner {
  position: absolute;
  width: 32px;
  height: 32px;
  border-color: rgba(255, 200, 0, 0.9);
  border-style: solid;
}

.corner.tl {
  top: 0;
  left: 0;
  border-width: 3px 0 0 3px;
  border-radius: 4px 0 0 0;
}

.corner.tr {
  top: 0;
  right: 0;
  border-width: 3px 3px 0 0;
  border-radius: 0 4px 0 0;
}

.corner.bl {
  bottom: 0;
  left: 0;
  border-width: 0 0 3px 3px;
  border-radius: 0 0 0 4px;
}

.corner.br {
  bottom: 0;
  right: 0;
  border-width: 0 3px 3px 0;
  border-radius: 0 0 4px 0;
}

.scanner-hint {
  position: absolute;
  bottom: 80px;
  left: 0;
  right: 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  font-weight: 500;
}
</style>
