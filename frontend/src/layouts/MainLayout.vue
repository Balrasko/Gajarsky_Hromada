<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-white text-dark">
      <q-toolbar>
        <q-toolbar-title class="text-primary text-no-wrap">Workspace</q-toolbar-title>

        <div class="gt-xs row items-center q-gutter-sm">
          <q-btn
            v-for="link in navLinks"
            :key="link.to"
            flat
            dense
            no-caps
            :text-color="isActive(link) ? 'primary' : 'black'"
            :label="link.label"
            :to="link.to"
          />
        </div>

        <q-btn
          class="lt-sm"
          flat
          dense
          round
          color="primary"
          icon="menu"
          aria-label="Open navigation"
        >
          <q-menu auto-close>
            <q-list style="min-width: 140px">
              <q-item
                v-for="link in navLinks"
                :key="link.to"
                clickable
                :to="link.to"
                v-ripple
                :class="isActive(link) ? 'text-primary' : 'text-dark'"
              >
                <q-item-section>{{ link.label }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

type NavLink = { label: string; to: string };

const navLinks: NavLink[] = [
  { label: 'Home', to: '/home' },
  { label: 'Register', to: '/register' },
  { label: 'Login', to: '/login' }
];

const route = useRoute();
const isActive = (link: NavLink) => route.path === link.to;
</script>
