/**
 * Google Apps Script — Booking API & Satisfaction Form
 *
 * SUMBER KETERSEDIAAN / JADWAL VILLA:
 * Skrip membaca 2 sumber tanggal terbooking:
 *   1. Sheet 'Sheet1' → JADWAL MANUAL (sumber utama). Hanya 2 kolom:
 *        Kolom A : Tanggal / Tanggal mulai (mis. "12 Des 2025" atau "2025-12-12")
 *        Kolom B : Nama Villa
 *      Setiap baris yang tanggalnya terisi = tanggal terbooking, otomatis diblokir
 *      di kalender booking. Rentang juga boleh ditulis dalam satu sel:
 *      "12 Des 2025 - 14 Des 2025". Urutan kolom diabaikan (terdeteksi otomatis)
 *      dan baris header ("Tanggal"/"Nama Villa") di atas kolom boleh ada — dilewati.
 *   2. Sheet 'Booking' → record lama & verifikasi dari admin (baris 'Ditolak' dilewati),
 *      agar booking lama tidak tiba-tiba terbuka.
 *
 * Cara deploy:
 * 1. Buka Script Editor di spreadsheet kamu (atau https://script.google.com)
 * 2. Copy paste seluruh kode ini
 * 3. Ganti SPREADSHEET_ID dengan ID spreadsheet kamu (default sudah spreadsheet live)
 * 4. (Opsional) Jika masih ada sheet 'DATA' lama, jalankan fungsi migrateDataSheet()
 * 5. Klik Deploy > Manage deployments > pilih deployment > Edit > Version "New version"
 *    - Execute as: Me (Email kamu)
 *    - Who has access: Anyone (Siapa saja)  <-- SANGAT PENTING!
 * 6. Klik Deploy.
 * 7. Tes: buka URL web app + ?villa=Nama%20Villa
 */

const SPREADSHEET_ID = '1Ejv_rcKsN7sN-fzZ5gdf8FsrS1ey6Z0Xc3Vi_XuFWmA';
/** Tanda versi — wajib tampil di output debug untuk memastikan file yang ter-deploy sama dgn repo. */
var __GS_VERSION__ = 'SV-20260907-v10';
/** Nama sheet jadwal manual (tiap baris = villa + tanggal/rentang terbooking). */
const SCHEDULE_SHEET = 'Sheet1';

function getSS() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== 'YOUR_SPREADSHEET_ID_HERE') {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (err) {
      console.warn('Gagal openById SPREADSHEET_ID, mencoba getActiveSpreadsheet:', err);
    }
  }
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error('Spreadsheet ID tidak valid. Harap isi SPREADSHEET_ID dengan ID spreadsheet yang benar.');
}

/**
 * Generate Booking ID format: SV-YYYYMMDD-XXXX
 */
function generateBookingId() {
  var now = new Date();
  var y = now.getFullYear();
  var m = String(now.getMonth() + 1).padStart(2, '0');
  var d = String(now.getDate()).padStart(2, '0');
  var rand = String(Math.floor(1000 + Math.random() * 9000));
  return 'SV-' + y + m + d + '-' + rand;
}

function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  var str = String(val).trim();
  if (!str) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    var p = str.split('T')[0].split('-');
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
    var p2 = str.split('/');
    return new Date(parseInt(p2[2], 10), parseInt(p2[1], 10) - 1, parseInt(p2[0], 10));
  }
  var d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function monthNum(name) {
  var months = {
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mei': 4, 'jun': 5,
    'jul': 6, 'agu': 7, 'aug': 7, 'sep': 8, 'okt': 9, 'nov': 10,
    'des': 11, 'dec': 11
  };
  var key = String(name || '').toLowerCase().substring(0, 3);
  return months[key] !== undefined ? months[key] : -1;
}

/**
 * Normalisasi nama villa untuk pencocokan (case-insensitive, awalan "Villa "
 * dihapus, spasi berlebih digabung).
 * Contoh: "Villa Kaca  1 " -> "kaca 1"
 */
function normalizeVilla(v) {
  return String(v || '').toLowerCase().replace(/^villa\s+/i, '').replace(/\s+/g, ' ').trim();
}

