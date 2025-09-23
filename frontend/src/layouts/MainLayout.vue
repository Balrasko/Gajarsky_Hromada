<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated color="primary" class="text-white">
      <q-toolbar>
        <q-toolbar-title>Workspace Chat Prototype</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
// The main layout stays minimal while we iterate on core chat features.
</script>
