<template>
  <q-page class="row items-center justify-center">
    <q-card class="q-pa-md" style="width: 400px">
      <q-card-section>
        <div class="text-h6">Login</div>
        <div class="text-caption text-positive" v-if="successMessage">{{ successMessage }}</div>
        <div class="text-caption text-negative" v-if="errorMessage">{{ errorMessage }}</div>
      </q-card-section>

      <q-card-section>
        <q-input filled v-model="email" label="Email" />
        <q-input filled v-model="password" label="Password" type="password" class="q-mt-md" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn label="Create account" flat @click="goToRegister" />
        <q-btn label="Login" color="primary" @click="login" :loading="isSubmitting" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios, { isAxiosError } from 'axios'

const router = useRouter()
const email = ref('')
const password = ref('')
const isSubmitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const login = async () => {
  successMessage.value = ''
  errorMessage.value = ''

  try {
    isSubmitting.value = true
    const res = await axios.post('http://localhost:3333/api/auth/login', {
      email: email.value,
      password: password.value,
    })
    successMessage.value = 'Login successful.'
    console.log('Login OK', res.data)
  } catch (err) {
    if (isAxiosError(err)) {
      errorMessage.value = err.response?.data || 'Login failed.'
      console.error('Login failed', err.response?.data || err.message)
    } else {
      errorMessage.value = 'Login failed.'
      console.error('Login failed', err)
    }
  } finally {
    isSubmitting.value = false
  }
}

const goToRegister = () => {
  void router.push('/register')
}
</script>
