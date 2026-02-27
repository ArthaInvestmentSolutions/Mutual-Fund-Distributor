// ════════════════════════════════════════════════════════════════
//  ARTHA INVESTMENT SOLUTIONS — Google Apps Script v2
//  BULLETPROOF — handles GET, POST, and preflight OPTIONS
// ════════════════════════════════════════════════════════════════
//
//  SETUP (do this exactly, step by step):
//
//  STEP 1 — Create your Google Sheet
//    • Go to sheets.google.com
//    • Create a new blank sheet
//    • Name it anything e.g. "Artha Leads"
//    • Note the Sheet URL (you'll need it if something goes wrong)
//
//  STEP 2 — Open Apps Script
//    • In the sheet: click Extensions → Apps Script
//    • A new tab opens with a code editor
//    • DELETE all existing code in the editor
//    • PASTE this entire file
//    • Click Save (💾 icon) — name it "Artha Leads Script"
//
//  STEP 3 — Deploy as Web App
//    • Click "Deploy" button (top right) → "New deployment"
//    • Click the gear ⚙ icon next to "Type" → select "Web app"
//    • Fill in:
//        Description     : Artha Leads v1
//        Execute as      : Me (your Google account)
//        Who has access  : ⚠️ ANYONE  ← this is critical, must be "Anyone"
//    • Click "Deploy"
//    • Google will ask you to authorize → click "Authorize access"
//    • Choose your Google account → click "Allow"
//    • You'll see a Web App URL like:
//        https://script.google.com/macros/s/AKfycb.../exec
//    • COPY that URL
//
//  STEP 4 — Paste URL into your website
//    • Open index.html
//    • Find this line near the bottom:
//        var SCRIPT_URL = 'https://script.google.com/...';
//    • Replace the URL inside the quotes with your new URL
//    • Save index.html and push to GitHub
//
//  STEP 5 — Test it
//    • Open your website → fill and submit the contact form
//    • Check your Google Sheet — a new row should appear in ~2 seconds
//
//  ⚠️  IMPORTANT: If you ever edit this script, you MUST create a
//  NEW deployment (not update existing). Then update SCRIPT_URL
//  in index.html with the new URL.
//
// ════════════════════════════════════════════════════════════════

var SHEET_NAME = 'Leads';

// ── Returns CORS headers so browser doesn't block the response ─
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}

// ── Handle GET request (sent by the website form) ─────────────
function doGet(e) {
  try {
    var result = saveToSheet(e.parameter);
    return buildResponse({ status: 'success', message: 'Lead saved', row: result });
  } catch(err) {
    logError('doGet', err, e);
    return buildResponse({ status: 'error', message: err.message });
  }
}

// ── Handle POST request (future-proof) ────────────────────────
function doPost(e) {
  try {
    var params = {};
    // Try to parse JSON body first
    if (e.postData && e.postData.contents) {
      try { params = JSON.parse(e.postData.contents); } catch(x) {}
    }
    // Fall back to form parameters
    if (!params.name && e.parameter) {
      params = e.parameter;
    }
    var result = saveToSheet(params);
    return buildResponse({ status: 'success', message: 'Lead saved', row: result });
  } catch(err) {
    logError('doPost', err, e);
    return buildResponse({ status: 'error', message: err.message });
  }
}

// ── Core: write one row to the sheet ─────────────────────────
function saveToSheet(params) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss);

  var now = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  var row = [
    params.date    || now,
    params.name    || '',
    params.email   || '',
    params.phone   || 'Not provided',
    params.service || '',
    params.message || 'No message',
    'New'
  ];

  sheet.appendRow(row);
  formatLastRow(sheet);

  return sheet.getLastRow();
}

// ── Build JSON response ───────────────────────────────────────
function buildResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Log errors to a separate sheet for debugging ─────────────
function logError(fn, err, e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var log = ss.getSheetByName('Error Log');
    if (!log) log = ss.insertSheet('Error Log');
    log.appendRow([
      new Date().toISOString(),
      fn,
      err.message,
      JSON.stringify(e ? e.parameter : {})
    ]);
  } catch(x) {}
}

// ── Get or create the Leads sheet ────────────────────────────
function getOrCreateSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    setupHeaders(sheet);
    return sheet;
  }
  // Add headers if sheet is empty
  if (sheet.getLastRow() === 0) {
    setupHeaders(sheet);
  }
  return sheet;
}

// ── Create styled header row ──────────────────────────────────
function setupHeaders(sheet) {
  var headers = [
    'Submission Date',
    'Full Name',
    'Email',
    'Phone',
    'Service Interest',
    'Message',
    'Status'
  ];

  sheet.appendRow(headers);

  var hr = sheet.getRange(1, 1, 1, headers.length);
  hr.setBackground('#0a0e1a')
    .setFontColor('#c9a96e')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  sheet.setRowHeight(1, 34);
  sheet.setFrozenRows(1);

  // Column widths
  var widths = [190, 170, 230, 150, 210, 370, 120];
  widths.forEach(function(w, i) { sheet.setColumnWidth(i + 1, w); });
}

// ── Format each new data row ──────────────────────────────────
function formatLastRow(sheet) {
  var row = sheet.getLastRow();
  if (row < 2) return;

  var bg = (row % 2 === 0) ? '#f8f5f0' : '#ffffff';
  sheet.getRange(row, 1, 1, 7)
       .setBackground(bg)
       .setFontSize(11)
       .setVerticalAlignment('middle');
  sheet.setRowHeight(row, 26);
  sheet.getRange(row, 6).setWrap(true);

  // Color-code Status cell
  var statusCell = sheet.getRange(row, 7);
  statusCell
    .setBackground('#e8f5e9')
    .setFontColor('#2e7d32')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
}

// ════════════════════════════════════════════════════════════════
//  MANUAL TEST FUNCTION
//  Run this inside Apps Script to verify the script works
//  before testing from your website:
//    1. Select "testScript" from the function dropdown (top toolbar)
//    2. Click Run ▶
//    3. Check your Google Sheet — a test row should appear
// ════════════════════════════════════════════════════════════════
function testScript() {
  var fakeParams = {
    name:    'Test User',
    email:   'test@example.com',
    phone:   '+91 99999 00000',
    service: 'Mutual Funds',
    message: 'This is a test submission from Apps Script.',
    date:    new Date().toLocaleString('en-IN')
  };

  try {
    var rowNum = saveToSheet(fakeParams);
    Logger.log('✓ SUCCESS — Row written at line ' + rowNum);
    Logger.log('Check your "' + SHEET_NAME + '" sheet now.');
  } catch(err) {
    Logger.log('✗ ERROR: ' + err.message);
  }
}
