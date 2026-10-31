<template>
  <div class="admin-login">
    <section class="admin-login__card" aria-labelledby="admin-login-title">
      <div class="admin-login__brand">
        <img
          src="/logo%20trv2.png"
          alt="The Rain Villas"
          class="admin-login__logo admin-login__logo--dark"
        />
        <img
          src="/logo%20trv2%20putih.png"
          alt=""
          aria-hidden="true"
          class="admin-login__logo admin-login__logo--light"
        />
        <span class="admin-login__badge">ADMIN</span>
      </div>

      <div class="admin-login__intro">
        <p class="admin-login__eyebrow">AREA PENGELOLA</p>
        <h1 id="admin-login-title" class="admin-login__title">Masuk ke panel admin</h1>
        <p class="admin-login__desc">Masuk untuk mengelola jadwal villa.</p>
      </div>

      <form @submit.prevent="handleLogin" class="admin-login__form">
        <div class="admin-login__field">
          <label for="admin-password">Password admin</label>
          <input
            id="admin-password"
            v-model="password"
            type="password"
            placeholder="Masukkan password admin"
            autocomplete="current-password"
            :aria-invalid="error ? 'true' : 'false'"
            :aria-describedby="error ? 'admin-login-error' : undefined"
          />
        </div>

        <p v-if="error" id="admin-login-error" class="admin-login__error" role="alert">
          {{ error }}
        </p>

        <button type="submit" class="admin-login__btn">
          <span>Masuk ke panel</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </section>
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
  width: min(100%, 460px);
  padding: 32px clamp(28px, 4vw, 36px);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  background: var(--color-panel);
  color: var(--color-dark);
  box-shadow: var(--shadow-lift);
  text-align: left;
}

.admin-login__brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 14px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
}

.admin-login__logo {
  display: block;
  width: clamp(118px, 30vw, 150px);
  height: auto;
  object-fit: contain;
}

.admin-login__logo--light {
  display: none;
}

:global(html[data-theme="dark"] .admin-login__logo--dark) {
  display: none;
}

:global(html[data-theme="dark"] .admin-login__logo--light) {
  display: block;
}

.admin-login__badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid rgba(var(--color-accent-rgb), 0.3);
  border-radius: 999px;
  background: rgba(var(--color-accent-rgb), 0.08);
  color: var(--color-accent-dark);
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.admin-login__eyebrow {
  margin-bottom: 10px;
  color: var(--color-accent-dark);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.admin-login__title {
  margin: 0;
  color: var(--color-dark);
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 4vw, 2.1rem);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.15;
  text-wrap: balance;
}

.admin-login__desc {
  max-width: 34ch;
  margin-top: 10px;
  color: var(--color-gray);
  font-size: 0.95rem;
  line-height: 1.6;
}

.admin-login__form {
  display: grid;
  gap: 16px;
  margin-top: 22px;
}

.admin-login__field label {
  display: block;
  margin-bottom: 8px;
  color: var(--color-gray-dark);
  font-size: 0.88rem;
  font-weight: 700;
}

.admin-login__field input {
  display: block;
  width: 100%;
  min-height: 54px;
  padding: 0 16px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-light);
  color: var(--color-dark);
  font-family: inherit;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.admin-login__field input::placeholder {
  color: var(--color-gray);
}

.admin-login__field input:focus-visible {
  outline: 3px solid rgba(var(--color-primary-rgb), 0.18);
  outline-offset: 2px;
  border-color: var(--color-primary);
}

.admin-login__error {
  margin: 0;
  padding: 11px 13px;
  border: 1px solid rgba(198, 64, 64, 0.26);
  border-radius: 10px;
  background: rgba(198, 64, 64, 0.08);
  color: var(--color-danger);
  font-size: 0.88rem;
  font-weight: 600;
}

.admin-login__btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 54px;
  padding: 0 18px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: var(--color-primary);
  color: var(--color-white);
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(var(--color-primary-rgb), 0.18);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.admin-login__btn:hover {
  transform: translateY(-1px);
  background: var(--color-primary-dark);
  box-shadow: 0 16px 30px rgba(var(--color-primary-rgb), 0.24);
}

.admin-login__btn:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: 3px;
}

.admin-login__btn svg {
  width: 19px;
  height: 19px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform 0.2s ease;
}

.admin-login__btn:hover svg {
  transform: translateX(3px);
}

@media (max-width: 480px) {
  .admin-login {
    padding: 20px 16px 32px;
  }

  .admin-login__card {
    padding: 28px 22px;
    border-radius: 20px;
  }

  .admin-login__brand {
    padding-bottom: 18px;
    margin-bottom: 24px;
  }

  .admin-login__logo {
    width: 132px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-login__field input,
  .admin-login__btn,
  .admin-login__btn svg {
    transition: none;
  }
}
</style>
