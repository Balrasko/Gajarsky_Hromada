<template>
  <q-page class="row items-center justify-center">
    <q-card class="q-pa-md" style="width: 420px">
      <q-card-section>
        <div class="text-h6">Register</div>
        <div class="text-caption text-negative" v-if="errorMessage">{{ errorMessage }}</div>
      </q-card-section>

      <q-card-section class="column q-gutter-md">
        <q-input filled v-model="firstName" label="First name" />
        <q-input filled v-model="lastName" label="Last name" />
        <q-input filled v-model="nickname" label="Nickname" />
        <q-input filled v-model="email" label="Email" type="email" />
        <q-input filled v-model="password" label="Password" type="password" />
        <q-input filled v-model="passwordConfirmation" label="Confirm password" type="password" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn label="Back to login" flat @click="goToLogin" />
        <q-btn label="Register" color="primary" @click="register" :loading="isSubmitting" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios, { isAxiosError, type AxiosError } from 'axios'

type RegisterErrorResponse = {
  message?: string
  details?: string
  errors?: { message?: string }[]
}

const router = useRouter()
const firstName = ref('')
const lastName = ref('')
const nickname = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

const register = async () => {
  errorMessage.value = ''

  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  try {
    isSubmitting.value = true
    const res = await axios.post('http://localhost:3333/api/auth/register', {
      first_name: firstName.value,
      last_name: lastName.value,
      nickname: nickname.value,
      email: email.value,
      password: password.value,
    })
    console.log('Register OK', res.data)
    void router.push('/login')
  } catch (err) {
    if (isAxiosError(err)) {
      const axiosErr = err as AxiosError<RegisterErrorResponse>
      const serverMessage =
        axiosErr.response?.data?.message ||
        axiosErr.response?.data?.details ||
        axiosErr.response?.data?.errors?.[0]?.message
      errorMessage.value = serverMessage || 'Registration failed.'
      console.error('Register failed', axiosErr.response?.data || axiosErr.message)
    } else {
      errorMessage.value = 'Registration failed.'
      console.error('Register failed', err)
    }
  } finally {
    isSubmitting.value = false
  }
}

const goToLogin = () => {
  void router.push('/login')
}
</script>
