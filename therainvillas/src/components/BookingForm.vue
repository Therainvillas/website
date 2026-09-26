<template>
  <div class="bf">
    <!-- ===== PROGRESS BAR ===== -->
    <div v-if="!done" class="bf__progress">
      <div class="bf__progress-track">
        <div class="bf__progress-fill" :style="{ width: progressWidth }"></div>
      </div>
      <div class="bf__steps">
        <button
          v-for="(s, i) in stepLabels"
          :key="i"
          class="bf__step-dot"
          :class="{
            'bf__step-dot--active': step === i + 1,
            'bf__step-dot--done': step > i + 1,
          }"
          @click="goToStep(i + 1)"
          :disabled="i + 1 > step"
        >
          <span class="bf__step-num">{{ step > i + 1 ? '✓' : i + 1 }}</span>
          <span class="bf__step-label">{{ s }}</span>
        </button>
      </div>
    </div>

    <div class="bf__card">
      <!-- ===== FORMAT GUIDE ===== -->
      <div v-if="!done" class="bf__guide">
        <div class="bf__guide-head">
          <span class="bf__guide-badge">FORMAT BOOKING</span>
          <span class="bf__guide-brand">[ The Rain Villas ]</span>
        </div>
        <p class="bf__guide-desc">Isi format di bawah lengkap, lalu kirim langsung ke WhatsApp admin. Rekening akan diberikan setelah format terisi.</p>
        <div class="bf__guide-fields">
          <span>Nama villa</span>
          <span>Tanggal &amp; Bulan</span>
          <span>Nama pem-booking villa</span>
          <span>Nama pengirim transfer</span>
          <span>Nominal transfer</span>
          <span>Jumlah orang</span>
          <span>Akun sosial media</span>
          <span>Penyediaan lainya (Sewa ps)</span>
        </div>
      </div>

      <form v-if="!done" @submit.prevent="handleNext">

        <!-- ===== STEP 1: PILIH VILLA & TANGGAL ===== -->
        <transition name="bf-slide" mode="out-in">
          <div v-if="step === 1" key="step1" class="bf__section">
            <div class="bf__section-header">
              <div class="bf__section-icon">🏠</div>
              <div>
                <h2 class="bf__title">Villa & Tanggal</h2>
                <p class="bf__subtitle">Tentukan villa dan tanggal menginap Anda</p>
              </div>
            </div>

            <div class="bf__field">
              <label>Nama Villa <span class="bf__req">*</span></label>
              <div class="bf__dd" ref="ddWrap">
                <button
                  type="button"
                  class="bf__dd-trigger"
                  :class="{ 'bf__dd-trigger--open': villaDropdownOpen }"
                  @click="toggleVillaDropdown"
                >
                  <template v-if="selectedVilla">
                    <img :src="selectedVilla.image" :alt="selectedVilla.name" class="bf__dd-trigger-img" />
                    <span class="bf__dd-trigger-info">
                      <span class="bf__dd-trigger-name">{{ selectedVilla.name }}</span>
                      <span class="bf__dd-trigger-sub">{{ selectedVilla.capacity }} tamu • {{ selectedVilla.priceLabel }}</span>
                    </span>
                  </template>
                  <span v-else class="bf__dd-placeholder">— Pilih villa —</span>
                  <svg
                    class="bf__dd-caret"
                    :class="{ 'bf__dd-caret--open': villaDropdownOpen }"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ><path d="M6 9l6 6 6-6"/></svg>
                </button>

                <transition name="bf-dd">
                  <div v-if="villaDropdownOpen" class="bf__dd-panel">
                    <div class="bf__dd-search">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                      <input ref="ddSearch" v-model="villaSearch" type="text" placeholder="Cari nama villa..." />
                    </div>
                    <div class="bf__dd-list">
                      <button
                        v-for="v in filteredVillas"
                        :key="v.id"
                        type="button"
                        class="bf__dd-option"
                        :class="{ 'bf__dd-option--active': v.name === form.villa }"
                        @click="pickVilla(v)"
                      >
                        <img :src="v.image" :alt="v.name" class="bf__dd-option-img" />
                        <span class="bf__dd-option-info">
                          <span class="bf__dd-option-name">{{ v.name }}</span>
                          <span class="bf__dd-option-meta">{{ v.capacity }} tamu • {{ v.bedrooms }} kamar</span>
                        </span>
                        <span class="bf__dd-option-price">{{ v.priceLabel.replace('/malam', '') }}</span>
                      </button>
                      <p v-if="filteredVillas.length === 0" class="bf__dd-empty">Villa tidak ditemukan.</p>
                    </div>
                  </div>
                </transition>
              </div>
            </div>

            <div v-if="selectedVilla" class="bf__villa-preview">
              <img :src="selectedVilla.image" :alt="selectedVilla.name" />
              <div class="bf__villa-info">
                <strong>{{ selectedVilla.name }}</strong>
                <span>{{ selectedVilla.capacity }} tamu • {{ selectedVilla.bedrooms }} kamar • {{ selectedVilla.bathrooms }} KM</span>
                <span class="bf__villa-price">Mulai dari {{ selectedVilla.priceLabel }}</span>
              </div>
            </div>

            <div v-if="selectedVilla" class="bf__dates">
              <div class="bf__cal-head">
                <button type="button" class="bf__cal-nav" @click="calPrevMonth" aria-label="Bulan sebelumnya">&larr;</button>
                <span class="bf__cal-title">{{ calMonthLabel }}</span>
                <button type="button" class="bf__cal-nav" @click="calNextMonth" aria-label="Bulan berikutnya">&rarr;</button>
              </div>
              <div class="bf__cal-grid">
                <span class="bf__cal-dow">Min</span>
                <span class="bf__cal-dow">Sen</span>
                <span class="bf__cal-dow">Sel</span>
                <span class="bf__cal-dow">Rab</span>
                <span class="bf__cal-dow">Kam</span>
                <span class="bf__cal-dow">Jum</span>
                <span class="bf__cal-dow">Sab</span>
                <template v-for="(cell, i) in calCells" :key="i">
                  <span v-if="cell === null" class="bf__cal-cell bf__cal-cell--empty"></span>
                  <button
                    v-else
                    type="button"
                    class="bf__cal-cell"
                    :class="calCellClass(cell)"
                    :disabled="!calSelectable(cell)"
                    @click="calSelect(cell)"
                  >{{ cell.day }}</button>
                </template>
              </div>

              <div v-if="form.checkIn || form.checkOut" class="bf__cal-selection">
                <div v-if="form.checkIn" class="bf__cal-tag">
                  <span class="bf__cal-tag-label">Check-in</span>
                  <span class="bf__cal-tag-value">{{ formatDate(form.checkIn) }}</span>
                </div>
                <div v-if="form.checkOut" class="bf__cal-tag">
                  <span class="bf__cal-tag-label">Check-out</span>
                  <span class="bf__cal-tag-value">{{ formatDate(form.checkOut) }}</span>
                </div>
              </div>

              <p class="bf__cal-legend">Tanggal yang dicoret sudah terbooking dan tidak dapat dipilih sebagai check-in.</p>
            </div>

            <p v-if="nightCount === 0 && (promoStatus === 'invalid' || promoStatus === 'expired')" class="bf__promo-msg bf__promo-msg--err">{{ promoMessage }}</p>

            <div v-if="nightCount > 0" class="bf__price-card">
              <div class="bf__price-row">
                <span>{{ nightCount }} malam</span>
                <strong>Rp {{ totalPrice }}</strong>
              </div>
              <div class="bf__price-note">Harga dihitung otomatis berdasarkan hari menginap</div>

              <div class="bf__promo">
                <div class="bf__promo-head">
                  <span class="bf__promo-title">🎟️ Kode Promo</span>
                  <button
                    v-if="promoApplied"
                    type="button"
                    class="bf__promo-chip"
                    @click="clearPromo"
                  >{{ promoApplied.code }} ✕ Hapus</button>
                </div>
                <div v-if="!promoApplied" class="bf__promo-row">
                  <input v-model="form.promo" type="text" placeholder="Kode promo" />
                  <button type="button" class="bf__promo-btn" @click="applyPromo">Pakai</button>
                </div>
                <p v-if="promoStatus === 'valid' && promoBlockedVilla" class="bf__promo-msg bf__promo-msg--warn">Kode {{ promoApplied.code }} tidak berlaku untuk villa {{ selectedVilla.name }}. Silakan pilih villa lain atau hapus kode ini.</p>
                <p v-else-if="promoStatus === 'valid'" class="bf__promo-msg bf__promo-msg--ok">{{ promoMessage }}</p>
                <p v-else-if="promoStatus === 'invalid'" class="bf__promo-msg bf__promo-msg--err">{{ promoMessage }}</p>
                <p v-else-if="promoStatus === 'expired'" class="bf__promo-msg bf__promo-msg--warn">{{ promoMessage }}</p>

                <div v-if="promoApplied && discountRaw > 0" class="bf__price-detail">
                  <div class="bf__price-detail-row">
                    <span>Subtotal ({{ nightCount }} malam)</span>
                    <strong>Rp {{ totalPrice }}</strong>
                  </div>
                  <div class="bf__price-detail-row bf__price-detail-row--discount">
                    <span>{{ promoApplied.label }} ({{ promoApplied.code }})</span>
                    <strong>− Rp {{ discountNum }}</strong>
                  </div>
                  <div class="bf__price-detail-row bf__price-detail-row--total">
                    <span>Total Setelah Diskon</span>
                    <strong>Rp {{ totalAfterPromo }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <!-- ===== STEP 2: DATA PEMBOOKING ===== -->
        <transition name="bf-slide" mode="out-in">
          <div v-if="step === 2" key="step2" class="bf__section">
            <div class="bf__section-header">
              <div class="bf__section-icon">👤</div>
              <div>
                <h2 class="bf__title">Data Pembooking</h2>
                <p class="bf__subtitle">Lengkapi informasi pemesan</p>
              </div>
            </div>

            <div class="bf__field">
              <label>Nama Pem-booking Villa <span class="bf__req">*</span></label>
              <input v-model="form.name" type="text" placeholder="Nama lengkap Anda" required />
            </div>
            <div class="bf__row">
              <div class="bf__field">
                <label>Jumlah Orang <span class="bf__req">*</span></label>
                <input v-model="form.guests" type="number" min="1" placeholder="contoh: 10" required />
              </div>
              <div class="bf__field">
                <label>Akun Sosial Media</label>
                <input v-model="form.socialMedia" type="text" placeholder="contoh: @nama_ig / tiktok / facebook" />
              </div>
            </div>
          </div>
        </transition>

        <!-- ===== STEP 3: DATA TRANSFER & PENYEDIAAN ===== -->
        <transition name="bf-slide" mode="out-in">
          <div v-if="step === 3" key="step3" class="bf__section">
            <div class="bf__section-header">
              <div class="bf__section-icon">💳</div>
              <div>
                <h2 class="bf__title">Pembayaran</h2>
                <p class="bf__subtitle">Data pengirim transfer & penyediaan lainya</p>
              </div>
            </div>

            <div class="bf__row">
              <div class="bf__field">
                <label>Nama Pengirim Transfer <span class="bf__req">*</span></label>
                <input v-model="form.transferName" type="text" placeholder="Nama sesuai rekening" required />
              </div>
              <div class="bf__field">
                <label>Nominal Transfer (Rp) <span class="bf__req">*</span></label>
                <input v-model="form.amount" type="number" min="1" placeholder="contoh 500000" required />
              </div>
            </div>

            <div v-if="nightCount > 0 && promoApplied && !promoBlockedVilla" class="bf__amount-hint">
              <span>Saran nominal transfer (sudah termasuk diskon): <strong>Rp {{ totalAfterPromo }}</strong></span>
              <button type="button" class="bf__amount-fill" @click="fillAmount">Isi otomatis</button>
            </div>

            <div class="bf__field">
              <label>Penyediaan Lainya — Sewa PS</label>
              <div class="bf__toggle">
                <button
                  type="button"
                  class="bf__toggle-opt"
                  :class="{ 'bf__toggle-opt--on': form.rentPs === 'Tidak' }"
                  @click="form.rentPs = 'Tidak'"
                >
                  Tidak
                </button>
                <button
                  type="button"
                  class="bf__toggle-opt"
                  :class="{ 'bf__toggle-opt--on': form.rentPs === 'Ya' }"
                  @click="form.rentPs = 'Ya'"
                >
                  Ya
                </button>
              </div>
            </div>

            <div class="bf__note">
              <span class="bf__note-icon">📌</span>
              <div>
                <strong>Rekening akan diberikan setelah format terisi</strong>
                <p>Untuk pembayaran DP dan pelunasan tetap menggunakan rekening yang sama.</p>
              </div>
            </div>
          </div>
        </transition>

        <!-- ===== STEP 4: KONFIRMASI ===== -->
        <transition name="bf-slide" mode="out-in">
          <div v-if="step === 4" key="step4" class="bf__section">
            <div class="bf__section-header">
              <div class="bf__section-icon">✅</div>
              <div>
                <h2 class="bf__title">Konfirmasi Booking</h2>
                <p class="bf__subtitle">Pastikan format sudah benar sebelum dikirim</p>
              </div>
            </div>

            <div class="bf__format">
              <pre>{{ formatMessage }}</pre>
            </div>

            <div class="bf__note">
              <span class="bf__note-icon">📌</span>
              <div>
                <strong>Rekening akan diberikan setelah format terisi</strong>
                <p>Setelah mengirim format ke WhatsApp, admin akan memberikan rekening untuk pembayaran DP dan pelunasan.</p>
              </div>
            </div>
          </div>
        </transition>

        <!-- ===== ERROR ===== -->
        <p v-if="error" class="bf__error">
          <span class="bf__error-icon">⚠️</span>
          {{ error }}
        </p>

        <!-- ===== NAVIGATION BUTTONS ===== -->
        <div class="bf__nav">
          <button v-if="step > 1" type="button" class="bf__nav-back" @click="step--">
            ← Kembali
          </button>
          <div v-else></div>
          <button v-if="step < 4" type="submit" class="bf__nav-next">
            Lanjut →
          </button>
          <a v-else :href="waLink" target="_blank" rel="nofollow" class="bf__nav-submit bf__nav-submit--link" @click="submit">
            Kirim ke WhatsApp
          </a>
        </div>
      </form>

      <!-- ===== SUCCESS STATE ===== -->
      <div v-if="done" class="bf__success">
        <div class="bf__success-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="32" fill="#16a34a"/>
            <path d="M20 33l8 8 16-16" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3>Format Booking Terkirim!</h3>
        <p>Terima kasih <strong>{{ form.name }}</strong>. Format booking Anda telah dikirim ke WhatsApp admin The Rain Villas.</p>

        <div class="bf__success-status">
          <div class="bf__status-badge bf__status-badge--pending">⏳ Menunggu Respon Admin</div>
          <p>Admin akan membalas dengan rekening pembayaran. Jika WhatsApp tidak terbuka secara otomatis, tekan tombol di bawah.</p>
        </div>

        <div class="bf__success-meta">
          <div><span>Villa</span><strong>{{ form.villa }}</strong></div>
          <div><span>Tanggal</span><strong>{{ dateRange }}</strong></div>
          <div><span>Nama</span><strong>{{ form.name }}</strong></div>
          <div><span>Nominal Transfer</span><strong>Rp {{ formatNum(form.amount) }}</strong></div>
          <div v-if="promoApplied && !promoBlockedVilla"><span>Kode Promo</span><strong>{{ promoApplied.code }} ({{ promoApplied.label }})</strong></div>
        </div>

        <a :href="waLink" target="_blank" rel="nofollow" class="bf__wa-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.121.554 4.116 1.524 5.85L.05 23.629a.5.5 0 00.613.613l5.779-1.474A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.998 0-3.893-.56-5.544-1.62l-.398-.243-3.474.886.886-3.474-.243-.398A9.72 9.72 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75S21.75 6.615 21.75 12s-4.365 9.75-9.75 9.75z"/></svg>
          Kirim / Buka WhatsApp
        </a>
        <button type="button" class="bf__again" @click="reset">Booking Villa Lain</button>
      </div>
    </div>
  </div>
</template>

<script>
import { getPromo, isPromoActive, isPromoExcluded } from '../data/promos.js';

const BOOKING_API = 'https://script.google.com/macros/s/AKfycbzuvJ1h77RQyTPx9nz_CHjeisiOgvLhksHT60esWOh3BrHnUTVn_9xQrEH30Tv5op7s/exec';
const WHATSAPP = '6282125492037';
const NOTED = [
  '●Setiap yang menginap harap mejaga fasilitas yang tersedia di villa',
  '●Dan tidak membuang sampah sembarangan',
  '',
  '●Format di isi lengkap sesuai nama villa & tanggal',
  '●Pahami dari setiap template masing masing villa',
  '●Pahami CARA DP dan HIMBAUAN yang tertera di profile katalog kita',
  "●Kunci villa akan kami berikan oleh petugas kami sa'at anda check in",
  "●Sebelum masuk harap memberikan ktp/identitas diri kepada petugas kami dan akan dikembalikan kembali sa'at anda check out",
  '●Terimakasih',
];

export default {
  props: {
    initialVillaId: { type: [String, Number], default: null },
  },
  data() {
    return {
      step: 1,
      stepLabels: ['Villa & Tanggal', 'Data Pembooking', 'Pembayaran', 'Konfirmasi'],
      villas: [],
      apiBlockedDates: [],
      loadingBlocked: false,
      done: false,
      error: '',
      villaDropdownOpen: false,
      villaSearch: '',
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      form: {
        villa: '',
        checkIn: '',
        checkOut: '',
        name: '',
        guests: '',
        socialMedia: '',
        transferName: '',
        amount: '',
        rentPs: 'Tidak',
        promo: '',
      },
      promoApplied: null,
      promoStatus: '',
      promoMessage: '',
    };
  },
  watch: {
    'form.villa'(newVal) {
      if (newVal) {
        this.fetchBlockedDates();
      } else {
        this.apiBlockedDates = [];
      }
      this.checkBlockedDates();
    },
    'form.checkIn'() {
      this.checkBlockedDates();
    },
    'form.checkOut'() {
      this.checkBlockedDates();
    },
    'form.promo'() {
      this.promoApplied = null;
      this.promoStatus = '';
      this.promoMessage = '';
    },
  },
  computed: {
    blockedSet() {
      const villa = this.selectedVilla;
      const villaUnavailable = villa && villa.unavailable ? villa.unavailable : [];
      return new Set([...this.apiBlockedDates, ...villaUnavailable, ...this.getAdminBlocked()]);
    },
    progressWidth() {
      return ((this.step - 1) / (this.stepLabels.length - 1)) * 100 + '%';
    },
    calMonthLabel() {
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      ];
      return `${months[this.month]} ${this.year}`;
    },
    calCells() {
      const firstDay = new Date(this.year, this.month, 1).getDay();
      const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
      const cells = [];
      for (let i = 0; i < firstDay; i++) cells.push(null);
      for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d, month: this.month, year: this.year });
      }
      return cells;
    },
    calCheckInDate() {
      return this.form.checkIn ? new Date(this.form.checkIn + 'T00:00:00') : null;
    },
    selectedVilla() {
      return this.villas.find((v) => v.name === this.form.villa) || null;
    },
    promoBlockedVilla() {
      if (!this.promoApplied) return false;
      return isPromoExcluded(this.promoApplied, this.selectedVilla && this.selectedVilla.name);
    },
    filteredVillas() {
      const q = this.villaSearch.trim().toLowerCase();
      if (!q) return this.villas;
      return this.villas.filter((v) => v.name.toLowerCase().includes(q));
    },
    nightCount() {
      if (!this.form.checkIn || !this.form.checkOut) return 0;
      const a = new Date(this.form.checkIn).getTime();
      const b = new Date(this.form.checkOut).getTime();
      const diff = Math.round((b - a) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    },
    totalPriceRaw() {
      if (!this.nightCount) return 0;
      const villa = this.selectedVilla;
      if (!villa || !villa.dayPrices) return 0;
      let total = 0;
      const start = new Date(this.form.checkIn);
      for (let i = 0; i < this.nightCount; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const day = d.getDay();
        total += villa.dayPrices[day] || villa.price;
      }
      return total;
    },
    totalPrice() {
      return this.totalPriceRaw.toLocaleString('id-ID').replace(/,/g, '.');
    },
    discountRaw() {
      if (!this.promoApplied || !this.totalPriceRaw || this.promoBlockedVilla) return 0;
      const v = Number(this.promoApplied.value) || 0;
      return Math.round((this.totalPriceRaw * v) / 100);
    },
    totalAfterPromoRaw() {
      return Math.max(0, this.totalPriceRaw - this.discountRaw);
    },
    discountNum() {
      return this.formatNum(this.discountRaw);
    },
    totalAfterPromo() {
      return this.formatNum(this.totalAfterPromoRaw);
    },
    dateRange() {
      if (!this.form.checkIn) return '-';
      const out = this.form.checkOut ? ' - ' + this.formatDate(this.form.checkOut) : '';
      return this.formatDate(this.form.checkIn) + out;
    },
    formatMessage() {
      const l = (label, value) => `${label} : ${value || '-'}`;
      const lines = [
        'FORMAT BOOKING',
        '',
        '[ The Rain Villas ]',
        '',
        l('Nama villa', this.form.villa),
        l('Tanggal & Bulan', this.dateRange),
        l('Nama pem-booking villa', this.form.name),
        l('Nama pengirim transfer', this.form.transferName),
        l('Nominal transfer', this.form.amount ? 'Rp ' + this.formatNum(this.form.amount) : ''),
        l('Jumlah orang', this.form.guests),
        l('Akun sosial media', this.form.socialMedia),
        '',
        ...(this.promoApplied && !this.promoBlockedVilla
          ? [
            l('Kode promo', this.promoApplied.code),
            l('Potongan promo', `-Rp ${this.formatNum(this.discountRaw)} (${this.promoApplied.label})`),
            l('Total setelah diskon', `Rp ${this.formatNum(this.totalAfterPromoRaw)}`),
            '',
          ]
          : []),
        'Penyediaan lainya',
        l('Sewa ps', this.form.rentPs),
        '',
        'NOTED :',
        '',
        ...NOTED,
        '',
        'REKENING AKAN DI BERIKAN SETELAH FORMAT TERISI',
        '',
        'UNTUK PEMBAYARAN DP DAN PELUNASAN TETAP MENGGUNAKAN REKENING YANG SAMA',
      ];
      return lines.join('\n');
    },
    waLink() {
      const msg = this.formatMessage;
      return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
    },
  },
  async mounted() {
    const mod = await import('../data/villas.js');
    this.villas = mod.villas;

    const params = new URLSearchParams(window.location.search);
    const qVilla = params.get('villa');
    const qCheckIn = params.get('checkIn');
    const qCheckOut = params.get('checkOut');
    const qPromo = params.get('promo');

    if (qVilla) {
      const v = this.villas.find((x) => x.name.toLowerCase() === qVilla.toLowerCase());
      if (v) this.form.villa = v.name;
    }
    if (qCheckIn) this.form.checkIn = qCheckIn;
    if (qCheckOut) this.form.checkOut = qCheckOut;
    if (qPromo) this.form.promo = qPromo;

    if (this.form.checkIn) {
      const d = new Date(this.form.checkIn + 'T00:00:00');
      this.month = d.getMonth();
      this.year = d.getFullYear();
    }

    if (this.initialVillaId && !this.form.villa) {
      const v = this.villas.find((x) => x.id === Number(this.initialVillaId));
      if (v) this.form.villa = v.name;
    }

    if (this.form.villa) {
      this.fetchBlockedDates();
    }

    if (this.form.promo) {
      this.applyPromo();
    }

    document.addEventListener('click', this.onDocClick);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.onDocClick);
  },
  methods: {
    toggleVillaDropdown() {
      this.villaDropdownOpen = !this.villaDropdownOpen;
      if (this.villaDropdownOpen) {
        this.villaSearch = '';
        this.$nextTick(() => {
          if (this.$refs.ddSearch) this.$refs.ddSearch.focus();
        });
      }
    },
    pickVilla(v) {
      this.form.villa = v.name;
      this.villaDropdownOpen = false;
      this.villaSearch = '';
    },
    onDocClick(e) {
      if (this.$refs.ddWrap && !this.$refs.ddWrap.contains(e.target)) {
        this.villaDropdownOpen = false;
        this.villaSearch = '';
      }
    },
    calStr(cell) {
      return `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
    },
    calPrevMonth() {
      if (this.month === 0) {
        this.month = 11;
        this.year--;
      } else {
        this.month--;
      }
    },
    calNextMonth() {
      if (this.month === 11) {
        this.month = 0;
        this.year++;
      } else {
        this.month++;
      }
    },
    calUnavailable(cell) {
      const s = this.calStr(cell);
      const d = new Date(cell.year, cell.month, cell.day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d < today) return true;
      return this.blockedSet.has(s);
    },
    calCheckoutOnly(cell) {
      if (!this.form.checkIn) return false;
      if (!this.calUnavailable(cell)) return false;
      const d = new Date(cell.year, cell.month, cell.day);
      return d.getTime() > this.calCheckInDate.getTime();
    },
    calSelectable(cell) {
      if (this.calUnavailable(cell)) return this.calCheckoutOnly(cell);
      return true;
    },
    calSelected(cell) {
      const s = this.calStr(cell);
      return this.form.checkIn === s || this.form.checkOut === s;
    },
    calInRange(cell) {
      if (!this.form.checkIn || !this.form.checkOut) return false;
      const s = this.calStr(cell);
      return s > this.form.checkIn && s < this.form.checkOut;
    },
    calCellClass(cell) {
      return {
        'bf__cal-cell--unavailable': this.calUnavailable(cell) && !this.calCheckoutOnly(cell),
        'bf__cal-cell--checkout-only': this.calCheckoutOnly(cell),
        'bf__cal-cell--selected': this.calSelected(cell),
        'bf__cal-cell--in-range': this.calInRange(cell),
      };
    },
    calSelect(cell) {
      if (!this.calSelectable(cell)) return;
      const s = this.calStr(cell);
      const d = new Date(cell.year, cell.month, cell.day);

      if (!this.form.checkIn || (this.form.checkIn && this.form.checkOut)) {
        if (this.calUnavailable(cell)) return;
        this.form.checkIn = s;
        this.form.checkOut = '';
      } else {
        if (d.getTime() <= this.calCheckInDate.getTime()) {
          if (this.calUnavailable(cell)) return;
          this.form.checkIn = s;
        } else {
          this.form.checkOut = s;
        }
      }
    },
    fetchBlockedDates() {
      if (!this.form.villa) return;
      this.loadingBlocked = true;
      var villaObj = this.villas.find((v) => v.name === this.form.villa);
      var lookupName = (villaObj && villaObj.scheduleName) || this.form.villa;
      const url = BOOKING_API + '?villa=' + encodeURIComponent(lookupName) + '&_=' + Date.now();
      const callbackName = 'cb_bf_' + Date.now();

      fetch(url, { redirect: 'follow', cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            this.apiBlockedDates = data;
          }
          this.loadingBlocked = false;
          this.checkBlockedDates();
        })
        .catch(() => {
          window[callbackName] = (data) => {
            delete window[callbackName];
            if (Array.isArray(data)) this.apiBlockedDates = data;
            this.loadingBlocked = false;
            this.checkBlockedDates();
          };
          const script = document.createElement('script');
          script.src = url + '&callback=' + callbackName;
          script.onerror = () => {
            delete window[callbackName];
            this.loadingBlocked = false;
          };
          document.head.appendChild(script);
        });
    },
    getAdminBlocked() {
      try {
        const raw = JSON.parse(localStorage.getItem('therainvillas_blocked')) || {};
        if (!this.selectedVilla) return [];
        return raw[String(this.selectedVilla.id)] || [];
      } catch (e) {
        return [];
      }
    },
    checkBlockedDates() {
      if (this.step !== 1) return;
      if (!this.form.checkIn || !this.form.checkOut) return;
      const start = new Date(this.form.checkIn + 'T00:00:00');
      const end = new Date(this.form.checkOut + 'T00:00:00');
      if (start >= end) return;
      const cur = new Date(start);
      while (cur < end) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        if (this.blockedSet.has(dateStr)) {
          this.error = `Villa ${this.form.villa} sudah terbooking pada tanggal ${this.formatDate(dateStr)}. Silakan pilih tanggal atau villa lain.`;
          return;
        }
        cur.setDate(cur.getDate() + 1);
      }
      if (this.error && this.error.indexOf('sudah terbooking') !== -1) this.error = '';
    },
    formatDate(d) {
      if (!d) return '-';
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const dt = new Date(d + 'T00:00:00');
      return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
    },
    formatNum(n) {
      return (Number(n) || 0).toLocaleString('id-ID').replace(/,/g, '.');
    },
    goToStep(n) {
      if (n <= this.step) this.step = n;
    },
    applyPromo() {
      this.error = '';
      const raw = this.form.promo;
      if (!raw || !String(raw).trim()) {
        this.promoApplied = null;
        this.promoStatus = '';
        this.promoMessage = '';
        return;
      }
      const promo = getPromo(raw);
      if (!promo) {
        this.promoApplied = null;
        this.promoStatus = 'invalid';
        this.promoMessage = 'Kode promo tidak valid.';
        return;
      }
      if (!isPromoActive(promo)) {
        this.promoApplied = null;
        this.promoStatus = 'expired';
        this.promoMessage = `Promo sudah berakhir (berlaku s.d. ${this.formatValidUntil(promo.validUntil)}).`;
        return;
      }
      if (!this.isPromoClaimed(promo.code)) {
        this.promoApplied = null;
        this.promoStatus = 'invalid';
        this.promoMessage = `Kode ${promo.code} belum diklaim. Klaim dulu dengan memberi rating di Google Maps kantor The Rain Villas melalui halaman Promo.`;
        return;
      }
      this.promoApplied = promo;
      this.promoStatus = 'valid';
      this.promoMessage = `Kode ${promo.code} diterapkan — ${promo.label}.`;
    },
    clearPromo() {
      this.form.promo = '';
      this.promoApplied = null;
      this.promoStatus = '';
      this.promoMessage = '';
    },
    fillAmount() {
      if (!this.totalAfterPromoRaw) return;
      this.form.amount = String(this.totalAfterPromoRaw);
    },
    formatValidUntil(dt) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const d = new Date(dt);
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    },
    isPromoClaimed(code) {
      try {
        let claims = {};
        try {
          const stored = JSON.parse(localStorage.getItem('trv_promo_claimed') || '{}');
          if (stored && typeof stored === 'object') claims = stored;
        } catch (e) {}
        try {
          const cm = document.cookie.match(/(?:^|;\s*)trv_promo_claimed=([^;]*)/);
          if (cm) {
            const ck = JSON.parse(decodeURIComponent(cm[1]));
            if (ck && typeof ck === 'object') Object.assign(claims, ck);
          }
        } catch (e) {}
        const key = String(code).trim().toUpperCase();
        const val = claims[key];
        if (val === true) return true;
        return typeof val === 'number' && Date.now() - val <= 10 * 60 * 1000;
      } catch (e) {
        return false;
      }
    },
    validateStep() {
      this.error = '';
      if (this.step === 1) {
        if (!this.form.villa) { this.error = 'Silakan pilih villa terlebih dahulu.'; return false; }
        if (!this.form.checkIn || !this.form.checkOut) { this.error = 'Silakan pilih tanggal masuk dan check-out.'; return false; }
        if (this.nightCount <= 0) { this.error = 'Tanggal check-out harus setelah tanggal masuk.'; return false; }

        // Check date overlap with blocked dates
        const start = new Date(this.form.checkIn + 'T00:00:00');
        const end = new Date(this.form.checkOut + 'T00:00:00');
        const blockedSet = this.blockedSet;

        const cur = new Date(start);
        while (cur < end) {
          const y = cur.getFullYear();
          const m = String(cur.getMonth() + 1).padStart(2, '0');
          const d = String(cur.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${d}`;
          if (blockedSet.has(dateStr)) {
            this.error = `Villa ${this.form.villa} sudah terbooking pada tanggal ${this.formatDate(dateStr)}. Silakan pilih tanggal atau villa lain.`;
            return false;
          }
          cur.setDate(cur.getDate() + 1);
        }
      }
      if (this.step === 2) {
        if (!this.form.name.trim()) { this.error = 'Nama pem-booking villa wajib diisi.'; return false; }
        if (!this.form.guests || Number(this.form.guests) <= 0) { this.error = 'Jumlah orang wajib diisi.'; return false; }
      }
      if (this.step === 3) {
        if (!this.form.transferName.trim()) { this.error = 'Nama pengirim transfer wajib diisi.'; return false; }
        if (Number(this.form.amount) <= 0) { this.error = 'Masukkan nominal transfer dengan benar.'; return false; }
      }
      return true;
    },
    handleNext() {
      if (!this.validateStep()) return;
      if (this.step < 4) {
        this.step++;
      }
    },
    submit() {
      this.done = true;
    },
    reset() {
      this.done = false;
      this.step = 1;
      this.form = {
        villa: '', checkIn: '', checkOut: '', name: '', guests: '',
        socialMedia: '', transferName: '', amount: '', rentPs: 'Tidak', promo: '',
      };
      this.promoApplied = null;
      this.promoStatus = '';
      this.promoMessage = '';
    },
  },
};
</script>