/**
 * Parsing tanggal jadwal manual. Mendukung:
 * - "12 Des 2025" / "12 Desember 2025" / "5 Aug 2026"
 * - format yang sudah ditangani parseDate (YYYY-MM-DD, DD/MM/YYYY, dan lainnya)
 */
function parseManualDate(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  var str = String(val).replace(/,/g, '').trim();
  if (!str) return null;

  var m = str.match(/^(\d{1,2})\s*[-/.\s]\s*([A-Za-z]+)\s*[-/.\s]\s*(\d{2,4})/);
  if (m) {
    var mn = monthNum(m[2]);
    if (mn > -1) {
      var dd = parseInt(m[1], 10);
      var yy = parseInt(m[3], 10);
      if (yy < 100) yy += 2000;
      var dt = new Date(yy, mn, dd);
      if (!isNaN(dt.getTime()) && dt.getDate() === dd && dt.getMonth() === mn) return dt;
    }
  }

  return parseDate(str);
}

/**
 * Deteksi rentang tanggal dalam satu sel:
 * "12 Des 2025 - 14 Des 2025", "12/12/2025 s/d 14/12/2025", dst.
 */
function parseRangeCell(val) {
  if (!val) return null;
  if (val instanceof Date) return null;
  var str = String(val).trim();
  var seps = [' sampai dengan ', ' - ', ' – ', ' — ', ' s/d ', ' sampai ', ' hingga '];
  for (var i = 0; i < seps.length; i++) {
    var idx = str.toLowerCase().indexOf(seps[i]);
    if (idx === -1) continue;
    var startRaw = str.slice(0, idx).trim();
    var endRaw = str.slice(idx + seps[i].length).trim();
    if (!startRaw || !endRaw) return null;
    var start = parseManualDate(startRaw);
    if (!start) return null;
    var end = parseManualDate(endRaw);
    if (!end) return null;
    if (end.getTime() <= start.getTime()) return null;
    return { start: start, end: end };
  }
  return null;
}

/**
 * Ubah isi satu sel menjadi { start, end } bila sel berisi tanggal / rentang.
 * Mengembalikan null bila sel bukan tanggal.
 */
function cellRange(v) {
  if (v === null || v === undefined) return null;
  var r = parseRangeCell(v);
  if (r) return r;
  var d = parseManualDate(v);
  return d ? { start: d, end: null } : null;
}

/**
 * GET /?villa=Nama%20Villa
 * Mengembalikan array tanggal YYYY-MM-DD yang sudah terbooking untuk villa tertentu.
 *
 * GET /?action=bookings
 * Mengembalikan seluruh data booking (untuk admin dashboard).
 */
