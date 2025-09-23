<template>
  <q-page class="q-pa-xl column items-start q-gutter-md">
    <div class="text-h4 text-primary">Workspace Chat Prototype</div>
    <div class="text-body1">Use the button below to verify the backend connection.</div>

    <q-btn
      color="primary"
      label="Ping Backend"
      :loading="isLoading"
      unelevated
      @click="pingBackend"
    />

    <q-card v-if="message" flat bordered class="bg-grey-1 q-mt-md">
      <q-card-section class="text-body1">{{ message }}</q-card-section>
    </q-card>

    <q-banner v-if="errorMessage" class="bg-negative text-white q-mt-md">
      {{ errorMessage }}
    </q-banner>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import type { UserDto } from '@vpwa/shared';

const isLoading = ref(false);
const message = ref('');
const errorMessage = ref('');

type HighlightedUser = Pick<UserDto, 'id' | 'nickName'>;
const helperUser: HighlightedUser = {
  id: 'system-user',
  nickName: 'system'
};

const pingBackend = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const response = await axios.get<{ message: string }>('/api/hello');
    message.value = `${response.data.message} from @${helperUser.nickName}`;
  } catch (error) {
    errorMessage.value = 'Unable to reach backend. Please ensure it is running.';
    console.error('Ping Backend failed', error);
  } finally {
    isLoading.value = false;
  }
};
</script>
