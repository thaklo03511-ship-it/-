/**
 * Authentication and Security utilities for คลังยาสมุนไพร รพ.สต.บ้านท่าคล้อ
 * Protects stock data against unauthorized modifications
 */

const PIN_STORAGE_KEY = 'herb_stock_access_pin_v1';
const SESSION_STORAGE_KEY = 'herb_stock_auth_session_v1';
const DEFAULT_PIN = '1234';

export type AuthRole = 'admin' | 'viewer';

export interface AuthSession {
  isAuthenticated: boolean;
  role: AuthRole;
  loginTime: number;
  remember: boolean;
}

/**
 * Gets the current stored PIN (or default '1234')
 */
export function getStoredPin(): string {
  try {
    const pin = localStorage.getItem(PIN_STORAGE_KEY);
    if (pin && pin.trim().length >= 4) {
      return pin.trim();
    }
  } catch (e) {
    console.error('Error reading PIN from storage:', e);
  }
  return DEFAULT_PIN;
}

/**
 * Verifies if the entered PIN matches the stored PIN
 */
export function verifyPin(enteredPin: string): boolean {
  const currentPin = getStoredPin();
  return enteredPin.trim() === currentPin;
}

/**
 * Sets a new access PIN
 */
export function updatePin(newPin: string): { success: boolean; error?: string } {
  const cleanPin = newPin.trim();
  if (cleanPin.length < 4) {
    return { success: false, error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร/ตัวเลข' };
  }
  try {
    localStorage.setItem(PIN_STORAGE_KEY, cleanPin);
    return { success: true };
  } catch (e) {
    console.error('Error saving new PIN:', e);
    return { success: false, error: 'ไม่สามารถบันทึกรหัสผ่านลงในอุปกรณ์ได้' };
  }
}

/**
 * Resets PIN back to default '1234'
 */
export function resetPinToDefault(): void {
  try {
    localStorage.removeItem(PIN_STORAGE_KEY);
  } catch (e) {
    console.error('Error resetting PIN:', e);
  }
}

/**
 * Checks if user customized the PIN from default
 */
export function isUsingDefaultPin(): boolean {
  return getStoredPin() === DEFAULT_PIN;
}

/**
 * Retrieves the current authentication session
 */
export function getAuthSession(): AuthSession | null {
  try {
    // Check localStorage first (remembered), then sessionStorage
    const local = localStorage.getItem(SESSION_STORAGE_KEY);
    if (local) {
      const parsed: AuthSession = JSON.parse(local);
      if (parsed && parsed.isAuthenticated) return parsed;
    }

    const session = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (session) {
      const parsed: AuthSession = JSON.parse(session);
      if (parsed && parsed.isAuthenticated) return parsed;
    }
  } catch (e) {
    console.error('Error getting auth session:', e);
  }
  return null;
}

/**
 * Saves login session
 */
export function saveAuthSession(role: AuthRole, remember: boolean = true): void {
  const session: AuthSession = {
    isAuthenticated: true,
    role,
    loginTime: Date.now(),
    remember,
  };

  try {
    if (remember) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Error saving auth session:', e);
  }
}

/**
 * Clears current login session (Locks screen)
 */
export function clearAuthSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing auth session:', e);
  }
}
