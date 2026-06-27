<template>
  <div class="tab-content">
    <!-- Alerta de feedback -->
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

    <!-- Loading overlay -->
    <div v-if="loading" class="loading-overlay">
      <v-progress-circular indeterminate color="primary" size="52" width="4" />
      <p class="mt-3 text-body-2 text-medium-emphasis">Processando...</p>
    </div>

    <v-form v-else @submit.prevent="submitForm">
      <!-- Card número -->
      <div class="field-group">
        <v-text-field
          v-model="card"
          label="Número do Cartão"
          prepend-inner-icon="mdi-card-account-details"
          :error-messages="cardMeta.touched ? cardError : ''"
          variant="outlined"
          rounded="lg"
          color="primary"
          placeholder="Ex: 00123"
          required
        />
      </div>

      <!-- Nome do cliente -->
      <div class="field-group">
        <v-text-field
          v-model="name"
          label="Nome do Cliente"
          prepend-inner-icon="mdi-account"
          :error-messages="nameMeta.touched ? nameError : ''"
          variant="outlined"
          rounded="lg"
          color="primary"
          placeholder="Nome completo"
          required
        />
      </div>

      <!-- Valor + tipo de depósito lado a lado -->
      <v-row dense>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model.number="valueField"
            label="Valor Inicial (R$)"
            prepend-inner-icon="mdi-currency-brl"
            type="number"
            min="0"
            step="0.01"
            :error-messages="valueMeta.touched ? valueError : ''"
            variant="outlined"
            rounded="lg"
            color="primary"
            required
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-model="depositType"
            :items="paymentMethods"
            item-title="label"
            item-value="value"
            label="Forma de Pagamento"
            prepend-inner-icon="mdi-cash-multiple"
            :error-messages="depositTypeMeta.touched ? depositTypeError : ''"
            variant="outlined"
            rounded="lg"
            color="primary"
            required
          />
        </v-col>
      </v-row>

      <!-- Visitante -->
      <v-switch
        v-model="visitor"
        label="Visitante (não é da comunidade)"
        color="primary"
        hide-details
        class="mb-4"
      />

      <!-- Botão -->
      <v-btn
        type="submit"
        color="primary"
        size="large"
        block
        rounded="lg"
        :disabled="!!(cardError || nameError || valueError || depositTypeError)"
        class="submit-btn"
        prepend-icon="mdi-link-variant"
      >
        Vincular Cartão
      </v-btn>
    </v-form>
  </div>
</template>

<script lang="ts" setup>
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'
import { useCashierForm } from '@/composables/useCashierForm'
import { cashierApi } from '@/services/api'

const { loading, alertMessage, alertType, showAlert } = useCashierForm()

const paymentMethods = [
  { label: 'PIX', value: 'PIX' },
  { label: 'Dinheiro', value: 'DINHEIRO' },
  { label: 'Débito', value: 'DEBITO' },
  { label: 'Crédito', value: 'CREDITO' },
]

const schema = yup.object({
  card: yup.string().required('Número do cartão é obrigatório'),
  name: yup.string().required('Nome é obrigatório'),
  value: yup
    .number()
    .typeError('Informe um valor válido')
    .moreThan(0, 'Valor deve ser maior que zero')
    .required('Valor é obrigatório'),
  depositType: yup.string().required('Forma de pagamento é obrigatória'),
  visitor: yup.boolean(),
})

const { handleSubmit, resetForm } = useForm({
  validationSchema: schema,
  initialValues: { card: '', name: '', value: 0, depositType: 'PIX', visitor: false },
})

const { value: card, errorMessage: cardError, meta: cardMeta } = useField<string>('card')
const { value: name, errorMessage: nameError, meta: nameMeta } = useField<string>('name')
const { value: valueField, errorMessage: valueError, meta: valueMeta } = useField<number>('value')
const {
  value: depositType,
  errorMessage: depositTypeError,
  meta: depositTypeMeta,
} = useField<string>('depositType')
const { value: visitor } = useField<boolean>('visitor')

const submitForm = handleSubmit(async (formData) => {
  loading.value = true
  try {
    const response = await cashierApi.linkCard(formData as any)
    const status = response.data.status
    const msg = response.data.data?.message ?? response.data.message ?? ''
    showAlert(msg, status === 201 ? 'success' : 'error')
    if (status === 201) resetForm()
  } catch (err: any) {
    const msg = err?.response?.data?.data?.message ?? 'Erro ao vincular o cartão. Tente novamente.'
    showAlert(msg, 'error')
  } finally {
    loading.value = false
  }
})
</script>
