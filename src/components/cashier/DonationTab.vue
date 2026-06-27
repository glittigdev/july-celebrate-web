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
      <v-btn type="submit" color="primary" class="mt-4" :disabled="cardError || depositTypeError">
        Doar
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

interface ApiResponse {
  data: {
    status: number
    debugMessage: string
    message: string
    data: {
      message: string
    }
  }
}

// Campos individuais com useField (acesso à meta e mensagens)
const { value: card, errorMessage: cardError, meta: cardMeta } = useField('card')
const { errorMessage: depositTypeError } = useField('depositType')

const vincularCartao = handleSubmit(async (formData) => {
  loading.value = true

  await axios
    .post('https://d30higmhmidzsx.cloudfront.net/cashier/donation', {
      ...formData,
    })
    .then((response: ApiResponse) => {
      if (response.data.status === 201) {
        returnMessage.value = response.data.data.message
        mensagemTipo.value = 'success'
      } else {
        returnMessage.value = response.data.data.message
        mensagemTipo.value = 'error'
      }

      loading.value = false

      setTimeout(() => {
        returnMessage.value = ''
        mensagemTipo.value = ''
      }, 5000)
    })
    .catch((err) => {
      console.log('donation:', err)
      loading.value = false
      returnMessage.value = 'Cartão com problema, víncule outro e busque suporte'
      mensagemTipo.value = 'error'

      setTimeout(() => {
        returnMessage.value = ''
        mensagemTipo.value = ''
      }, 5000)
    })
  resetForm()
})
</script>
