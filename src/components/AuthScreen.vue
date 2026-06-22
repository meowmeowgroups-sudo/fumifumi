<script setup>
import { ref } from 'vue'
import { registerWithEmail, loginWithEmail } from '../auth'

const mode = ref('login')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

const submit = async () => {
  error.value = ''
  loading.value = true
  try {
    if (mode.value === 'register') {
      if (password.value !== confirmPassword.value) {
        throw new Error('兩次輸入的密碼不一致')
      }
      await registerWithEmail(email.value, password.value)
    } else {
      await loginWithEmail(email.value, password.value)
    }
  } catch (err) {
    error.value = err?.message || '操作失敗'
  } finally {
    loading.value = false
  }
}

const switchMode = (next) => {
  mode.value = next
  error.value = ''
  confirmPassword.value = ''
}
</script>

<template>
  <div class="min-h-screen bg-[#f5f5f3] flex items-center justify-center p-4 font-sans antialiased">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <h1 class="auth-brand">FUMI-FUMI</h1>
        <p class="auth-tagline">貓貓最安心的踏-踏，源自你最細心的照顧</p>
      </div>

      <div class="bg-white rounded-3xl shadow-lg shadow-slate-200/60 ring-1 ring-slate-100 p-6 space-y-4">
        <div class="flex bg-slate-100 rounded-2xl p-1">
          <button type="button"
                  @click="switchMode('login')"
                  :class="['flex-1 py-2 rounded-xl text-[11px] font-black transition-all',
                           mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400']">
            登入
          </button>
          <button type="button"
                  @click="switchMode('register')"
                  :class="['flex-1 py-2 rounded-xl text-[11px] font-black transition-all',
                           mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400']">
            註冊
          </button>
        </div>

        <p v-if="error" class="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {{ error }}
        </p>

        <div class="space-y-3">
          <div>
            <label class="text-[10px] font-bold text-slate-500 block mb-1">電郵</label>
            <input v-model="email"
                   type="email"
                   autocomplete="email"
                   placeholder="you@example.com"
                   class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          <div>
            <label class="text-[10px] font-bold text-slate-500 block mb-1">密碼</label>
            <input v-model="password"
                   type="password"
                   :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
                   placeholder="至少 6 個字元"
                   class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          <div v-if="mode === 'register'">
            <label class="text-[10px] font-bold text-slate-500 block mb-1">確認密碼</label>
            <input v-model="confirmPassword"
                   type="password"
                   autocomplete="new-password"
                   placeholder="再輸入一次密碼"
                   class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
        </div>

        <button type="button"
                :disabled="loading"
                @click="submit"
                class="w-full py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-black shadow-md active:scale-[0.98] transition-transform disabled:opacity-60">
          {{ loading ? '處理中…' : (mode === 'register' ? '建立帳戶' : '登入') }}
        </button>

        <p class="text-[9px] font-bold text-slate-400 text-center leading-relaxed">
          註冊後你的貓咪資料會儲存在獨立戶口，<br>不會與其他用戶共用。
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.cdnfonts.com/css/garet');

.auth-brand {
  font-family: 'Garet', sans-serif;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #795E38;
  margin: 0;
  line-height: 1.1;
}

.auth-tagline {
  margin: 0.75rem 0 0;
  padding: 0 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1.6;
  color: #9a8268;
}
</style>
