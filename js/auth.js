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
  location.reload();
}
