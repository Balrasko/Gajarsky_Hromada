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

    <q-card flat bordered class="q-mt-xl" style="max-width: 640px; width: 100%">
      <q-card-section class="row items-center justify-between">
        <div class="text-h6 text-primary">Registered users</div>
        <q-btn
          flat
          color="primary"
          icon="refresh"
          round
          :loading="isFetchingUsers"
          @click="loadUsers"
        />
      </q-card-section>

      <q-separator inset />

      <q-card-section>
        <q-banner v-if="usersError" class="bg-negative text-white">
          {{ usersError }}
        </q-banner>

        <div v-else>
          <q-linear-progress v-if="isFetchingUsers" color="primary" indeterminate class="q-mb-md" />

          <div v-if="!isFetchingUsers && users.length === 0" class="text-body2 text-grey">
            No users found yet. Register to see entries here.
          </div>

          <q-list v-else separator>
            <q-item v-for="userItem in users" :key="userItem.id">
              <q-item-section>
                <q-item-label class="text-subtitle1">{{ userItem.nickName }}</q-item-label>
                <q-item-label caption>
                  {{ userItem.firstName }} {{ userItem.lastName }} • {{ userItem.email }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge
                  :label="userItem.status"
                  :color="statusColor(userItem.status)"
                  align="middle"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import axios from 'axios';
import type { UserDto } from '@vpwa/shared';
import { fetchUsers } from 'src/services/api';

const isLoading = ref(false);
const message = ref('');
const errorMessage = ref('');
const users = ref<UserDto[]>([]);
const isFetchingUsers = ref(false);
const usersError = ref('');

type HighlightedUser = Pick<UserDto, 'id' | 'nickName'>;
const helperUser: HighlightedUser = {
  id: 'system-user',
  nickName: 'system'
};

const statusColor = (status: UserDto['status']) => {
  switch (status) {
    case 'online':
      return 'positive';
    case 'dnd':
      return 'negative';
    default:
      return 'grey';
  }
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

const loadUsers = async () => {
  isFetchingUsers.value = true;
  usersError.value = '';

  try {
    users.value = await fetchUsers();
  } catch (error) {
    usersError.value = 'Unable to load users. Please try again later.';
    console.error('Fetching users failed', error);
  } finally {
    isFetchingUsers.value = false;
  }
};

onMounted(() => {
  void loadUsers();
});
</script>
