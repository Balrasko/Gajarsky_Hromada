import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/LoginPage.vue'),
        name: 'login',
        alias: '/login',
      },
      { path: 'home', component: () => import('pages/HomePage.vue'), name: 'home' },
      { path: 'users', component: () => import('pages/IndexPage.vue'), name: 'users' },
      { path: 'register', component: () => import('pages/RegisterPage.vue'), name: 'register' },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
