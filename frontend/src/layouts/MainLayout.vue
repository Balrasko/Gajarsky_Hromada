<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated color="primary" class="text-white">
      <q-toolbar>
        <q-toolbar-title>Workspace</q-toolbar-title>
        <q-space />
        <q-btn flat dense color="white" label="Home" to="/" />
        <template v-if="isAuthenticated">
          <div class="row items-center q-gutter-sm q-pr-sm">
            <q-chip dense color="white" text-color="primary">
              {{ signedInLabel }}
            </q-chip>
          </div>
        </template>
        <template v-else>
          <q-btn flat dense color="white" label="Register" to="/register" />
          <q-btn flat dense color="white" label="Login" to="/login" />
        </template>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useSession } from 'src/services/session';

const { user, isAuthenticated } = useSession();

const signedInLabel = computed(() => {
  if (!user.value) {
    return '';
  }

  return `${user.value.nickName} (${user.value.status})`;
});
</script>