<style scoped>
/* ===== PROGRESS BAR ===== */
.bf__progress {
  max-width: 580px;
  margin: 0 auto 28px;
  padding: 0 16px;
}
.bf__progress-track {
  height: 4px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 16px;
}
.bf__progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #5b8def, #7a5ce0);
  border-radius: 4px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.bf__steps {
  display: flex;
  justify-content: space-between;
}
.bf__step-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  padding: 0;
  opacity: 0.4;
  transition: opacity 0.3s;
}
.bf__step-dot--active,
.bf__step-dot--done {
  opacity: 1;
}
.bf__step-dot:disabled {
  cursor: default;
}
.bf__step-num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  background: #e2e8f0;
  color: #64748b;
  transition: all 0.3s;
}
.bf__step-dot--active .bf__step-num {
  background: linear-gradient(135deg, #5b8def, #7a5ce0);
  color: #fff;
  box-shadow: 0 4px 14px rgba(91, 141, 239, 0.35);
}
.bf__step-dot--done .bf__step-num {
  background: #16a34a;
  color: #fff;
}
.bf__step-label {
    font-size: 0.6rem;
    font-weight: 500;
    color: #64748b;
    white-space: normal;
    text-align: center;
    line-height: 1.2;
    max-width: 66px;
  }
.bf__step-dot--active .bf__step-label {
  color: #7a5ce0;
  font-weight: 600;
}

/* ===== CARD ===== */
.bf__card {
  background: #fff;
  border-radius: 24px;
  padding: 40px 36px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0,0,0,0.03);
  max-width: 580px;
  margin: 0 auto;
}

