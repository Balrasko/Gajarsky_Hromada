<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import { useSession } from 'src/services/session';

const { hydrateFromStorage } = useSession();

onMounted(() => {
  hydrateFromStorage();
});
</script>
