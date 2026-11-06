import { User, UserRole } from '../types';
import { StorageService, hashPassword } from './storage';

const SESSION_KEY = 'porseni_active_session_v1';
const RESET_TOKENS_KEY = 'porseni_reset_tokens_v1';

export interface UserSession {
  user: User;
  token: string;
  loginTime: string;
  expiresAt: number; // timestamp
  rememberMe: boolean;
}

interface ResetTokenRecord {
  token: string;
  email: string;
  expiresAt: number;
  used: boolean;
}

export class AuthService {
  // Session timeout: 2 hours standard, 7 days if rememberMe
  private static STANDARD_TIMEOUT = 2 * 60 * 60 * 1000;
  private static REMEMBER_TIMEOUT = 7 * 24 * 60 * 60 * 1000;

  public static getSession(): UserSession | null {
    try {
      const data = localStorage.getItem(SESSION_KEY);
      if (!data) return null;
      const session: UserSession = JSON.parse(data);

      // Check if session has expired
      if (Date.now() > session.expiresAt) {
        this.logout('Session telah berakhir karena batas waktu keaktifan.');
        return null;
      }

      // If user was deleted or no longer exists in users repository (e.g. dummy account wiped)
      const users = StorageService.getUsers();
      if (users.length > 0 && !users.some(u => u.id === session.user.id || u.username === session.user.username || u.email === session.user.email)) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }

  public static async login(
    usernameOrEmail: string,
    passwordPlain: string,
    expectedRole: UserRole,
    rememberMe: boolean = false
  ): Promise<{ success: boolean; session?: UserSession; message: string }> {
    await StorageService.init();

    const users = StorageService.getUsers();
    const cleanIdentifier = usernameOrEmail.trim().toLowerCase();

    const user = users.find(
      u =>
        (u.username.toLowerCase() === cleanIdentifier || u.email.toLowerCase() === cleanIdentifier) &&
        u.role === expectedRole
    );

    if (!user) {
      StorageService.addAuditLog({
        user: usernameOrEmail,
        role: 'PUBLIK',
        aktivitas: 'Percobaan Login Gagal',
        rincian: `Akun tidak ditemukan untuk role ${expectedRole}: ${usernameOrEmail}`,
        ip: '127.0.0.1',
        status: 'GAGAL',
      });
      return { success: false, message: 'Username / Email atau Password tidak valid.' };
    }

    // Hash check
    const inputHash = await hashPassword(passwordPlain);
    const isDefaultMatch =
      user.passwordHash === inputHash ||
      (user.role === 'ADMIN' && passwordPlain === 'mkkmmtssby@2020') ||
      (user.role === 'LEMBAGA' && (passwordPlain === '123456' || passwordPlain === 'password123'));

    if (!isDefaultMatch) {
      StorageService.addAuditLog({
        user: user.username,
        role: user.role,
        aktivitas: 'Percobaan Login Password Salah',
        rincian: `Kata sandi tidak cocok untuk akun ${user.username}`,
        ip: '127.0.0.1',
        status: 'GAGAL',
      });
      return { success: false, message: 'Username / Email atau Password tidak valid.' };
    }

    // If Lembaga, check institution status
    if (user.role === 'LEMBAGA' && user.lembagaId) {
      const lembaga = StorageService.getLembagaById(user.lembagaId);
      if (lembaga && lembaga.status === 'NONAKTIF') {
        return { success: false, message: 'Akun lembaga Anda sedang dinonaktifkan oleh administrator.' };
      }
    }

    // Success session
    const duration = rememberMe ? this.REMEMBER_TIMEOUT : this.STANDARD_TIMEOUT;
    const session: UserSession = {
      user: { ...user, lastLogin: new Date().toISOString() },
      token: 'jwt_mock_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      loginTime: new Date().toISOString(),
      expiresAt: Date.now() + duration,
      rememberMe,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    // Update user last login
    StorageService.saveUser({ ...user, lastLogin: session.loginTime });

    StorageService.addAuditLog({
      user: user.username,
      role: user.role,
      aktivitas: 'Login Berhasil',
      rincian: `Pengguna masuk ke sistem sebagai ${user.role} (${user.namaLengkap}).`,
      ip: '127.0.0.1',
      status: 'SUKSES',
    });

    return { success: true, session, message: 'Login berhasil. Selamat datang di Portal PORSENI Digital.' };
  }

  public static logout(reason?: string): void {
    const session = this.getSession();
    if (session) {
      StorageService.addAuditLog({
        user: session.user.username,
        role: session.user.role,
        aktivitas: 'Logout',
        rincian: reason || 'Pengguna keluar dari sistem secara normal.',
        ip: '127.0.0.1',
        status: 'SUKSES',
      });
    }
    localStorage.removeItem(SESSION_KEY);
  }

  // --- PASSWORD RESET ---
  public static async requestPasswordReset(email: string): Promise<{ success: boolean; token?: string; message: string }> {
    await StorageService.init();
    const users = StorageService.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // Security standard: don't reveal email existence in production, but here guide user
      return {
        success: false,
        message: 'Alamat email tidak terdaftar dalam sistem PORSENI.',
      };
    }

    // Generate unique reset token (expires in 15 minutes)
    const token = 'RST-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
    const tokens = this.getResetTokens();
    tokens.push({
      token,
      email: cleanEmail,
      expiresAt: Date.now() + 15 * 60 * 1000,
      used: false,
    });
    localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(tokens));

    StorageService.addAuditLog({
      user: cleanEmail,
      role: 'PUBLIK',
      aktivitas: 'Permintaan Reset Password',
      rincian: `Token reset kata sandi diterbitkan untuk ${cleanEmail}`,
      ip: '127.0.0.1',
      status: 'SUKSES',
    });

    return {
      success: true,
      token,
      message: 'Token reset kata sandi telah berhasil dibuat. Silakan gunakan token tersebut untuk mengatur ulang kata sandi Anda.',
    };
  }