/* ===== FORMAT GUIDE ===== */
.bf__guide {
  margin-bottom: 28px;
  padding: 18px 20px;
  background: linear-gradient(135deg, #faf7ff, #f0f4ff);
  border: 1px solid #e6e0f5;
  border-radius: 16px;
}
.bf__guide-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.bf__guide-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #7a5ce0;
  background: rgba(122, 92, 224, 0.08);
  padding: 5px 12px;
  border-radius: 20px;
}
.bf__guide-brand {
  font-size: 0.85rem;
  font-weight: 700;
  color: #7a5ce0;
}
.bf__guide-desc {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0 0 12px;
  line-height: 1.6;
}
.bf__guide-fields {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px 14px;
}
.bf__guide-fields span {
  font-size: 0.78rem;
  color: #475569;
  position: relative;
  padding-left: 14px;
}
.bf__guide-fields span::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5b8def, #7a5ce0);
}

/* ===== SECTION HEADER ===== */
.bf__section-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}
.bf__section-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(91,141,239,0.1), rgba(124,155,247,0.08));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}
.bf__title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #11120f;
  margin: 0;
}
.bf__subtitle {
  color: #94a3b8;
  font-size: 0.85rem;
  margin: 2px 0 0;
}

/* ===== SECTION TRANSITIONS ===== */
.bf__section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.bf-slide-enter-active,
.bf-slide-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.bf-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.bf-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* ===== FIELDS ===== */
.bf__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.bf__field label {
  font-weight: 600;
  font-size: 0.85rem;
  color: #334155;
}
.bf__req {
  color: #ef4444;
}
.bf__field input,
.bf__field select {
  width: 100%;
  padding: 13px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  font-family: inherit;
  font-size: 0.95rem;
  background: #fff;
  transition: all 0.2s;
}
.bf__field input:focus,
.bf__field select:focus {
  outline: none;
  border-color: #5b8def;
  box-shadow: 0 0 0 4px rgba(91, 141, 239, 0.1);
}
.bf__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

