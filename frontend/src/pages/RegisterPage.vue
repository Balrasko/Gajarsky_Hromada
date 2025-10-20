<template>
  <q-page class="q-pa-xl flex flex-center">
    <q-card flat bordered class="registration-card column" style="max-width: 480px; width: 100%">
      <q-card-section>
        <div class="text-h5 text-primary">Create an account</div>
        <div class="text-subtitle2 text-grey-8">Fill the form to register as a workspace member.</div>
      </q-card-section>

      <q-separator inset />

      <q-card-section>
        <q-form
          :key="formResetKey"
          ref="registerFormRef"
          class="column q-gutter-md"
          @submit.prevent="onSubmit"
        >
          <div class="row justify-between no-wrap">
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.firstName"
                label="First name"
                dense
                outlined
                :rules="[requiredRule]"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.lastName"
                label="Last name"
                dense
                outlined
                :rules="[requiredRule]"
              />
            </div>
          </div>

          <q-input
            v-model="form.nickName"
            label="Nickname"
            dense
            outlined
            hint="Visible to other workspace members"
            :rules="[requiredRule]"
          />

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
            :rules="[requiredRule, passwordRule]"
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
            label="Register"
            color="primary"
            unelevated
            :loading="isSubmitting"
            type="submit"
          />
        </q-form>

        <q-banner v-if="errorMessage" class="bg-negative text-white q-mt-md">
          {{ errorMessage }}
        </q-banner>
        <q-banner v-if="successMessage" class="bg-positive text-white q-mt-md">
          {{ successMessage }}
        </q-banner>
      </q-card-section>

      <q-separator inset />

      <q-card-actions align="center">
        <div class="text-caption">Already registered?</div>
        <q-btn flat color="primary" label="Go to login" @click="goToLogin" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { QForm } from 'quasar';
import { useQuasar } from 'quasar';

import { registerUser } from 'src/services/api';

const router = useRouter();
const $q = useQuasar();
const registerFormRef = ref<QForm | null>(null);
const formResetKey = ref(0);

const form = reactive({
  firstName: '',
  lastName: '',
  nickName: '',
  email: '',
  password: ''
});

const isSubmitting = ref(false);
const isPasswordVisible = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const requiredRule = (val: string) => !!val || 'Required field';
const emailRule = (val: string) => /.+@.+\..+/.test(val) || 'Enter a valid email';
const passwordRule = (val: string) => val.length >= 6 || 'At least 6 characters';

const resetForm = () => {
  registerFormRef.value?.resetValidation();
  form.firstName = '';
  form.lastName = '';
  form.nickName = '';
  form.email = '';
  form.password = '';
  formResetKey.value += 1;
};

const onSubmit = async () => {
  isSubmitting.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const user = await registerUser({ ...form });
    successMessage.value = `Registration successful for @${user.nickName}! You can now log in.`;
    $q.notify({
      type: 'positive',
      message: `Účet @${user.nickName} bol vytvorený (mock data).`,
    });
    resetForm();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not register. Please review the form.';
    errorMessage.value = message;
    console.error('Registration failed', error);
  } finally {
    isSubmitting.value = false;
  }
};

const goToLogin = () => {
  void router.push({ name: 'login' });
};
</script>
