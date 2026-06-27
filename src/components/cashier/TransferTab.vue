<template>
  <div class="tab-content">
    <!-- Feedback alert -->
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

    <!-- Loading -->
    <div v-if="loading" class="loading-overlay">
      <v-progress-circular indeterminate color="warning" size="52" width="4" />
      <p class="mt-3 text-body-2 text-medium-emphasis">Transferindo saldo...</p>
    </div>

    <v-form v-else @submit.prevent="submitTransfer">

      <!-- ── Cartão de Origem ─────────────────────────────────────────── -->
      <div class="transfer-card-block origin-block mb-2">
        <div class="block-label mb-2">
          <v-icon size="18" class="mr-1">mdi-arrow-up-circle</v-icon>
          Cartão de Origem
        </div>

        <v-text-field
          v-model="originCard"
          label="Número do Cartão de Origem"
          prepend-inner-icon="mdi-card-minus"
          :error-messages="originCardMeta.touched ? originCardError : ''"
          variant="outlined"
          rounded="lg"
          color="warning"
          placeholder="Ex: 00123"
          @blur="fetchOriginBalance"
          @keyup.enter.prevent="fetchOriginBalance"
        />

        <!-- Saldo da origem -->
        <v-expand-transition>
          <div v-if="originCardInfo" class="balance-chip origin-balance mb-2">
            <v-icon size="16" class="mr-1">mdi-wallet</v-icon>
            Saldo disponível:
            <strong class="ml-1">R$ {{ originCardInfo.value_available.toFixed(2).replace('.', ',') }}</strong>
            <span class="ml-2 text-caption text-medium-emphasis">· {{ originCardInfo.person }}</span>
          </div>
          <div v-else-if="fetchingOrigin" class="balance-chip loading-balance mb-2">
            <v-progress-circular size="12" width="2" indeterminate color="warning" class="mr-2" />
            Consultando saldo...
          </div>
        </v-expand-transition>
      </div>

      <!-- Ícone de seta -->
      <div class="transfer-arrow mb-2">
        <v-icon size="28" color="primary">mdi-swap-vertical-circle</v-icon>
      </div>

      <!-- ── Cartão de Destino ────────────────────────────────────────── -->
      <div class="transfer-card-block destination-block mb-4">
        <div class="block-label mb-2">
          <v-icon size="18" class="mr-1">mdi-arrow-down-circle</v-icon>
          Cartão de Destino
        </div>

        <v-text-field
          v-model="destinationCard"
          label="Número do Cartão de Destino"
          prepend-inner-icon="mdi-card-plus"
          :error-messages="destinationCardMeta.touched ? destinationCardError : ''"
          variant="outlined"
          rounded="lg"
          color="primary"
          placeholder="Ex: 00456"
          @blur="fetchDestinationBalance"
          @keyup.enter.prevent="fetchDestinationBalance"
        />

        <!-- Saldo do destino -->
        <v-expand-transition>
          <div v-if="destinationCardInfo" class="balance-chip destination-balance mb-2">
            <v-icon size="16" class="mr-1">mdi-wallet</v-icon>
            Saldo atual:
            <strong class="ml-1">R$ {{ destinationCardInfo.value_available.toFixed(2).replace('.', ',') }}</strong>
            <span class="ml-2 text-caption text-medium-emphasis">· {{ destinationCardInfo.person }}</span>
          </div>
          <div v-else-if="fetchingDestination" class="balance-chip loading-balance mb-2">
            <v-progress-circular size="12" width="2" indeterminate color="primary" class="mr-2" />
            Consultando saldo...
          </div>
        </v-expand-transition>
      </div>

      <!-- ── Valor da Transferência ──────────────────────────────────── -->
      <div class="field-group mb-2">
        <v-switch
          v-model="transferAll"
          label="Transferir saldo total"
          color="primary"
          hide-details
          class="mb-3"
          @update:model-value="onTransferAllChange"
        />

        <v-text-field
          v-model.number="transferValue"
          label="Valor a Transferir (R$)"
          prepend-inner-icon="mdi-currency-brl"
          :error-messages="transferValueMeta.touched ? transferValueError : ''"
          type="number"
          min="0.01"
          step="0.01"
          variant="outlined"
          rounded="lg"
          color="primary"
          :disabled="transferAll"
          required
        />
      </div>

      <!-- Prévia pós-transferência -->
      <v-expand-transition>
        <div v-if="showPreview" class="transfer-preview mb-5">
          <div class="preview-title">
            <v-icon size="16" class="mr-1">mdi-eye</v-icon>
            Prévia após transferência
          </div>
          <div class="preview-row">
            <span>Cartão Origem ficará com:</span>
            <strong class="text-error">R$ {{ previewOriginBalance }}</strong>
          </div>
          <div class="preview-row">
            <span>Cartão Destino ficará com:</span>
            <strong class="text-success">R$ {{ previewDestinationBalance }}</strong>
          </div>
        </div>
      </v-expand-transition>

      <!-- Botão -->
      <v-btn
        type="submit"
        color="primary"
        size="large"
        block
        rounded="lg"
        class="submit-btn"
        prepend-icon="mdi-swap-horizontal"
        :disabled="hasFormErrors"
      >
        Confirmar Transferência
      </v-btn>
    </v-form>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'