function doGet(e) {
  try {
    var villaName = e && e.parameter ? e.parameter.villa : null;
    var callback = e && e.parameter ? e.parameter.callback : null;
    var action = e && e.parameter ? e.parameter.action : null;

    var ss = getSS();

    // DIAGNOSTIK — dump isi mentah sebuah tab (baris per baris).
    // Akses: ?action=sheet&tab=Sheet1
    if (action === 'sheet') {
      var tabName = e.parameter.tab || 'Sheet1';
      var shx = ss.getSheetByName(tabName);
      if (!shx) return respond({ error: 'Tab tidak ditemukan: ' + tabName }, callback);
      var vals = shx.getLastRow() >= 1 ? shx.getDataRange().getValues() : [];
      var rows = [];
      var tz = Session.getScriptTimeZone();
      for (var ri2 = 0; ri2 < vals.length; ri2++) {
        var rowOut = [];
        for (var rj = 0; rj < vals[ri2].length; rj++) {
          var vv = vals[ri2][rj];
          if (vv instanceof Date) rowOut.push('DATE:' + Utilities.formatDate(vv, tz, 'yyyy-MM-dd'));
          else if (vv === null || vv === undefined) rowOut.push('');
          else rowOut.push(String(vv));
        }
        rows.push(rowOut);
      }
      return respond({ tab: tabName, rows: rows }, callback);
    }

    // DIAGNOSTIK — debug penelusuran baris sesuai logika scan jadwal.
    // Akses: ?action=debugvilla&villa=kaca%201
    if (action === 'debugvilla') {
      function normInline(v) {
        return String(v || '').toLowerCase().replace(/^villa\s+/i, '').replace(/\s+/g, ' ').trim();
      }
      var targetQ = normInline(villaName || 'kaca 1');
      var schedSh = ss.getSheetByName(SCHEDULE_SHEET);
      var dbg = {
        version: __GS_VERSION__,
        target: targetQ,
        targetNormGlobal: normalizeVilla(villaName || 'kaca 1'),
        selfTest: {
          'kaca 1': normInline('kaca 1'),
          'Kaca 1': normInline('Kaca 1'),
          '  kaca   1 ': normInline('  kaca   1 '),
          'Villa Kaca 1': normInline('Villa Kaca 1'),
          'the helina': normInline('the helina'),
          calmora: normInline('calmora')
        },
        tabs: ss.getSheets().map(function (s) { return s.getName(); }),
        scheduleTab: SCHEDULE_SHEET,
        scheduleLastRow: schedSh ? schedSh.getLastRow() : 0,
        scheduleLastColumn: schedSh ? schedSh.getLastColumn() : 0,
        rowsMatchingRaw: 0,
        rowsMatched: 0,
        skippedNoDateRow: 0,
        skippedNoVillaRow: 0,
        kacaCells: {},
        sample: []
      };
      if (schedSh && schedSh.getLastRow() >= 1) {
        var svals = schedSh.getDataRange().getValues();
        var tzS = Session.getScriptTimeZone();
        for (var dsi = 0; dsi < svals.length; dsi++) {
          var dRow = svals[dsi];
          var dDate = null;
          var dVilla = '';
          var raw = [];
          var rawMatch = false;
          for (var dcc = 0; dcc < dRow.length; dcc++) {
            var dv = dRow[dcc];
            if (dv === null || dv === undefined) { raw.push(''); continue; }
            if (dv instanceof Date) {
              raw.push('DATE:' + Utilities.formatDate(dv, tzS, 'yyyy-MM-dd'));
              dDate = { start: dv, end: null };
              continue;
            }
            var dvStr = String(dv);
            raw.push(dvStr);
            if (dvStr.toLowerCase().indexOf('kaca') !== -1) {
              dbg.kacaCells[dvStr] = (dbg.kacaCells[dvStr] || 0) + 1;
            }
            var dvr = cellRange(dv);
            if (dvr) { dDate = dvr; continue; }
            if (dvStr.trim() !== '') {
              dVilla = dvStr;
              if (normInline(dvStr) === targetQ) rawMatch = true;
            }
          }
          if (rawMatch) {
            dbg.rowsMatchingRaw++;
            if (!dDate) { dbg.skippedNoDateRow++; }
            if (!dVilla) { dbg.skippedNoVillaRow++; }
            var matchedDone = !!(dDate && dVilla && normInline(dVilla) === targetQ);
            if (matchedDone) dbg.rowsMatched++;
            if (dbg.sample.length < 40 || matchedDone) {
              dbg.sample.push({
                row: dsi + 1,
                cells: raw,
                dateVal: dDate ? Utilities.formatDate(dDate.start, tzS, 'yyyy-MM-dd') + (dDate.end ? '..' + Utilities.formatDate(dDate.end, tzS, 'yyyy-MM-dd') : '') : null,
                villaVal: dVilla,
                matched: matchedDone
              });
            }
          }
        }
      }
      return respond(dbg, callback);
    }

    // DIAGNOSTIK — daftarkan SEMUA sel teks di seluruh tab spreadsheet,
    // lengkap dengan nama tab & jumlah kemunculan. Dipakai untuk mengetahui
    // ejaan nama villa yang sebenarnya ada di sheet (mis. Kaca 1 / Kaca 2).
    // Akses: ?action=villas
    if (action === 'villas' || action === 'debug') {
      var tabs = [];
      var allSheets = ss.getSheets();
      for (var ti = 0; ti < allSheets.length; ti++) {
        var sh = allSheets[ti];
        var vals = sh.getLastRow() >= 1 ? sh.getDataRange().getValues() : [];
        var cellMap = {};
        for (var yi = 0; yi < vals.length; yi++) {
          for (var xi = 0; xi < vals[yi].length; xi++) {
            var cv = vals[yi][xi];
            if (cv === null || cv === undefined) continue;
            if (cv instanceof Date) continue;
            var s = String(cv).trim();
            if (!s) continue;
            cellMap[s] = (cellMap[s] || 0) + 1;
          }
        }
        tabs.push({ name: sh.getName(), cells: cellMap });
      }
      return respond({ tabs: tabs }, callback);
    }

    // Ambil ulasan dari sheet 'Kepuasan Tamu' (sumber data utama ulasan).
    // Optional: ?villa=Nama%20Villa untuk filter per villa.
    if (action === 'reviews') {
      var reviews = [];
      var revSheet = ss.getSheetByName('Kepuasan Tamu');
      if (revSheet && revSheet.getLastRow() > 1) {
        var revRows = revSheet.getDataRange().getValues();
        var revHeaders = revRows[0].map(function (h) { return String(h).trim(); });
        var villaFilter = villaName ? normalizeVilla(villaName) : null;

        for (var ri = 1; ri < revRows.length; ri++) {
          var rRow = revRows[ri];
          var rObj = { villa: '', rating: '', name: '', message: '', timestamp: '' };
          for (var rc = 0; rc < revHeaders.length; rc++) {
            var h = revHeaders[rc];
            var v = rRow[rc];
            if (v instanceof Date) v = v.toISOString();
            if (h === 'Timestamp') rObj.timestamp = v;
            else if (h === 'Rating') rObj.rating = v;
            else if (h === 'Villa') rObj.villa = v;
            else if (h === 'Nama') rObj.name = v;
            else if (h === 'Kesan & Pesan') rObj.message = v;
            else rObj[h] = v;
          }
          if (villaFilter) {
            var villaNorm = normalizeVilla(rObj.villa);
            if (villaNorm !== villaFilter) continue;
          }
          reviews.push(rObj);
        }
      }
      return respond({ reviews: reviews }, callback);
    }

    // Admin dashboard — ambil semua booking dari sheet 'Booking'
    if (action === 'bookings') {
      var bookings = [];
      var headers2 = ['Booking ID', 'Timestamp', 'Villa', 'Check-in', 'Check-out', 'Malam', 'Nama', 'WhatsApp', 'Email', 'Jumlah Tamu', 'Metode Bayar', 'Jumlah Transfer', 'Total Harga', 'Bukti Bayar', 'Status'];
      var tz = Session.getScriptTimeZone();

      // 1. Ambil dari 'Booking'
      var sheet2 = ss.getSheetByName('Booking');
      if (sheet2 && sheet2.getLastRow() > 1) {
        var rows2 = sheet2.getDataRange().getValues();
        headers2 = rows2[0];
        for (var r = 1; r < rows2.length; r++) {
          var row = rows2[r];
          var obj = {};
          for (var c = 0; c < headers2.length; c++) {
            var val = row[c];
            if (val instanceof Date) {
              val = Utilities.formatDate(val, tz, 'yyyy-MM-dd HH:mm');
            }
            obj[headers2[c]] = val;
          }
          bookings.push(obj);
        }
      }

      return respond({ bookings: bookings, headers: headers2 }, callback);
    }

    if (!villaName) {
      return respond({ status: 'ok', message: 'API Summervills aktif. Gunakan ?villa=Nama%20Villa atau ?action=bookings' }, callback);
    }

    var targetVilla = normalizeVilla(villaName);
    var bookedDatesSet = {};

    function normInline(v) {
      return String(v || '').toLowerCase().replace(/^villa\s+/i, '').replace(/\s+/g, ' ').trim();
    }
    var targetVillaInline = normInline(villaName);

    function addDateRange(startDate, endDate) {
      if (!startDate) return;
      var cur = new Date(startDate.getTime());
      cur.setHours(0, 0, 0, 0);
      var end = endDate ? new Date(endDate.getTime()) : null;
      if (end) end.setHours(0, 0, 0, 0);

      if (!end || end.getTime() <= cur.getTime()) {
        var y = cur.getFullYear();
        var m = String(cur.getMonth() + 1).padStart(2, '0');
        var d = String(cur.getDate()).padStart(2, '0');
        bookedDatesSet[y + '-' + m + '-' + d] = true;
      } else {
        while (cur.getTime() < end.getTime()) {
          var y2 = cur.getFullYear();
          var m2 = String(cur.getMonth() + 1).padStart(2, '0');
          var d2 = String(cur.getDate()).padStart(2, '0');
          bookedDatesSet[y2 + '-' + m2 + '-' + d2] = true;
          cur.setDate(cur.getDate() + 1);
        }
      }
    }

    // 2. Scan sheet 'Sheet1' — JADWAL MANUAL (sumber utama ketersediaan).
    //
    //    DUA LAYOUT DITANGANI:
    //   A) LAYOUT MATRIKS (umum dipakai saat ini):
    //      Baris header berisi TIMBUN NAMA VILLA sebagai judul kolom
    //      (mis. "Kaca 1", "Kaca 2", "cemara", dst) plus kolom tanggal
    //      (biasanya "Tanggal"/"Nama Villa"). Setiap baris di bawahnya =
    //      satu tanggal; jika kolom villa yang bersangkutan terisi (status
    //      berupa teks apa pun seperti "X", "1", "Booking", "Dipesan" dll),
    //      tanggal tersebut diblokir untuk villa itu.
    //   B) LAYOUT LEGACY: satu baris berisi sel tanggal + sel teks nama villa
    //      ("12 Sep 2026 - 14 Sep 2026", "Kaca 1").
    var sheetSched = ss.getSheetByName(SCHEDULE_SHEET);

    if (sheetSched && sheetSched.getLastRow() >= 1) {
      var sRows = sheetSched.getDataRange().getValues();

      // --- Deteksi header (baris pertama) untuk layout MATRIKS ---
      // Map nama villa (ternormalisasi) -> indeks kolom; dan indeks kolom tanggal.
      var villaColMap = {};
      var tanggalColIdx = -1;
      if (sRows.length > 0) {
        for (var hc = 0; hc < sRows[0].length; hc++) {
          var htext = String(sRows[0][hc] || '').trim();
          var hn = normInline(htext);
          if (htext === '') continue;
          if (hn === 'tanggal' || hn === 'nama villa') { if (tanggalColIdx === -1) tanggalColIdx = hc; continue; }
          villaColMap[hn] = hc;
        }
      }
      var targetColIdx = villaColMap[targetVillaInline];

      for (var si = 0; si < sRows.length; si++) {
        var rowCells = sRows[si];
        if (si === 0) continue; // Baris header (judul kolom), bukan data.

        var dateVal = null;
        var villaVal = '';
        var matchedMatrix = false;

        // LAYOUT MATRIKS: jika ada kolom target & selnya terisi di baris ini.
        if (targetColIdx !== undefined) {
          var mCell = rowCells[targetColIdx];
          var mCellEmpty = (mCell === null || mCell === undefined || String(mCell).trim() === '');
          if (!mCellEmpty) {
            matchedMatrix = true;
            // Ambil tanggal baris: dari kolom tanggal (jika ada) / sel tanggal mana pun.
            if (tanggalColIdx > -1) {
              var td = rowCells[tanggalColIdx];
              if (td instanceof Date) dateVal = { start: td, end: null };
              else { var tdr = cellRange(td); if (tdr) dateVal = tdr; }
            }
            if (!dateVal) {
              for (var tm = 0; tm < rowCells.length; tm++) {
                if (tm === targetColIdx) continue;
                var tc = rowCells[tm];
                if (tc instanceof Date) { dateVal = { start: tc, end: null }; break; }
                var tcr = cellRange(tc);
                if (tcr) { dateVal = tcr; break; }
              }
            }
          }
        }

        // LAYOUT LEGACY: scan semua sel utk sel tanggal + teks nama villa.
        if (!matchedMatrix) {
          for (var cc = 0; cc < rowCells.length; cc++) {
            var cell = rowCells[cc];
            if (cell === null || cell === undefined) continue;
            if (cell instanceof Date) { dateVal = { start: cell, end: null }; continue; }
            var r = cellRange(cell);
            if (r) { dateVal = r; continue; }
            if (String(cell).trim() !== '') { villaVal = String(cell); }
          }
          if (dateVal && villaVal && normInline(villaVal) === targetVillaInline) matchedMatrix = true;
        }

        if (!matchedMatrix || !dateVal) continue;
        addDateRange(dateVal.start, dateVal.end || null);
      }
    }

    // 3. Tetap scan sheet 'Booking' (record lama / hasil verifikasi admin),
    //    agar booking yang sudah ada tidak tiba-tiba terbuka. Baris 'Ditolak' dilewati.
    var sheetBooking = ss.getSheetByName('Booking');
    if (sheetBooking && sheetBooking.getLastRow() > 1) {
      var bRows = sheetBooking.getDataRange().getValues();
      var bHeaders = bRows[0].map(function(h) { return String(h).trim(); });
      var vCol = bHeaders.indexOf('Villa');
      var ciCol = bHeaders.indexOf('Check-in');
      var coCol = bHeaders.indexOf('Check-out');
      var stCol = bHeaders.indexOf('Status');

      for (var i = 1; i < bRows.length; i++) {
        var row = bRows[i];
        var vName = normalizeVilla(row[vCol]);
        var status = String(row[stCol] || '').trim();

        if (vName !== targetVilla) continue;
        if (status === 'Ditolak') continue;

        var ci = parseDate(row[ciCol]);
        var co = parseDate(row[coCol]);
        addDateRange(ci, co);
      }
    }

    var resultDates = Object.keys(bookedDatesSet);
    return respond(resultDates, callback);

  } catch (err) {
    return respond({ error: err.toString() }, callback);
  }
}

