import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { decodeFromConstraints, showAlert } = vi.hoisted(() => ({
  decodeFromConstraints: vi.fn(),
  showAlert: vi.fn(),
}))

vi.mock('@zxing/browser', () => ({
  BrowserQRCodeReader: class {
    decodeFromConstraints = decodeFromConstraints
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'stand-id' } }),
}))

vi.mock('@/services/api', () => ({
  standApi: {
    getStands: vi.fn(),
    getProducts: vi.fn(),
    registerConsumo: vi.fn(),
  },
}))

vi.mock('@/composables/useCashierForm', () => ({
  useCashierForm: () => ({
    loading: { value: false },
    alertMessage: { value: '' },
    alertType: { value: 'success' },
    showAlert,
    clearAlert: vi.fn(),
  }),
}))

import { useStandConsumption } from '@/composables/useStandConsumption'

const mountedWrappers: Array<{ unmount: () => void }> = []

function createComposable() {
  let composable!: ReturnType<typeof useStandConsumption>
  const wrapper = mount(
    defineComponent({
      setup() {
        composable = useStandConsumption()
        return () => null
      },
    }),
  )
  mountedWrappers.push(wrapper)
  return composable
}

function createVideo() {
  const video = document.createElement('video')
  Object.defineProperty(video, 'srcObject', { configurable: true, writable: true, value: null })
  return video
}

function createStream(facingMode?: string) {
  const stop = vi.fn()
  const track = {
    stop,
    getSettings: () => ({ facingMode }),
  }
  const stream = {
    getTracks: () => [track],
    getVideoTracks: () => [track],
  } as unknown as MediaStream

  return { stream, stop }
}

function createControls() {
  return { stop: vi.fn() }
}

describe('useStandConsumption scanner', () => {
  beforeEach(() => {
    decodeFromConstraints.mockReset()
    showAlert.mockReset()
  })

  afterEach(() => {
    mountedWrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  })

  it('abre inicialmente com facingMode environment exato', async () => {
    const video = createVideo()
    const { stream } = createStream('environment')
    const controls = createControls()
    decodeFromConstraints.mockImplementation(async (_constraints, preview) => {
      preview.srcObject = stream
      return controls
    })
    const composable = createComposable()
    composable.videoRef.value = video

    await composable.startScanner()

    expect(decodeFromConstraints).toHaveBeenCalledOnce()
    expect(decodeFromConstraints.mock.calls[0]?.[0]).toEqual({
      audio: false,
      video: { facingMode: { exact: 'environment' } },
    })
    expect(composable.scanState.value).toBe('scanning')
    expect(showAlert).not.toHaveBeenCalled()
  })

  it('usa facingMode ideal quando a restrição exata não é suportada', async () => {
    const video = createVideo()
    const { stream } = createStream('environment')
    decodeFromConstraints
      .mockRejectedValueOnce(
        Object.assign(new Error('unsupported'), { name: 'OverconstrainedError' }),
      )
      .mockImplementationOnce(async (_constraints, preview) => {
        preview.srcObject = stream
        return createControls()
      })
    const composable = createComposable()
    composable.videoRef.value = video

    await composable.startScanner()

    expect(decodeFromConstraints).toHaveBeenCalledTimes(2)
    expect(decodeFromConstraints.mock.calls[1]?.[0]).toEqual({
      audio: false,
      video: { facingMode: { ideal: 'environment' } },
    })
    expect(composable.scanState.value).toBe('scanning')
  })

  it('interrompe e rejeita uma câmera frontal selecionada no fallback', async () => {
    const video = createVideo()
    const { stream, stop } = createStream('user')
    const controls = createControls()
    decodeFromConstraints
      .mockRejectedValueOnce(
        Object.assign(new Error('unsupported'), { name: 'OverconstrainedError' }),
      )
      .mockImplementationOnce(async (_constraints, preview) => {
        preview.srcObject = stream
        return controls
      })
    const composable = createComposable()
    composable.videoRef.value = video

    await composable.startScanner()

    expect(controls.stop).toHaveBeenCalledOnce()
    expect(stop).toHaveBeenCalledOnce()
    expect(video.srcObject).toBeNull()
    expect(composable.scanState.value).toBe('idle')
    expect(showAlert).toHaveBeenCalledWith('Não foi possível acessar uma câmera traseira.', 'error')
  })

  it('encerra todas as tracks ao fechar e antes de reiniciar o scanner', async () => {
    const video = createVideo()
    const staleStream = createStream('environment')
    const firstStream = createStream('environment')
    const secondStream = createStream('environment')
    video.srcObject = staleStream.stream
    decodeFromConstraints
      .mockImplementationOnce(async (_constraints, preview) => {
        preview.srcObject = firstStream.stream
        return createControls()
      })
      .mockImplementationOnce(async (_constraints, preview) => {
        preview.srcObject = secondStream.stream
        return createControls()
      })
    const composable = createComposable()
    composable.videoRef.value = video

    await composable.startScanner()
    expect(staleStream.stop).toHaveBeenCalledOnce()

    composable.stopScanner()
    expect(firstStream.stop).toHaveBeenCalledOnce()
    expect(video.srcObject).toBeNull()

    await composable.startScanner()
    composable.stopScanner()

    expect(secondStream.stop).toHaveBeenCalledOnce()
    expect(video.srcObject).toBeNull()
  })
})
