<template>
  <q-page class="q-pa-xl flex flex-center">
    <q-card flat bordered style="max-width: 420px; width: 100%">
      <q-card-section>
        <div class="text-h5 text-primary">Sign in</div>
        <div class="text-subtitle2 text-grey-8">Access your workspace conversations.</div>
      </q-card-section>

      <q-separator inset />

      <q-card-section>
        <q-form
          :key="formResetKey"
          ref="loginFormRef"
          class="column q-gutter-md"
          @submit.prevent="onSubmit"
        >
          <q-input
            v-model="form.email"
            type="email"
            label="Email"
            dense
            outlined
            :rules="[requiredRule, emailRule]"
          />

          <q-input
            v-model="form.password"
            :type="isPasswordVisible ? 'text' : 'password'"
            label="Password"
            dense
            outlined
            :rules="[requiredRule]"
          >
            <template #append>
              <q-icon
                :name="isPasswordVisible ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPasswordVisible = !isPasswordVisible"
              />
            </template>
          </q-input>

          <q-btn
            label="Login"
            color="primary"
            unelevated
            :loading="isSubmitting"
            type="submit"
          />
        </q-form>

        <q-banner v-if="errorMessage" class="bg-negative text-white q-mt-md">
          {{ errorMessage }}
        </q-banner>
        <q-banner v-if="welcomeMessage" class="bg-primary text-white q-mt-md">
          {{ welcomeMessage }}
        </q-banner>
      </q-card-section>

      <q-card-actions align="center">
        <div class="text-caption">Need an account?</div>
        <q-btn flat color="primary" label="Register" @click="goToRegister" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { QForm } from 'quasar';

import { loginUser } from 'src/services/api';

const router = useRouter();
const loginFormRef = ref<QForm | null>(null);
const formResetKey = ref(0);

const form = reactive({
  email: '',
  password: ''
});

const isSubmitting = ref(false);
const isPasswordVisible = ref(false);
const errorMessage = ref('');
const welcomeMessage = ref('');

const requiredRule = (val: string) => !!val || 'Required field';
const emailRule = (val: string) => /.+@.+\..+/.test(val) || 'Enter a valid email';

const onSubmit = async () => {
  isSubmitting.value = true;
  errorMessage.value = '';
  welcomeMessage.value = '';

  try {
    const user = await loginUser({ ...form });
    welcomeMessage.value = `Welcome back, ${user.nickName}!`;
    loginFormRef.value?.resetValidation();
    form.password = '';
    formResetKey.value += 1;
  } catch (error) {
    errorMessage.value = 'Invalid email or password. Please try again.';
    console.error('Login failed', error);
  } finally {
    isSubmitting.value = false;
  }
};

const goToRegister = () => {
  void router.push({ name: 'register' });
};
</script>
