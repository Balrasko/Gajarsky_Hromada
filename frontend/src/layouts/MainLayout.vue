<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated color="primary" class="text-white">
      <q-toolbar>
        <q-toolbar-title>Workspace</q-toolbar-title>
        <q-space />
        <q-btn flat dense color="white" label="Home" to="/" />
        <q-btn flat dense color="white" label="Register" to="/register" />
        <q-btn flat dense color="white" label="Login" to="/login" />
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
