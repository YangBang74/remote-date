import { createRouter, createWebHistory } from 'vue-router'
import {
  HomePage,
  AboutPage,
  RoomPage,
  SoundRoomPage,
  YoutubePage,
  SoundcloudPage,
  AuthPage,
  ProfilePage,
} from '@/pages'
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
        { path: 'youtube', component: YoutubePage },
        { path: 'soundcloud', component: SoundcloudPage },
        { path: 'room/:id', component: RoomPage },
        { path: 'sound-room/:id', component: SoundRoomPage },
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
