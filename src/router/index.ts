import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import CashierView from '../views/CashierView.vue'
import StandView from '../views/StandView.vue'
import ReportView from '../views/ReportView.vue'
import SaldoView from '../views/SaldoView.vue'
import CardView from '../views/CardView.vue'

const routes: RouteRecordRaw[] = [
  { path: '/caixa', component: CashierView },
  {
    path: '/barraca',
    redirect: (to) => (to.query.id ? `/barraca/${to.query.id}` : '/caixa'),
  },
  { path: '/barraca/:id', component: StandView },
  { path: '/relatorio', component: ReportView },
  { path: '/saldo', component: SaldoView },
  { path: '/card', component: CardView },
  { path: '/', redirect: '/caixa' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