import { useCashierForm } from '@/composables/useCashierForm'
import { cashierApi, type CardInfo } from '@/services/api'

const { loading, alertMessage, alertType, showAlert } = useCashierForm()

// ── Estado local ─────────────────────────────────────────────────────────────
const originCardInfo = ref<CardInfo | null>(null)
const destinationCardInfo = ref<CardInfo | null>(null)
const fetchingOrigin = ref(false)
const fetchingDestination = ref(false)
const transferAll = ref(false)

// ── Schema de validação ───────────────────────────────────────────────────────
const schema = yup.object({
  originCard: yup.string().required('Cartão de origem é obrigatório'),
  destinationCard: yup
    .string()
    .required('Cartão de destino é obrigatório')
    .test(
      'different-cards',
      'Cartão de destino deve ser diferente do de origem',
      function (value) {
        return value !== this.parent.originCard
      },
    ),
  transferValue: yup
    .number()
    .typeError('Informe um valor válido')
    .moreThan(0, 'Valor deve ser maior que zero')
    .required('Valor é obrigatório')
    .test('max-balance', 'Valor maior que o saldo disponível', function (value) {
      if (!originCardInfo.value) return true // validado pelo API
      return (value ?? 0) <= originCardInfo.value.value_available
    }),
})

const { handleSubmit, resetForm, setFieldValue } = useForm({
  validationSchema: schema,
  initialValues: { originCard: '', destinationCard: '', transferValue: 0 },
})

const {
  value: originCard,
  errorMessage: originCardError,
  meta: originCardMeta,
} = useField<string>('originCard')
const {
  value: destinationCard,
  errorMessage: destinationCardError,
  meta: destinationCardMeta,
} = useField<string>('destinationCard')
const {
  value: transferValue,
  errorMessage: transferValueError,
  meta: transferValueMeta,
} = useField<number>('transferValue')

// ── Computed ──────────────────────────────────────────────────────────────────
const hasFormErrors = computed(() => {
  return !!(originCardError.value || destinationCardError.value || transferValueError.value)
})

const showPreview = computed(() => {
  return (
    originCardInfo.value !== null &&
    destinationCardInfo.value !== null &&
    (transferValue.value ?? 0) > 0
  )
})

const previewOriginBalance = computed(() => {
  if (!originCardInfo.value) return '—'
  const remaining = originCardInfo.value.value_available - (transferValue.value ?? 0)
  return remaining.toFixed(2).replace('.', ',')
})

