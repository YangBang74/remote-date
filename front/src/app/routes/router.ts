import { createRouter, createWebHistory } from 'vue-router'
import { HomePage, AboutPage, RoomPage, AuthPage, ProfilePage } from '@/pages'
import { DefaultLayout, AuthLayout } from '@/app/layout'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        { path: '', component: HomePage },
        { path: 'about', component: AboutPage },
        { path: 'room/:id', component: RoomPage },
        { path: 'profile', component: ProfilePage },
      ],
    },
    {
      path: '/auth',
      component: AuthLayout,
      children: [{ path: '', component: AuthPage }],
    },
  ],
})

export default router
