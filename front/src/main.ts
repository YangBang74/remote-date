import { createApp } from 'vue'
import './style.css'
import App from './app/index.vue'
import router from './app/routes/router'

createApp(App).use(router).mount('#app')