const previewDestinationBalance = computed(() => {
  if (!destinationCardInfo.value) return '—'
  const newBalance = destinationCardInfo.value.value_available + (transferValue.value ?? 0)
  return newBalance.toFixed(2).replace('.', ',')
})

// ── Busca de saldo ────────────────────────────────────────────────────────────
async function fetchOriginBalance() {
  const cardNum = originCard.value?.trim()
  if (!cardNum) return
  fetchingOrigin.value = true
  originCardInfo.value = null
  try {
    const res = await cashierApi.getCardBalance(cardNum)
    if (res.data?.data?.card) {
      originCardInfo.value = res.data.data.card
    }
  } catch {
    // silencioso — validação de existência fica no backend
  } finally {
    fetchingOrigin.value = false
  }
}

async function fetchDestinationBalance() {
  const cardNum = destinationCard.value?.trim()
  if (!cardNum) return
  fetchingDestination.value = true
  destinationCardInfo.value = null
  try {
    const res = await cashierApi.getCardBalance(cardNum)
    if (res.data?.data?.card) {
      destinationCardInfo.value = res.data.data.card
    }
  } catch {
    // silencioso
  } finally {
    fetchingDestination.value = false
  }
}

// ── "Transferir tudo" ─────────────────────────────────────────────────────────
function onTransferAllChange(val: boolean) {
  if (val && originCardInfo.value) {
    setFieldValue('transferValue', originCardInfo.value.value_available)
  }
}

watch(originCardInfo, (info) => {
  if (transferAll.value && info) {
    setFieldValue('transferValue', info.value_available)
  }
})

// ── Limpar dados ao trocar cartão ─────────────────────────────────────────────
watch(originCard, () => {
  originCardInfo.value = null
  transferAll.value = false
})
watch(destinationCard, () => {
  destinationCardInfo.value = null
})

// ── Submit ─────────────────────────────────────────────────────────────────────
const submitTransfer = handleSubmit(async (formData) => {
  loading.value = true
  try {
    const response = await cashierApi.transfer({
      originCard: formData.originCard,
      destinationCard: formData.destinationCard,
      value: formData.transferValue,
    })

    const status = response.data.status
    const msg = response.data.data?.message ?? response.data.message ?? ''

    if (status === 201) {
      showAlert(msg || 'Transferência realizada com sucesso!', 'success')
      resetForm()
      originCardInfo.value = null
      destinationCardInfo.value = null
      transferAll.value = false
    } else {
      showAlert(msg || 'Não foi possível realizar a transferência.', 'error')
    }
  } catch (err: any) {
    const msg =
      err?.response?.data?.data?.message ??
      err?.response?.data?.message ??
      'Erro ao transferir saldo. Verifique os cartões e tente novamente.'
    showAlert(msg, 'error')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.transfer-card-block {
  border-radius: 12px;
  padding: 16px 16px 8px;
}

.origin-block {
  background: rgba(var(--v-theme-warning), 0.06);
  border: 1px solid rgba(var(--v-theme-warning), 0.25);
}

.destination-block {
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.25);
}

.block-label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(var(--v-theme-on-surface), 0.6);
  display: flex;
  align-items: center;
}

.transfer-arrow {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
}

.balance-chip {
  display: flex;
  align-items: center;
  font-size: 0.82rem;
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(var(--v-theme-surface-variant), 0.5);
  width: fit-content;
}

.origin-balance {
  color: rgb(var(--v-theme-warning));
}

.destination-balance {
  color: rgb(var(--v-theme-primary));
}

.loading-balance {
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.transfer-preview {
  border-radius: 12px;
  padding: 14px 16px;
  background: rgba(var(--v-theme-surface-variant), 0.4);
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.2);
}

.preview-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(var(--v-theme-on-surface), 0.5);
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.88rem;
  padding: 4px 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.preview-row:last-child {
  border-bottom: none;
}
</style>
