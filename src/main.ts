import './assets/main.css'
import './assets/cashier.css'
import '@mdi/font/css/materialdesignicons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { md3 } from 'vuetify/blueprints'

const app = createApp(App)

const vuetify = createVuetify({
  components,
  directives,
  blueprint: md3,
  theme: {
    defaultTheme: 'juninaTheme',
    themes: {
      juninaTheme: {
        dark: false,
        colors: {
          // Laranja-vermelho de fogueira — ação principal
          primary: '#E65100',
          // Âmbar dourado — ações secundárias / recarga
          secondary: '#F9A825',
          // Amarelo canário — avisos
          warning: '#F57F17',
          // Verde bandeirola — sucesso
          success: '#2E7D32',
          // Vermelho profundo — erro
          error: '#B71C1C',
          // Info azul suave
          info: '#0277BD',
          // Superfície clara quente
          background: '#FFF8F0',
          surface: '#FFFFFF',
          'surface-variant': '#FFF3E0',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
  },
})

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.mount('#app')
