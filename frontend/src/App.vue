<template>
  <div class="q-pa-md">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import socket from "src/services/socket"

// ponecháš len základný connect log (ak ho chceš)
socket.on('connect', () => {
  console.log('Connected to Socket.IO:', socket.id)
})
</script>