/**
 * POST — Menerima data satisfaction form, data booking baru, ATAU update status verifikasi.
 */
function doPost(e) {
  try {
    var data;
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (pErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    } else {
      data = {};
    }

    var ss = getSS();

    // === VERIFY / REJECT BOOKING ===
    if (data.type === 'verify') {
      var sheetVerify = ss.getSheetByName('Booking');
      if (!sheetVerify) {
        return respond({ success: false, error: 'Sheet Booking tidak ditemukan' });
      }

      var bookingId = data.bookingId;
      var newStatus = data.status;

      if (!bookingId || !newStatus) {
        return respond({ success: false, error: 'bookingId dan status wajib diisi' });
      }

      var rows = sheetVerify.getDataRange().getValues();
      var headers = rows[0];

      var idCol = -1;
      var statusCol = -1;
      for (var c = 0; c < headers.length; c++) {
        if (headers[c] === 'Booking ID') idCol = c;
        if (headers[c] === 'Status') statusCol = c;
      }

      if (idCol === -1 || statusCol === -1) {
        return respond({ success: false, error: 'Kolom Booking ID / Status tidak ditemukan di sheet' });
      }

      var found = false;
      for (var r = 1; r < rows.length; r++) {
        if (String(rows[r][idCol]).trim() === String(bookingId).trim()) {
          sheetVerify.getRange(r + 1, statusCol + 1).setValue(newStatus);
          found = true;
          break;
        }
      }

      if (!found) {
        return respond({ success: false, error: 'Booking ID tidak ditemukan: ' + bookingId });
      }

      return respond({ success: true, type: 'verify', bookingId: bookingId, status: newStatus });
    }

    // === BOOKING ===
    if (data.type === 'booking') {
      var sheetBooking = ss.getSheetByName('Booking');
      if (!sheetBooking) {
        sheetBooking = ss.insertSheet('Booking');
      }

      if (sheetBooking.getLastRow() === 0) {
        sheetBooking.appendRow([
          'Booking ID', 'Timestamp', 'Villa', 'Check-in', 'Check-out', 'Malam',
          'Nama', 'WhatsApp', 'Email', 'Jumlah Tamu', 'Metode Bayar', 'Jumlah Transfer',
          'Total Harga', 'Bukti Bayar', 'Status',
        ]);
      }

      var bookingId = generateBookingId();
      var bukti = data.proof || '';

      sheetBooking.appendRow([
        bookingId,
        data.timestamp || new Date().toISOString(),
        data.villa || '',
        data.checkIn || '',
        data.checkOut || '',
        data.nights || '',
        data.name || '',
        data.phone || '',
        data.email || '',
        data.guests || '',
        data.bank || '',
        data.amount || '',
        data.totalPrice || '',
        bukti,
        'Menunggu Verifikasi',
      ]);

      return respond({ success: true, type: 'booking', bookingId: bookingId });
    }

    // === KEPUASAN TAMU (default) ===
    var sheetGuest = ss.getSheetByName('Kepuasan Tamu');
    if (!sheetGuest) {
      sheetGuest = ss.insertSheet('Kepuasan Tamu');
    }

    if (sheetGuest.getLastRow() === 0) {
      sheetGuest.appendRow(['Timestamp', 'Rating', 'Villa', 'Nama', 'Kesan & Pesan']);
    }

    sheetGuest.appendRow([
      data.timestamp || new Date().toISOString(),
      data.rating || '',
      data.villa || '',
      data.name || '',
      data.message || '',
    ]);

    return respond({ success: true });
  } catch (err) {
    return respond({ success: false, error: err.toString() });
  }
}

