/* ===========================================
   ALLEGRO ANALYTICS DASHBOARD - AUTH
   Autoryzacja haslem (SHA-256)
   =========================================== */

// Hash hasla SHA-256 (haslo nie jest widoczne w kodzie)
const PASSWORD_HASH = '9dd806892e448282030c4dea340696831ba1b038b0419df4eb67ce071522c9fa';

/**
 * Hashuje haslo przy uzyciu SHA-256
 * @param {string} password - Haslo do zahashowania
 * @returns {Promise<string>} - Hash w formacie hex
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Weryfikuje haslo przez porownanie hashy
 * @param {string} password - Haslo do weryfikacji
 * @returns {Promise<boolean>} - true jesli haslo poprawne
 */
async function verifyPassword(password) {
  const hash = await hashPassword(password);
  return hash === PASSWORD_HASH;
}

/**
 * Sprawdza czy uzytkownik jest zalogowany
 * @returns {boolean}
 */
function checkAuth() {
  return sessionStorage.getItem('authenticated') === 'true';
}

/**
 * Ustawia status autoryzacji
 * @param {boolean} value
 */
function setAuth(value) {
  sessionStorage.setItem('authenticated', value ? 'true' : 'false');
}

/**
 * Wylogowuje uzytkownika
 */
function logout() {
  sessionStorage.removeItem('authenticated');
  sessionStorage.removeItem('lastActivity');
  location.reload();
}

// ============================================
// SESSION TIMEOUT
// ============================================

/**
 * Aktualizuje timestamp ostatniej aktywnosci
 */
function updateLastActivity() {
  sessionStorage.setItem('lastActivity', Date.now().toString());
}

/**
 * Pobiera timestamp ostatniej aktywnosci
 * @returns {number|null}
 */
function getLastActivity() {
  const timestamp = sessionStorage.getItem('lastActivity');
  return timestamp ? parseInt(timestamp, 10) : null;
}

/**
 * Sprawdza czy sesja wygasla
 * @returns {boolean} - true jesli sesja wygasla
 */
function isSessionExpired() {
  const lastActivity = getLastActivity();
  if (!lastActivity) return false;

  const now = Date.now();
  const timeoutMs = CONFIG.SESSION_TIMEOUT_MINUTES * 60 * 1000;
  return (now - lastActivity) > timeoutMs;
}

/**
 * Sprawdza timeout i wylogowuje jesli sesja wygasla
 * @returns {boolean} - true jesli sesja wygasla i uzytkownik zostal wylogowany
 */
function checkSessionTimeout() {
  if (checkAuth() && isSessionExpired()) {
    console.log('Sesja wygasla - wylogowanie');
    logout();
    return true;
  }
  return false;
}

/**
 * Uruchamia okresowe sprawdzanie timeout sesji
 */
function startSessionTimeoutCheck() {
  const intervalMs = CONFIG.SESSION_CHECK_INTERVAL_SECONDS * 1000;
  setInterval(() => {
    checkSessionTimeout();
  }, intervalMs);
}
