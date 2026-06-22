import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { startAppUpdateChecks } from './appUpdate'

startAppUpdateChecks()

createApp(App).mount('#app')
