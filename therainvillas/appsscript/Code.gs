/**
 * THE RAIN VILLAS — Backend Bukti Rating & Klaim Voucher
 * ------------------------------------------------------
 *
 * CARA DEPLOY:
 *  1) Buka https://script.google.com -> + New project.
 *  2) Hapus isi editor, tempel seluruh isi file ini, lalu simpan (Ctrl+S).
 *  3) Jalankan fungsi "setupStorage" sekali (Run > setupStorage) dan izinkan akses Drive & Sheets.
 *     (Kalau muncul "requires authorization", pilih akun Google pemilik lalu izinkan.)
 *     Jika dilewati, storage (folder Drive + Spreadsheet) dibuat otomatis saat bukti pertama masuk.
 *  4) Deploy > New deployment > Web app:
 *     - Execute as  : Me
 *     - Who has access : Anyone
 *  5) Salin URL deployment (berakhiran /exec).
 *  6) Di `src/data/promos.js`, isi:
 *        export const PROOF_API = 'URL_HASIL_DEPLOY';
 *     lalu build & push. Tanpa URL, website memakai "mode lokal" (bukti tidak sampai ke admin).
 *
 * PENTING (kalau tiba2 error):
 *  - {error: "...tidak memiliki izin... DriveApp.createFolder... authorization..."}
 *    berarti scopes Drive/Sheets belum disetujui, atau "Execute as" masih "User accessing".
 *    Solusi: pindah ke "Execute as: Me", jalankan setupStorage sekali di editor (izinkan), lalu
 *    Update deployment / buat deployment baru dan ulangi langkah 5-6. URL /exec bisa berubah;
 *    kalau berubah, perbarui PROOF_API lalu build ulang.
 *
 * ENDPOINT YANG DIPAKAI WEBSITE:
 *  - POST body text/plain JSON  {action:'addProof', code, name, type, data:<data-url>}
 *  - POST body text/plain JSON  {action:'deleteProof', id}
 *  - POST body text/plain JSON  {action:'listProofs'}   (dipakai halaman admin; GET bisa loop-302)
 *  - GET  ?action=listProofs&limit=40&callback=fn        (JSONP cadangan)
 *
 * PENYIMPANAN:
 *  - Screenshot disimpan sebagai file di folder Drive "TheRainVillas Proofs".
 *  - Metadata + gambar bukti tercatat di Spreadsheet "TheRainVillas Bukti Rating"
 *    (sheet "Bukti Rating", kolom: id, waktu, kode, nama_file, mime, file_id, bukti).
 *    Gambar bukti disisipkan sebagai gambar dalam kolom "bukti" tiap baris.
 */

var FOLDER_NAME = 'TheRainVillas Proofs';
var SHEET_NAME = 'Bukti Rating';
var MAX_LIST = 40;
var HEADER = ['id', 'waktu', 'kode', 'nama_file', 'mime', 'file_id', 'bukti'];

function setupStorage() {
  var props = PropertiesService.getScriptProperties();
  var folderId = props.getProperty('FOLDER_ID');
  var ssId = props.getProperty('SPREADSHEET_ID');

  var folder = null;
  var ss = null;
  try { if (folderId) folder = DriveApp.getFolderById(folderId); } catch (e) { folder = null; }
  try { if (ssId) ss = SpreadsheetApp.openById(ssId); } catch (e) { ss = null; }

  if (!folder) folder = DriveApp.createFolder(FOLDER_NAME);
  if (!ss) ss = SpreadsheetApp.create('TheRainVillas Bukti Rating');

  props.setProperty('FOLDER_ID', folder.getId());
  props.setProperty('SPREADSHEET_ID', ss.getId());

  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADER);
  } else if (sh.getLastColumn() < HEADER.length) {
    var start = sh.getLastColumn() + 1;
    sh.getRange(1, start, 1, HEADER.length - start + 1)
      .setValues([HEADER.slice(start - 1)]);
  }
  return { folder: folder, ss: ss, sh: sh };
}

function storage_() {
  return setupStorage();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var action = String(p.action || 'listProofs');
    var cb = p.callback ? String(p.callback) : '';
    var limit = parseInt(p.limit, 10) || MAX_LIST;

    var result;
    if (action === 'listProofs') {
      result = listProofs_(limit);
    } else {
      result = { ok: false, error: 'unknown action' };
    }

    if (cb) {
      return ContentService.createTextOutput(cb + '(' + JSON.stringify(result) + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return json_(result);
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) || '';
    var req = {};
    try { req = JSON.parse(raw); } catch (err) { return json_({ ok: false, error: 'invalid json' }); }

    if (req.action === 'addProof') return json_(addProof_(req));
    if (req.action === 'deleteProof') return json_(deleteProof_(req));
    if (req.action === 'listProofs') return json_(listProofs_(parseInt(req.limit, 10) || MAX_LIST));
    return json_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function addProof_(req) {
  var code = String(req.code || '').slice(0, 40);
  var name = String(req.name || 'proof.png').slice(0, 150);
  var type = String(req.type || 'image/png').slice(0, 80);
  var dataUrl = String(req.data || '');
  if (dataUrl.length < 20 || dataUrl.indexOf(',') === -1) {
    return { ok: false, error: 'no image data' };
  }

  var base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  var bytes = Utilities.base64Decode(base64);
  var blob = Utilities.newBlob(bytes, type, name);

  var st = storage_();
  var file = st.folder.createFile(blob);
  var id = Utilities.getUuid();
  var ts = new Date().toISOString();

  st.sh.appendRow([id, ts, code, name, type, file.getId()]);
  try {
    st.sh.insertImage(blob, 7, st.sh.getLastRow(), 0, 0, 180, 180);
  } catch (e) {}
  return { ok: true, id: id, ts: ts };
}

function deleteProof_(req) {
  var id = String(req.id || '');
  if (!id) return { ok: false, error: 'no id' };

  var st = storage_();
  var values = st.sh.getDataRange().getValues();
  for (var i = values.length - 1; i >= 1; i--) {
    if (String(values[i][0]) === id) {
      var fileId = String(values[i][5] || '');
      if (fileId) {
        try { DriveApp.getFileById(fileId).setTrashed(true); } catch (e) {}
      }
      st.sh.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false, error: 'not found' };
}

function listProofs_(limit) {
  var st = storage_();
  var values = st.sh.getDataRange().getValues();
  var items = [];

  for (var i = values.length - 1; i >= 1 && items.length < limit; i--) {
    var row = values[i];
    var fileId = String(row[5] || '');
    var mime = String(row[4] || 'image/png');
    var data = '';
    if (fileId) {
      try {
        var blob = DriveApp.getFileById(fileId).getBlob();
        data = 'data:' + mime + ';base64,' + Utilities.base64Encode(blob.getBytes());
      } catch (e) {
        data = '';
      }
    }
    items.push({
      id: String(row[0] || ''),
      ts: String(row[1] || ''),
      code: String(row[2] || ''),
      name: String(row[3] || ''),
      mime: mime,
      data: data,
    });
  }
  return {
    ok: true,
    items: items,
    spreadsheetUrl: st.ss.getUrl(),
    folderUrl: st.folder.getUrl(),
  };
}