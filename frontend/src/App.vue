<template>
  <div class="q-pa-md">
    <router-view />

    <q-btn
      label="Test Socket Ping"
      color="primary"
      @click="testPing"
      class="q-mt-xl"
    />
  </div>
</template>

<script setup lang="ts">
import socket from "src/services/socket"

function testPing() {
  console.log('➡️ sending ping')
  socket.emit('ping')
}

socket.on('connect', () => {
  console.log('🟢 Connected to Socket.IO:', socket.id)
})

socket.on('pong', () => {
  console.log('🟣 received pong from backend')
})
</script>
