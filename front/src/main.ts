import { createApp } from 'vue'
import 'vue-sonner/style.css'
import './style.css'
import App from './app/index.vue'
import router from './app/routes/router'

createApp(App).use(router).mount('#app')