/* ===== CUSTOM VILLA DROPDOWN ===== */
.bf__dd {
  position: relative;
}
.bf__dd-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}
.bf__dd-trigger:hover {
  border-color: #cbd5e1;
}
.bf__dd-trigger--open {
  border-color: #5b8def;
  box-shadow: 0 0 0 4px rgba(91, 141, 239, 0.1);
}
.bf__dd-trigger-img {
  width: 52px;
  height: 40px;
  object-fit: cover;
  border-radius: 10px;
  flex-shrink: 0;
}
.bf__dd-trigger-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.bf__dd-trigger-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #11120f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bf__dd-trigger-sub {
  font-size: 0.75rem;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bf__dd-placeholder {
  flex: 1;
  color: #94a3b8;
  font-size: 0.95rem;
}
.bf__dd-caret {
  flex-shrink: 0;
  color: #64748b;
  transition: transform 0.25s;
}
.bf__dd-caret--open {
  transform: rotate(180deg);
}
.bf__dd-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 30;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(15, 23, 42, 0.14);
  overflow: hidden;
}
.bf__dd-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  color: #94a3b8;
}
.bf__dd-search input {
  flex: 1;
  border: none;
  outline: none;
  font-family: inherit;
  font-size: 0.9rem;
  color: #1e293b;
  background: transparent;
}
.bf__dd-search input::placeholder {
  color: #cbd5e1;
}
.bf__dd-list {
  max-height: 280px;
  overflow-y: auto;
  padding: 6px;
}
.bf__dd-list::-webkit-scrollbar {
  width: 6px;
}
.bf__dd-list::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 3px;
}
.bf__dd-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 12px;
  background: transparent;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}