/**
 * MIGRASI SATU KALI — Salin data legacy dari sheet 'DATA' lama ke sheet 'Booking'
 * sehingga seluruh riwayat booking tersimpan di satu sheet ('Booking') saja.
 *
 * Cara pakai:
 * 1. Jalankan fungsi ini dari Editor Script (pilih fungsi 'migrateDataSheet' lalu klik Run).
 * 2. Setelah selesai, verifikasi data di sheet 'Booking'.
 * 3. Jika ragu, jalankan dulu pada salinan (copy) spreadsheet.
 *
 * Fungsi ini aman untuk dijalankan berulang: ia hanya menyalin baris legacy yang belum
 * memiliki 'Booking ID' dengan awalan 'DATA-'.
 */
function migrateDataSheet() {
  var ss = getSS();

  var sheetData = ss.getSheetByName('DATA');
  if (!sheetData || sheetData.getLastRow() <= 1) {
    throw new Error('Sheet DATA tidak ditemukan atau kosong.');
  }

  var sheetBooking = ss.getSheetByName('Booking');
  if (!sheetBooking) {
    sheetBooking = ss.insertSheet('Booking');
  }

  if (sheetBooking.getLastRow() === 0) {
    sheetBooking.appendRow([
      'Booking ID', 'Timestamp', 'Villa', 'Check-in', 'Check-out', 'Malam',
      'Nama', 'WhatsApp', 'Email', 'Jumlah Tamu', 'Metode Bayar', 'Jumlah Transfer',
      'Total Harga', 'Bukti Bayar', 'Status',
    ]);
  }

  var existing = {};
  var bVals = sheetBooking.getDataRange().getValues();
  for (var r = 1; r < bVals.length; r++) {
    existing[String(bVals[r][0] || '')] = true;
  }

  var dRows = sheetData.getDataRange().getValues();
  var tz = Session.getScriptTimeZone();
  var migrated = 0;
  var skipped = 0;

  for (var i = 1; i < dRows.length; i++) {
    var row = dRows[i];
    var nama = String(row[2] || '').trim();
    var villa = String(row[4] || '').trim();
    if (!nama && !villa) { skipped++; continue; }

    var bookingId = 'DATA-' + (i + 1);

    var ciVal = row[0];
    var ciStr = ciVal instanceof Date
      ? Utilities.formatDate(ciVal, tz, 'yyyy-MM-dd HH:mm')
      : String(ciVal || '');

    if (existing[bookingId]) { skipped++; continue; }

    sheetBooking.appendRow([
      bookingId,
      ciStr,
      villa,
      ciStr,
      '-',
      '-',
      nama,
      '-',
      '-',
      '-',
      row[9] && String(row[9]).trim() ? row[9] : 'Transfer/Cash',
      row[6] || 0,
      row[5] || 0,
      '',
      String(row[11] || '').trim() || 'Terverifikasi',
    ]);

    existing[bookingId] = true;
    migrated++;
  }

  return { success: true, migrated: migrated, skipped: skipped };
}

