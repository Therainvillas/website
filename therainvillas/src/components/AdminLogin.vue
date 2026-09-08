<template>
  <div class="admin-login">
    <div class="admin-login__card">
      <div class="admin-login__icon">🔐</div>
      <h2 class="admin-login__title">Admin Login</h2>
      <p class="admin-login__desc">Masuk untuk mengelola jadwal villa</p>

      <form @submit.prevent="handleLogin" class="admin-login__form">
        <div class="admin-login__field">
          <label>Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="Masukkan password admin"
            autofocus
          />
        </div>

        <p v-if="error" class="admin-login__error">{{ error }}</p>

        <button type="submit" class="btn btn--primary admin-login__btn">
          Masuk
        </button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      password: "",
      error: "",
    };
  },
  methods: {
    handleLogin() {
      this.error = "";
      if (this.password === "trvjon123") {
        localStorage.setItem("therainvillas_admin", "true");
        window.location.href = "/admin/dashboard";
      } else {
        this.error = "Password salah. Coba lagi.";
      }
    },
  },
};
</script>

<style scoped>
.admin-login {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.admin-login__card {
  background: white;
  border-radius: 20px;
  padding: 48px 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.admin-login__icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.admin-login__title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.admin-login__desc {
  color: var(--color-gray, #727586);
  font-size: 0.95rem;
  margin-bottom: 32px;
}

.admin-login__form {
  text-align: left;
}

.admin-login__field {
  margin-bottom: 20px;
}

.admin-login__field label {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.admin-login__field input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  font-family: inherit;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.admin-login__field input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.admin-login__error {
  color: #dc2626;
  font-size: 0.9rem;
  margin-bottom: 16px;
  text-align: center;
}

.admin-login__btn {
  width: 100%;
  padding: 14px;
  font-size: 1rem;
}
</style>