.bf__dd-option:hover {
  background: #f1f5f9;
}
.bf__dd-option--active {
  background: rgba(91, 141, 239, 0.08);
  box-shadow: inset 0 0 0 1.5px #5b8def;
}
.bf__dd-option-img {
  width: 46px;
  height: 36px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}
.bf__dd-option-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.bf__dd-option-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bf__dd-option-meta {
  font-size: 0.72rem;
  color: #94a3b8;
}
.bf__dd-option-price {
  font-size: 0.72rem;
  font-weight: 700;
  color: #5b8def;
  background: rgba(91, 141, 239, 0.08);
  padding: 4px 10px;
  border-radius: 20px;
  white-space: nowrap;
}
.bf__dd-empty {
  text-align: center;
  color: #94a3b8;
  font-size: 0.85rem;
  padding: 24px 0;
  margin: 0;
}
.bf-dd-enter-active,
.bf-dd-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.bf-dd-enter-from,
.bf-dd-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ===== VILLA PREVIEW ===== */
.bf__villa-preview {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}
.bf__villa-preview img {
  width: 72px;
  height: 52px;
  object-fit: cover;
  border-radius: 10px;
  flex-shrink: 0;
}
.bf__villa-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.bf__villa-info strong {
  font-size: 0.95rem;
  color: #11120f;
}
.bf__villa-info span {
  font-size: 0.78rem;
  color: #94a3b8;
}
.bf__villa-price {
  color: #7a5ce0 !important;
  font-weight: 600;
}

