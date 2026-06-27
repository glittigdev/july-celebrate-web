<template>
  <v-container fluid class="d-flex justify-center align-center">
    <v-card class="w-200" min-width="300" max-width="500">
      <v-card-title v-if="cardData" class="pb-5 px-0">
        <v-row no-gutters>
          <v-col cols="12">
            <v-alert
              type="info"
              border="start"
              compact
              class="pa-4 text-left"
              style="--v-alert-prepend-width: 0px"
            >
              <div class="text-h6 font-weight-bold mb-2">Olá, {{ cardData.card.person }}!</div>
              <div class="text-body-2">
                <strong>Saldo disponível:</strong> R$ {{ cardData.card.value_available.toFixed(2)
                }}<br /><br />
                <strong>Obrigado por está aqui!!!</strong><br />
              </div>
            </v-alert>
          </v-col>
        </v-row>
      </v-card-title>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'
import { useRoute } from 'vue-router'

const route = useRoute()

const returnMessage = ref('')
const mensagemTipo = ref('')
const loading = ref(false)

const cardId = ref('')
const cardData = ref(null)

const standId = ref('')
const standData = ref([])

const productId = ref('')
const productData = ref([])

const quantidade = ref(1)

const produtoInfo = computed(() =>
  productData?.value?.products?.find((p) => p._id === productId.value),
)

const total = computed(() => {
  return produtoInfo.value ? produtoInfo.value.value * quantidade.value : 0
})

function onProdutoChange() {
  quantidade.value = 1
}

function alterarQuantidade(delta) {
  const novaQtd = quantidade.value + delta
  quantidade.value = novaQtd < 1 ? 1 : novaQtd
}

const schema = yup.object({
  password: yup.string().required('Número do cartão é obrigatório'),
  standId: yup.string().required('Nome é obrigatório'),
  productId: yup.string().required('Nome é obrigatório'),
  value: yup
    .number()
    .typeError('Informe um valor válido')
    .moreThan(0, 'Valor deve ser maior que 0')
    .required('Valor é obrigatório'),
  qtd: yup
    .number()
    .typeError('Informe um valor válido')
    .moreThan(0, 'Valor deve ser maior que 0')
    .required('Valor é obrigatório'),
})

const { handleSubmit, resetForm } = useForm({
  // validationSchema: schema,
  initialValues: {
    password: '',
    standId: '',
    productId: '',
    value: 0,
    qtd: 0,
  },
})

// Campos individuais com useField (acesso à meta e mensagens)
const { value: password, errorMessage: cardError, meta: cardMeta } = useField('password')

onMounted(async () => {
  getUserInformation()
  getStandInformation()
})

async function getUserInformation() {
  const id = route.query.id as string
  if (!id) return

  cardId.value = id
  try {
    const response = await axios.get(`http://localhost:3000/stand/sale?id=${id}`)
    cardData.value = response.data
    // Você pode usar standData.value para preencher ou exibir algo, se necessário
  } catch (error) {
    console.error('Erro ao buscar dados da venda:', error)
  }
}

async function getStandInformation() {
  try {
    const response = await axios.get(`http://localhost:3000/stand/info`)
    standData.value = response.data
    // Você pode usar standData.value para preencher ou exibir algo, se necessário
  } catch (error) {
    console.error('Erro ao buscar stand da venda:', error)
  }
}

async function getProuctInformation(value) {
  productData.value = []
  console.log(value)
  try {
    const response = await axios.get(`http://localhost:3000/product/info?id=${standId.value}`)
    productData.value = response.data
    // Você pode usar standData.value para preencher ou exibir algo, se necessário
  } catch (error) {
    console.error('Erro ao buscar stand da venda:', error)
  }
}

const registerSelling = handleSubmit(async (formData) => {
  loading.value = true

  await axios
    .post(`http://localhost:3000/stand/sale?id=${cardId.value}`, {
      code: formData.password,
      product: productId.value,
      qtd: quantidade.value,
      value: total.value,
    })
    .then((response) => {
      console.log(response)
      returnMessage.value = `Venda realizada com sucesso, 
      novo saldo: ${response.data.card.value_available}`
      mensagemTipo.value = 'success'
    })
    .catch((err) => {
      console.log(err)
    })
  loading.value = false

  resetForm()
})
</script>