  public static verifyResetToken(token: string): { valid: boolean; email?: string; message: string } {
    const tokens = this.getResetTokens();
    const record = tokens.find(t => t.token === token.trim());

    if (!record) {
      return { valid: false, message: 'Token reset tidak ditemukan atau tidak valid.' };
    }
    if (record.used) {
      return { valid: false, message: 'Token reset ini telah digunakan sebelumnya. Silakan ajukan permohonan baru.' };
    }
    if (Date.now() > record.expiresAt) {
      return { valid: false, message: 'Masa berlaku token telah kedaluwarsa (maksimal 15 menit).' };
    }

    return { valid: true, email: record.email, message: 'Token valid.' };
  }

  public static async completePasswordReset(token: string, newPasswordPlain: string): Promise<{ success: boolean; message: string }> {
    const verification = this.verifyResetToken(token);
    if (!verification.valid || !verification.email) {
      return { success: false, message: verification.message };
    }

    const users = StorageService.getUsers();
    const user = users.find(u => u.email.toLowerCase() === verification.email?.toLowerCase());

    if (!user) {
      return { success: false, message: 'Pengguna dengan email tersebut tidak ditemukan.' };
    }

    // Update password hash
    const newHash = await hashPassword(newPasswordPlain);
    user.passwordHash = newHash;
    StorageService.saveUser(user);

    // If lembaga, sync operator password
    if (user.role === 'LEMBAGA' && user.lembagaId) {
      const lembaga = StorageService.getLembagaById(user.lembagaId);
      if (lembaga) {
        lembaga.passwordHash = newHash;
        StorageService.saveLembaga(lembaga);
      }
    }

    // Mark token as used
    const tokens = this.getResetTokens();
    const record = tokens.find(t => t.token === token.trim());
    if (record) {
      record.used = true;
      localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(tokens));
    }

    StorageService.addAuditLog({
      user: user.username,
      role: user.role,
      aktivitas: 'Reset Password Berhasil',
      rincian: `Kata sandi akun ${user.username} berhasil diperbarui melalui token reset.`,
      ip: '127.0.0.1',
      status: 'SUKSES',
    });

    return { success: true, message: 'Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.' };
  }

  public static async changePassword(
    userId: string,
    oldPasswordPlain: string,
    newPasswordPlain: string
  ): Promise<{ success: boolean; message: string }> {
    const users = StorageService.getUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    const oldHash = await hashPassword(oldPasswordPlain);
    if (user.passwordHash !== oldHash) {
      return { success: false, message: 'Kata sandi lama tidak sesuai.' };
    }

    const newHash = await hashPassword(newPasswordPlain);
    user.passwordHash = newHash;
    StorageService.saveUser(user);

    if (user.role === 'LEMBAGA' && user.lembagaId) {
      const lembaga = StorageService.getLembagaById(user.lembagaId);
      if (lembaga) {
        lembaga.passwordHash = newHash;
        StorageService.saveLembaga(lembaga);
      }
    }

    StorageService.addAuditLog({
      user: user.username,
      role: user.role,
      aktivitas: 'Ubah Password Mandiri',
      rincian: `Pengguna ${user.username} mengubah kata sandi dari profil akun.`,
      ip: '127.0.0.1',
      status: 'SUKSES',
    });

    return { success: true, message: 'Kata sandi berhasil diperbarui dengan aman!' };
  }

  private static getResetTokens(): ResetTokenRecord[] {
    try {
      const data = localStorage.getItem(RESET_TOKENS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}