/* ===== CALENDAR ===== */
.bf__dates {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
}
.bf__cal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.bf__cal-nav {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 6px 14px;
  font-family: inherit;
  font-size: 1rem;
  cursor: pointer;
  color: #334155;
  transition: all 0.2s;
}
.bf__cal-nav:hover {
  border-color: #5b8def;
  color: #5b8def;
}
.bf__cal-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #11120f;
}
.bf__cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.bf__cal-dow {
  text-align: center;
  font-size: 0.72rem;
  font-weight: 600;
  color: #94a3b8;
  padding: 6px 0;
}
.bf__cal-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  background: #fff;
  font-family: inherit;
  font-size: 0.85rem;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
.bf__cal-cell:hover:not(:disabled):not(.bf__cal-cell--unavailable) {
  background: rgba(91, 141, 239, 0.12);
  border-radius: 10px;
}
.bf__cal-cell--empty {
  background: transparent;
  box-shadow: none;
  cursor: default;
}
.bf__cal-cell--unavailable {
  color: #cbd5e1;
  text-decoration: line-through;
  background: #f1f5f9;
  cursor: not-allowed;
  box-shadow: none;
}
.bf__cal-cell--checkout-only {
  color: #b45309;
  background: #fef3c7;
  box-shadow: 0 1px 3px rgba(180, 83, 9, 0.15);
}
.bf__cal-cell--selected {
  background: linear-gradient(135deg, #5b8def, #7a5ce0);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 0 0 2px rgba(91, 141, 239, 0.35);
}
.bf__cal-cell--in-range {
  background: rgba(91, 141, 239, 0.18);
}
.bf__cal-selection {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.bf__cal-tag {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 6px 12px;
}
.bf__cal-tag-label {
  font-size: 0.68rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.bf__cal-tag-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: #11120f;
}
.bf__cal-legend {
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 12px;
  text-align: center;
}

/* ===== PRICE CARD ===== */
.bf__price-card {
  background: linear-gradient(135deg, rgba(91,141,239,0.06), rgba(122,92,224,0.04));
  border: 1px solid rgba(91, 141, 239, 0.2);
  border-radius: 16px;
  padding: 16px 20px;
}
.bf__price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #333;
}
.bf__price-row strong {
  color: #7a5ce0;
  font-size: 1.2rem;
}
.bf__price-note {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 6px;
}

/* ===== PROMO ===== */
.bf__promo {
  margin-top: 14px;
  border-top: 1px dashed rgba(91, 141, 239, 0.25);
  padding-top: 14px;
}
.bf__promo-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.bf__promo-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #334155;
}
.bf__promo-chip {
  background: linear-gradient(135deg, rgba(91,141,239,0.12), rgba(122,92,224,0.1));
  color: #7a5ce0;
  border: 1px solid rgba(122, 92, 224, 0.3);
  border-radius: 20px;
  padding: 4px 12px;
  font-family: inherit;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.bf__promo-chip:hover {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #dc2626;
}
.bf__promo-row {
  display: flex;
  gap: 8px;
}
.bf__promo-row input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.9rem;
  text-transform: uppercase;
  transition: all 0.2s;
  background: #fff;
}
.bf__promo-row input:focus {
  outline: none;
  border-color: #5b8def;
  box-shadow: 0 0 0 4px rgba(91, 141, 239, 0.1);
}
.bf__promo-btn {
  background: linear-gradient(135deg, #5b8def, #7a5ce0);
  border: none;
  border-radius: 10px;
  padding: 10px 18px;
  color: #fff;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.bf__promo-btn:hover {
  filter: brightness(1.05);
}
.bf__promo-msg {
  font-size: 0.78rem;
  margin: 8px 0 0;
  line-height: 1.5;
}
.bf__promo-msg--ok {
  color: #16a34a;
}
.bf__promo-msg--err {
  color: #dc2626;
}
.bf__promo-msg--warn {
  color: #b45309;
}
.bf__price-detail {
  margin-top: 12px;
  border-top: 1px dashed #e2e8f0;
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.bf__price-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
  color: #475569;
}
.bf__price-detail-row strong {
  font-size: 0.9rem;
  color: #334155;
}
.bf__price-detail-row--discount strong {
  color: #16a34a;
}
.bf__price-detail-row--total {
  padding-top: 6px;
  border-top: 1px solid #e2e8f0;
}
.bf__price-detail-row--total span {
  font-weight: 700;
  color: #11120f;
}
.bf__price-detail-row--total strong {
  color: #7a5ce0;
  font-size: 1.05rem;
}
.bf__amount-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 0.8rem;
  color: #166534;
}
.bf__amount-hint strong {
  color: #15803d;
}
.bf__amount-fill {
  background: linear-gradient(135deg, #16a34a, #15803d);
  border: none;
  border-radius: 10px;
  padding: 8px 16px;
  color: #fff;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.bf__amount-fill:hover {
  filter: brightness(1.08);
}

/* ===== TOGGLE ===== */
.bf__toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.bf__toggle-opt {
  padding: 13px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}
.bf__toggle-opt--on {
  background: linear-gradient(135deg, #5b8def, #7a5ce0);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 4px 14px rgba(91, 141, 239, 0.3);
}

/* ===== NOTE ===== */
.bf__note {
  display: flex;
  gap: 10px;
  padding: 14px 16px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 14px;
  align-items: flex-start;
}
.bf__note-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
  margin-top: 1px;
}
.bf__note strong {
  font-size: 0.85rem;
  color: #92400e;
  display: block;
  margin-bottom: 2px;
}
.bf__note p {
  font-size: 0.8rem;
  color: #a16207;
  margin: 0;
  line-height: 1.5;
}

/* ===== FORMAT PREVIEW ===== */
.bf__format {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px 20px;
  overflow: hidden;
}
.bf__format pre {
  margin: 0;
  font-family: 'Consolas', 'Menlo', monospace;
  font-size: 0.78rem;
  line-height: 1.65;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ===== ERROR ===== */
.bf__error {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #dc2626;
  font-size: 0.88rem;
  text-align: center;
  background: #fef2f2;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #fecaca;
  margin-top: 8px;
}
.bf__error-icon {
  flex-shrink: 0;
}

/* ===== NAV BUTTONS ===== */
.bf__nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  gap: 12px;
}
.bf__nav-back {
  background: none;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  padding: 12px 24px;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
}
.bf__nav-back:hover {
  border-color: #cbd5e1;
  color: #334155;
}
.bf__nav-next {
  background: linear-gradient(135deg, #0d1b2b, #1e3a5f);
  border: none;
  border-radius: 14px;
  padding: 14px 32px;
  color: #fff;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  margin-left: auto;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(13, 27, 43, 0.25);
}
.bf__nav-next:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(13, 27, 43, 0.35);
}
.bf__nav-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #25d366;
  border: none;
  border-radius: 14px;
  padding: 15px 36px;
  color: #fff;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-left: auto;
  text-decoration: none;
  box-shadow: 0 4px 16px rgba(37, 211, 102, 0.3);
  transition: all 0.2s;
}
.bf__nav-submit:hover {
  background: #1da851;
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(37, 211, 102, 0.4);
}

