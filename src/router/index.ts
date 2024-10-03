import { createRouter, createWebHistory } from 'vue-router'

import About from '@/entry/gemini/App.vue'
import Home from '@/entry/App.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: Home },
    { path: '/gemini', name: 'Gemini', component: About }
  ]
})

export default router
