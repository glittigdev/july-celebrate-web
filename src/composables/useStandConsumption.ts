import { ref, computed, nextTick, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { standApi, type Stand, type Product } from '@/services/api'
import { useCashierForm } from '@/composables/useCashierForm'
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser'

export type ScanState = 'idle' | 'scanning'

class RearCameraUnavailableError extends Error {
  constructor() {
    super('Rear camera unavailable')
    this.name = 'RearCameraUnavailableError'
  }
}

const exactRearCameraConstraints: MediaStreamConstraints = {
  audio: false,
  video: { facingMode: { exact: 'environment' } },
}

const idealRearCameraConstraints: MediaStreamConstraints = {
  audio: false,
  video: { facingMode: { ideal: 'environment' } },
}

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
  let scannerSessionId = 0

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

    stopScanner()
    const sessionId = ++scannerSessionId
    scanState.value = 'scanning'
    hasScanned = false
    stopRequested = false
    await nextTick()

    codeReader = new BrowserQRCodeReader()
    const currentCodeReader = codeReader
    let cameraValidated = false
    const isCancelled = () => stopRequested || sessionId !== scannerSessionId
    const onDecode = (
      result: Parameters<Parameters<typeof currentCodeReader.decodeFromConstraints>[2]>[0],
    ) => {
      if (!cameraValidated || !result || hasScanned || isCancelled()) return
      hasScanned = true
      const rawQrCode = result.getText()
      stopScanner()
      submitSale(rawQrCode)
    }

    try {
      let controls: IScannerControls | null

      try {
        controls = await openRearCamera(
          currentCodeReader,
          exactRearCameraConstraints,
          onDecode,
          isCancelled,
        )
      } catch (error) {
        if (isCancelled() || !supportsIdealFallback(error)) throw error
        stopActiveVideoStream()
        controls = await openRearCamera(
          currentCodeReader,
          idealRearCameraConstraints,
          onDecode,
          isCancelled,
        )
      }

      // stopScanner() may already have run (user closed the dialog) while the
      // camera stream was still being set up — honor that instead of leaving
      // the stream running in the background.
      if (!controls || isCancelled()) return
      scannerControls = controls
      cameraValidated = true
    } catch (error) {
      if (!isCancelled()) {
        stopScanner()
        showAlert(resolveCameraErrorMessage(error), 'error')
      }
    }
  }

  async function openRearCamera(
    reader: InstanceType<typeof BrowserQRCodeReader>,
    constraints: MediaStreamConstraints,
    onDecode: Parameters<typeof reader.decodeFromConstraints>[2],
    isCancelled: () => boolean,
  ): Promise<IScannerControls | null> {
    const controls = await reader.decodeFromConstraints(constraints, videoRef.value!, onDecode)

    if (isCancelled()) {
      controls.stop()
      return null
    }

    const stream = getActiveVideoStream()
    const track = stream?.getVideoTracks()[0]
    if (!track) {
      controls.stop()
      stopActiveVideoStream()
      throw new RearCameraUnavailableError()
    }

    const facingMode = track.getSettings?.().facingMode
    if (facingMode && facingMode !== 'environment') {
      controls.stop()
      stopActiveVideoStream()
      throw new RearCameraUnavailableError()
    }

    return controls
  }

  function getActiveVideoStream(): MediaStream | null {
    const source = videoRef.value?.srcObject
    return source && 'getTracks' in source ? (source as MediaStream) : null
  }

  function stopActiveVideoStream() {
    const stream = getActiveVideoStream()
    stream?.getTracks().forEach((track) => track.stop())
    if (videoRef.value) videoRef.value.srcObject = null
  }

  function supportsIdealFallback(error: unknown): boolean {
    if (error instanceof RearCameraUnavailableError) return true

    const errorName = (error as { name?: string } | null)?.name
    return [
      'OverconstrainedError',
      'ConstraintNotSatisfiedError',
      'NotFoundError',
      'DevicesNotFoundError',
      'NotSupportedError',
      'TypeError',
    ].includes(errorName ?? '')
  }

  function resolveCameraErrorMessage(error: unknown): string {
    if (error instanceof RearCameraUnavailableError) {
      return 'Não foi possível acessar uma câmera traseira.'
    }

    const errorName = (error as { name?: string } | null)?.name
    if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
      return 'Nenhuma câmera encontrada.'
    }

    return 'Erro ao acessar a câmera. Verifique as permissões.'
  }

  function stopScanner() {
    stopRequested = true
    scannerSessionId++
    scannerControls?.stop()
    scannerControls = null
    stopActiveVideoStream()
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