/* ===== SUCCESS ===== */
.bf__success {
  text-align: center;
  padding: 10px 0;
}
.bf__success-icon {
  margin-bottom: 20px;
  animation: bf-pop 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes bf-pop {
  0% { transform: scale(0); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
.bf__success h3 {
  font-size: 1.4rem;
  margin-bottom: 8px;
  color: #11120f;
}
.bf__success > p {
  color: #64748b;
  margin-bottom: 20px;
  line-height: 1.6;
}
.bf__success-status {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 20px;
}
.bf__status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 8px;
}
.bf__status-badge--pending {
  background: #fef3c7;
  color: #92400e;
}
.bf__success-status p {
  font-size: 0.82rem;
  color: #92400e;
  margin: 0;
}
.bf__success-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  text-align: left;
  background: #f8fafc;
  border-radius: 14px;
  padding: 18px;
  margin-bottom: 20px;
}
.bf__success-meta div {
  display: flex;
  flex-direction: column;
}
.bf__success-meta span {
  font-size: 0.7rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.bf__success-meta strong {
  font-size: 0.95rem;
  color: #11120f;
}
.bf__wa-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px;
  border-radius: 14px;
  background: #25d366;
  color: #fff;
  font-weight: 600;
  text-decoration: none;
  margin-bottom: 10px;
  font-size: 1rem;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(37, 211, 102, 0.3);
}
.bf__wa-btn:hover {
  background: #1da851;
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(37, 211, 102, 0.4);
}
.bf__again {
  background: none;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 24px;
  font-family: inherit;
  cursor: pointer;
  color: #64748b;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.bf__again:hover {
  border-color: #cbd5e1;
  color: #334155;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 480px) {
  .bf__row {
    grid-template-columns: 1fr;
  }
  .bf__card {
    padding: 28px 20px;
    border-radius: 20px;
  }
  .bf__steps {
    gap: 4px;
  }
  .bf__step-label {
    font-size: 0.6rem;
  }
  .bf__step-num {
    width: 28px;
    height: 28px;
    font-size: 0.72rem;
  }
  .bf__nav-next,
  .bf__nav-submit {
    padding: 13px 20px;
    font-size: 0.9rem;
  }
  .bf__section-header {
    gap: 10px;
  }
  .bf__section-icon {
    width: 40px;
    height: 40px;
    font-size: 1.1rem;
  }
  .bf__title {
    font-size: 1.1rem;
  }
  .bf__villa-preview {
    flex-direction: column;
    text-align: center;
  }
  .bf__guide-fields {
    grid-template-columns: 1fr;
  }
  .bf__success-meta {
    grid-template-columns: 1fr;
  }
}
</style>