/**
 * PERBAIKAN STRUKTUR (satu kali) — Membangun ulang kolom sheet 'Booking'
 * agar sesuai dengan yang diharapkan panel admin & skrip:
 *
 *   Booking ID | Timestamp | Villa | Check-in | Check-out | Malam | Nama |
 *   WhatsApp | Email | Jumlah Tamu | Metode Bayar | Jumlah Transfer |
 *   Total Harga | Bukti Bayar | Status
 *
 * Fungsi ini membaca kolom yang sudah ada (dicocokkan berdasarkan nama header),
 * lalu menulis ulang sheet dengan header baku tersebut. Baris yang belum punya
 * 'Booking ID' akan diberi ID otomatis, dan 'Status' diisi 'Menunggu Verifikasi'
 * bila kolomnya belum ada.
 *
 * Cara pakai (PASTIKAN backup dulu / uji pada salinan spreadsheet):
 * 1. Di Editor Script, pilih fungsi 'fixDataBookingSheet' lalu klik Run.
 * 2. Verifikasi hasilnya di spreadsheet.
 */
function fixDataBookingSheet() {
  var ss = getSS();
  var sheet = ss.getSheetByName('Booking');
  if (!sheet || sheet.getLastRow() < 1) {
    throw new Error('Sheet Booking tidak ditemukan.');
  }

  var values = sheet.getDataRange().getValues();
  var header = values[0].map(function (h) { return String(h || '').trim(); });

  function col(name) {
    for (var k = 0; k < header.length; k++) {
      if (header[k].toLowerCase() === name.toLowerCase()) return k;
    }
    return -1;
  }

  var c = {
    bookingid: col('Booking ID'),
    timestamp: col('Timestamp'),
    villa: col('Villa'),
    checkin: col('Check-in'),
    checkout: col('Check-out'),
    malam: col('Malam'),
    nama: col('Nama'),
    whatsapp: col('WhatsApp'),
    email: col('Email'),
    layam: col('Jumlah Tamu'),
    metode: col('Metode Bayar'),
    transfer: col('Jumlah Transfer'),
    total: col('Total Harga'),
    bukti: col('Bukti Bayar'),
    status: col('Status'),
  };

  var targetHeader = ['Booking ID', 'Timestamp', 'Villa', 'Check-in', 'Check-out', 'Malam', 'Nama', 'WhatsApp', 'Email', 'Jumlah Tamu', 'Metode Bayar', 'Jumlah Transfer', 'Total Harga', 'Bukti Bayar', 'Status'];

  var out = [targetHeader];
  var fixed = 0;

  for (var r = 1; r < values.length; r++) {
    var src = values[r];
    if (c.timestamp === -1 && c.villa === -1) continue;

    var bookingId = (c.bookingid !== undefined && c.bookingid > -1 && src[c.bookingid] && String(src[c.bookingid]).trim())
      ? String(src[c.bookingid]).trim()
      : generateBookingId();

    var status = (c.status > -1 && src[c.status] && String(src[c.status]).trim())
      ? String(src[c.status]).trim()
      : 'Menunggu Verifikasi';

    var row = [
      bookingId,
      c.timestamp > -1 ? src[c.timestamp] : '',
      c.villa > -1 ? src[c.villa] : '',
      c.checkin > -1 ? src[c.checkin] : '',
      c.checkout > -1 ? src[c.checkout] : '',
      c.malam > -1 ? src[c.malam] : '',
      c.nama > -1 ? src[c.nama] : '',
      c.whatsapp > -1 ? src[c.whatsapp] : '',
      c.email > -1 ? src[c.email] : '',
      c.layam > -1 ? src[c.layam] : '',
      c.metode > -1 ? src[c.metode] : '',
      c.transfer > -1 ? src[c.transfer] : '',
      c.total > -1 ? src[c.total] : '',
      c.bukti > -1 ? src[c.bukti] : '',
      status,
    ];
    out.push(row);
    fixed++;
  }

  sheet.getDataRange().clearContent();
  if (out.length > 0) {
    sheet.getRange(1, 1, out.length, out[0].length).setValues(out);
  }

  return { success: true, rows_fixed: fixed, booking_id_used: c.bookingid > -1, status_col_existed: c.status > -1 };
}

function respond(data, callback) {
  var json = JSON.stringify(data);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
