<template>
  <v-card-text>
    <v-progress-circular v-if="loading" indeterminate color="primary" size="48" class="ma-4" />
    <v-form @submit.prevent="vincularCartao">
      <v-alert
        v-if="returnMessage"
        :type="mensagemTipo"
        class="mb-4"
        density="compact"
        border="start"
      >
        {{ returnMessage }}
      </v-alert>
      <v-text-field
        v-model="card"
        label="Número do Cartão"
        :error-messages="cardMeta.touched ? cardError : ''"
        required
      />
      <v-btn
        type="submit"
        color="primary"
        class="mt-4"
        :disabled="cardError || nameError || valueError || depositTypeError"
      >
        Reembolso
      </v-btn>
    </v-form>
  </v-card-text>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import axios from 'axios'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'

const returnMessage = ref('')
const mensagemTipo = ref('')
const loading = ref(false)

const schema = yup.object({
  card: yup.string().required('Número do cartão é obrigatório'),
})

const { handleSubmit, resetForm } = useForm({
  validationSchema: schema,
  initialValues: {
    card: '',
  },
})

// Campos individuais com useField (acesso à meta e mensagens)
const { value: card, errorMessage: cardError, meta: cardMeta } = useField('card')
const { value: name, errorMessage: nameError, meta: nameMeta } = useField('name')
const { value: valueField, errorMessage: valueError, meta: valueMeta } = useField('value')
const {
  value: depositType,
  errorMessage: depositTypeError,
  meta: depositTypeMeta,
} = useField('depositType')
const { value: visitor } = useField('visitor')

const vincularCartao = handleSubmit(async (formData) => {
  loading.value = true

  await axios
    .post('https://d30higmhmidzsx.cloudfront.net/cashier/withdrawal', {
      ...formData,
    })
    .then((data) => {
      if (data.data.message === 'whithdrawal_success') {
        returnMessage.value = `Reembolso registrado com sucesso! Valor a ser reembolsado: ${data.data.balance}`
        mensagemTipo.value = 'success'

        loading.value = false

        setTimeout(() => {
          ;(returnMessage.value = ''), (mensagemTipo.value = '')
        }, 5000)
      }
    })
    .catch((err) => {
      ;(returnMessage.value = err.response.data.err), (mensagemTipo.value = 'error')

      loading.value = false

      setTimeout(() => {
        ;(returnMessage.value = ''), (mensagemTipo.value = '')
      }, 5000)
    })
  resetForm()
})
</script>
