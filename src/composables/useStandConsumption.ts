import { ref, computed, nextTick, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { standApi, type Stand, type Product } from '@/services/api'
import { useCashierForm } from '@/composables/useCashierForm'
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser'

export type ScanState = 'idle' | 'scanning'

export function useStandConsumption() {
  const route = useRoute()

  const stand = ref<Stand | null>(null)
  const products = ref<Product[]>([])
  const loadError = ref('')
  const loadingPage = ref(true)

  const productId = ref('')
  const quantidade = ref(1)

  const scanState = ref<ScanState>('idle')
  const videoRef = ref<HTMLVideoElement | null>(null)
  let codeReader: InstanceType<typeof BrowserQRCodeReader> | null = null
  let scannerControls: IScannerControls | null = null
  let hasScanned = false
  let stopRequested = false

  const { loading, alertMessage, alertType, showAlert, clearAlert } = useCashierForm()

  const standId = computed(() => route.params.id as string)

  const selectedProduct = computed(() =>
    products.value.find((p) => p._id === productId.value) ?? null,
  )

  const total = computed(() =>
    selectedProduct.value ? selectedProduct.value.value * quantidade.value : 0,
  )

  const formattedTotal = computed(() => total.value.toFixed(2).replace('.', ','))

  const isFormValid = computed(
    () => productId.value !== '' && quantidade.value >= 1,
  )

  async function loadStand() {
    loadingPage.value = true
    loadError.value = ''
    try {
      const standsRes = await standApi.getStands()
      const allStands: Stand[] = standsRes.data?.stand ?? []
      const found = allStands.find((s) => s._id === standId.value)
      if (!found) {
        loadError.value = 'Barraca não encontrada.'
        return
      }
      stand.value = found

      const prodRes = await standApi.getProducts(standId.value)
      products.value = prodRes.data?.products ?? []
    } catch {
      loadError.value = 'Erro de comunicação com o servidor. Tente novamente.'
    } finally {
      loadingPage.value = false
    }
  }

  async function startScanner() {
    if (scanState.value === 'scanning') return

    scanState.value = 'scanning'
    hasScanned = false
    stopRequested = false
    await nextTick()

    codeReader = new BrowserQRCodeReader()
    try {
      const devices = await BrowserQRCodeReader.listVideoInputDevices()
      if (!devices.length) {
        showAlert('Nenhuma câmera encontrada.', 'error')
        scanState.value = 'idle'
        return
      }
      const deviceId =
        devices.find((d) => /back|rear|environment/i.test(d.label))?.deviceId ??
        devices[0].deviceId

      const controls = await codeReader.decodeFromVideoDevice(deviceId, videoRef.value!, (result) => {
        if (!result || hasScanned) return
        hasScanned = true
        const rawQrCode = result.getText()
        stopScanner()
        submitSale(rawQrCode)
      })

      // stopScanner() may already have run (user closed the dialog) while the
      // camera stream was still being set up — honor that instead of leaving
      // the stream running in the background.
      if (stopRequested) {
        controls.stop()
        return
      }
      scannerControls = controls
    } catch {
      if (!stopRequested) {
        showAlert('Erro ao acessar a câmera. Verifique as permissões.', 'error')
      }
      scanState.value = 'idle'
    }
  }

  function stopScanner() {
    stopRequested = true
    scannerControls?.stop()
    scannerControls = null
    codeReader = null
    scanState.value = 'idle'
  }

  async function submitSale(rawQrCode: string) {
    let codigoCartao = ''
    try {
      const url = new URL(rawQrCode)
      codigoCartao = url.searchParams.get('id') ?? ''
    } catch {
      codigoCartao = rawQrCode.trim()
    }

    if (!codigoCartao) {
      showAlert('QR Code inválido. Tente novamente.', 'error')
      return
    }

    loading.value = true
    clearAlert()
    try {
      const response = await standApi.registerConsumo({
        produtoId: productId.value,
        quantidade: quantidade.value,
        valorTotal: total.value,
        codigoCartao,
        barracaId: standId.value,
      })

      const status = response.data.status
      const msg = response.data.data?.message ?? response.data.message ?? ''

      if (status === 201) {
        showAlert(msg || 'Consumo registrado com sucesso!', 'success')
        productId.value = ''
        quantidade.value = 1
      } else {
        showAlert(resolveErrorMessage(msg), 'error')
      }
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { data?: { message?: string }; message?: string } } }
      const rawMsg = errObj?.response?.data?.data?.message ?? errObj?.response?.data?.message ?? ''
      showAlert(resolveErrorMessage(rawMsg), 'error')
    } finally {
      loading.value = false
    }
  }

  function resolveErrorMessage(raw: string): string {
    const lower = raw.toLowerCase()
    if (lower.includes('cartao') || lower.includes('cartão') || lower.includes('card') || lower.includes('not found')) {
      return 'Cartão não encontrado. Verifique o QR code.'
    }
    if (lower.includes('saldo') || lower.includes('balance') || lower.includes('insufficient')) {
      return 'Saldo insuficiente para esta compra.'
    }
    if (lower.includes('produto') || lower.includes('product') || lower.includes('unavailable')) {
      return 'Produto indisponível no momento.'
    }
    if (!raw) return 'Erro de comunicação com o servidor. Tente novamente.'
    return raw
  }

  function increment() {
    quantidade.value++
  }

  function decrement() {
    if (quantidade.value > 1) quantidade.value--
  }

  function onProductChange() {
    quantidade.value = 1
  }

  onUnmounted(stopScanner)

  return {
    stand,
    products,
    loadError,
    loadingPage,
    productId,
    quantidade,
    scanState,
    videoRef,
    loading,
    alertMessage,
    alertType,
    selectedProduct,
    total,
    formattedTotal,
    isFormValid,
    loadStand,
    startScanner,
    stopScanner,
    increment,
    decrement,
    onProductChange,
  }
}
