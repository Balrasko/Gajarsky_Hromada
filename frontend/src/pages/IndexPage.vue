<template>
  <q-page class="q-pa-xl column items-start q-gutter-md">
    <div class="text-body1">Review the list of registered users below.</div>

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
import type { UserDto } from '@vpwa/shared';
import { fetchUsers } from 'src/services/api';

const users = ref<UserDto[]>([]);
const isFetchingUsers = ref(false);
const usersError = ref('');

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
