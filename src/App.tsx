import React, { useState, useEffect } from 'react';
import {
  CabangLomba,
  Lembaga,
  PengaturanSistem,
  Peserta,
  ToastMessage,
  UserRole,
} from './types';
import { StorageService } from './services/storage';
import { AuthService, UserSession } from './services/auth';
import {
  setupRealtimeSync,
  downloadAllFromFirestore,
  syncDocToFirestore,
  deleteDocFromFirestore,
} from './services/firebase';

// Public Components
import { LandingPage } from './components/landing/LandingPage';
import { LoginModal } from './components/public/LoginModal';
import { RegistrasiLembaga } from './components/public/RegistrasiLembaga';
import { ValidasiPeserta } from './components/public/ValidasiPeserta';
import { LupaPassword } from './components/public/LupaPassword';
import { GaleriFoto } from './components/public/GaleriFoto';
import { GaleriVideo } from './components/public/GaleriVideo';

// Common Components
import { PorseniEmblem } from './components/common/OfficialLogos';
import { LembagaStatusBadge } from './components/common/UIComponents';
import { MultiDeviceModal } from './components/common/MultiDeviceModal';

// Lembaga Components
import { LembagaDashboard } from './components/lembaga/LembagaDashboard';
import { LembagaPeserta } from './components/lembaga/LembagaPeserta';
import { LembagaImportExcel } from './components/lembaga/LembagaImportExcel';
import { LembagaKartu } from './components/lembaga/LembagaKartu';
import { LembagaProfil } from './components/lembaga/LembagaProfil';
import { LembagaRekap } from './components/lembaga/LembagaRekap';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminVerifikasiPeserta } from './components/admin/AdminVerifikasiPeserta';
import { AdminLembaga } from './components/admin/AdminLembaga';
import { AdminCabang } from './components/admin/AdminCabang';
import { AdminKegiatan } from './components/admin/AdminKegiatan';
import { AdminGaleri } from './components/admin/AdminGaleri';
import { AdminAuditLog } from './components/admin/AdminAuditLog';
import { AdminBackup } from './components/admin/AdminBackup';
import { AdminPengaturan } from './components/admin/AdminPengaturan';
import { AdminLaporan } from './components/admin/AdminLaporan';

// Icons
import {
  Image as ImageIcon,
  LayoutDashboard,
  Users,
  Building2,
  Trophy,
  Calendar,
  Bell,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  ShieldAlert,
  Settings,
  Database,
  LogOut,
  Menu,
  X,
  FileText,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  BookOpen,
  ArrowRight,
  School,
  UserCog,
  Eye,
  Smartphone,
} from 'lucide-react';

export default function App() {
  const [initialized, setInitialized] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);

  // Data collections state
  const [settings, setSettings] = useState<PengaturanSistem>(StorageService.getPengaturan());
  const [lembagaList, setLembagaList] = useState<Lembaga[]>([]);
  const [pesertaList, setPesertaList] = useState<Peserta[]>([]);
  const [cabangList, setCabangList] = useState<CabangLomba[]>([]);

  // Multi-Device Modal State
  const [showMultiDeviceModal, setShowMultiDeviceModal] = useState(false);

  // Navigation / Views
  // Public: 'landing' | 'registrasi-lembaga' | 'validasi-peserta' | 'lupa-password' | 'galeri-foto' | 'galeri-video'
  const [publicView, setPublicView] = useState<
    'landing' | 'registrasi-lembaga' | 'validasi-peserta' | 'lupa-password' | 'galeri-foto' | 'galeri-video'
  >('landing');
  const [validasiQueryId, setValidasiQueryId] = useState('');
  const [loginModalRole, setLoginModalRole] = useState<UserRole | null>(null);

  // Active Tab inside Portals
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2);
    const newToast: ToastMessage = { id, type, message, timestamp: Date.now() };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const reloadData = async () => {
    await StorageService.init();
    setSettings(StorageService.getPengaturan());
    setLembagaList(StorageService.getLembaga());
    setPesertaList(StorageService.getPeserta());
    setCabangList(StorageService.getCabang());
  };

  useEffect(() => {
    let cleanupSync: (() => void) | undefined;

    const setup = async () => {
      await StorageService.init();

      // Connect StorageService mutations to Firestore Cloud in the background
      StorageService.setCloudSyncHandler((action, collectionName, id, data) => {
        if (action === 'set' && data) {
          syncDocToFirestore(collectionName, id, data);
        } else if (action === 'delete') {
          deleteDocFromFirestore(collectionName, id);
        }
      });

      const currentSession = AuthService.getSession();
      setSession(currentSession);
      await reloadData();

      // Silent initial pull from Firestore Cloud to ensure multi-device freshness
      try {
        await downloadAllFromFirestore();
        await reloadData();
      } catch {
        // offline or local fallback
      }

      // Check URL hash for QR validation links: e.g. #validasi?id=PORSENI-2026-00101
      const hash = window.location.hash;
      if (hash.startsWith('#validasi')) {
        const params = new URLSearchParams(hash.replace('#validasi?', ''));
        const queryId = params.get('id');
        if (queryId) {
          setValidasiQueryId(queryId);
          setPublicView('validasi-peserta');
        }
      }

      setInitialized(true);

      // Start real-time multi-device sync
      cleanupSync = setupRealtimeSync(() => {
        reloadData();
      });
    };

    setup();

    const handleSyncEvents = () => {
      reloadData();
    };

    window.addEventListener('porseni_cloud_synced', handleSyncEvents);
    window.addEventListener('porseni_spreadsheet_synced', handleSyncEvents);

    return () => {
      if (cleanupSync) cleanupSync();
      window.removeEventListener('porseni_cloud_synced', handleSyncEvents);
      window.removeEventListener('porseni_spreadsheet_synced', handleSyncEvents);
    };
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    setSession(null);
    setActiveTab('dashboard');
    setPublicView('landing');
    addToast('info', 'Anda telah berhasil keluar dari sistem.');
  };

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    setLoginModalRole(null);
    setActiveTab('dashboard');
    addToast('success', `Selamat datang, ${newSession.user.namaLengkap}!`);
    reloadData();
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-4">
        <div className="flex flex-col items-center gap-3">
          <PorseniEmblem size={64} className="animate-bounce" />
          <h2 className="text-base font-bold text-amber-300">Memuat Portal PORSENI Digital...</h2>
        </div>
      </div>
    );
  }

  // --- PUBLIC PAGES (When not logged in) ---
  if (!session) {
    return (
      <>
        {/* Floating Toasts */}
        <ToastContainer toasts={toasts} onDismiss={id => setToasts(t => t.filter(x => x.id !== id))} />

        {publicView === 'landing' && (
          <LandingPage
            onOpenLogin={role => setLoginModalRole(role)}
            onOpenRegistrasi={() => setPublicView('registrasi-lembaga')}
            onOpenValidasi={() => {
              setValidasiQueryId('');
              setPublicView('validasi-peserta');
            }}
            onNavigateGaleri={tab => {
              if (tab === 'foto') setPublicView('galeri-foto');
              else if (tab === 'video') setPublicView('galeri-video');
            }}
            onOpenMultiDevice={() => setShowMultiDeviceModal(true)}
          />
        )}

        {publicView === 'galeri-foto' && (
          <GaleriFoto
            onBackToHome={() => setPublicView('landing')}
            onNavigateVideo={() => setPublicView('galeri-video')}
            onOpenLogin={role => setLoginModalRole(role)}
          />
        )}

        {publicView === 'galeri-video' && (
          <GaleriVideo
            onBackToHome={() => setPublicView('landing')}
            onNavigateFoto={() => setPublicView('galeri-foto')}
            onOpenLogin={role => setLoginModalRole(role)}
          />
        )}

        {publicView === 'registrasi-lembaga' && (
          <RegistrasiLembaga
            onBackToHome={() => setPublicView('landing')}
            onSuccess={msg => {
              addToast('success', msg);
              reloadData();
            }}
          />
        )}

        {publicView === 'validasi-peserta' && (
          <ValidasiPeserta
            initialId={validasiQueryId}
            onBackToHome={() => setPublicView('landing')}
          />
        )}

        {publicView === 'lupa-password' && (
          <LupaPassword
            onBackToLogin={() => {
              setPublicView('landing');
              setLoginModalRole('LEMBAGA');
            }}
            onSuccess={msg => {
              addToast('success', msg);
              setPublicView('landing');
              setLoginModalRole('LEMBAGA');
            }}
          />
        )}

        {/* Login Modal */}
        {loginModalRole && (
          <LoginModal
            initialRole={loginModalRole}
            onClose={() => setLoginModalRole(null)}
            onSuccess={handleLoginSuccess}
            onForgotPassword={() => {
              setLoginModalRole(null);
              setPublicView('lupa-password');
            }}
          />
        )}

        {/* Multi-Device Access & Cloud Guide Modal */}
        <MultiDeviceModal
          isOpen={showMultiDeviceModal}
          onClose={() => setShowMultiDeviceModal(false)}
          onShowToast={addToast}
        />
      </>
    );
  }

  // Current logged in Lembaga (if role is Lembaga)
  const currentLembaga =
    lembagaList.find(l => l.id === session.user.lembagaId) ||
    lembagaList.find(l => l.username?.toLowerCase() === session.user.username?.toLowerCase()) ||
    lembagaList.find(l => l.emailLembaga?.toLowerCase() === session.user.email?.toLowerCase()) ||
    lembagaList[0];
  const userPesertaList = session.user.role === 'LEMBAGA' && currentLembaga
    ? pesertaList.filter(p => p.lembagaId === currentLembaga.id)
    : pesertaList;

  // --- AUTHENTICATED PORTALS (ADMIN OR LEMBAGA) ---
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased text-slate-800">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={id => setToasts(t => t.filter(x => x.id !== id))} />

      {/* Top Navbar */}
      <header className="no-print sticky top-0 z-40 bg-emerald-950 text-white border-b-2 border-amber-400 shadow-md">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-emerald-200 hover:text-white rounded-md hover:bg-emerald-900"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2.5">
              <PorseniEmblem size={34} />
              <div>
                <span className="text-xs font-extrabold tracking-wider text-amber-300 leading-none block">
                  PORSENI DIGITAL
                </span>
                <span className="text-[10px] text-emerald-200">
                  {settings.tahun} · {session.user.role === 'ADMIN' ? 'PANEL PANITIA PUSAT' : currentLembaga?.nama}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header User Profile & Action */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Multi-Device & Cloud Real-Time Indicator / Button */}
            <button
              onClick={() => setShowMultiDeviceModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-900/90 hover:bg-emerald-800 border border-emerald-700/70 text-emerald-100 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold shadow-2xs cursor-pointer"
              title="Akses aplikasi di HP / Laptop lain & Real-Time Cloud"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">Buka di HP / Multi-Device</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
            </button>

            {session.user.role === 'LEMBAGA' && currentLembaga && (
              <div className="hidden sm:block">
                <LembagaStatusBadge status={currentLembaga.status} />
              </div>
            )}

            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-white block leading-tight">
                {session.user.namaLengkap}
              </span>
              <span className="text-[10px] text-emerald-300 font-mono">
                {session.user.role} ({session.user.username})
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-semibold text-rose-200 hover:text-white bg-rose-950/60 hover:bg-rose-900 rounded-lg border border-rose-800 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace with Sidebar & Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR NAVIGATION */}
        <aside
          className={`no-print fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col justify-between transition-transform duration-200 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
          style={{ top: '56px' }}
        >
          <div className="p-4 space-y-6 overflow-y-auto flex-1">
            {/* Institution / Admin Card in Sidebar */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2 mb-1">
                {session.user.role === 'ADMIN' ? (
                  <UserCog className="w-4 h-4 text-emerald-800" />
                ) : (
                  <School className="w-4 h-4 text-emerald-800" />
                )}
                <span className="text-xs font-bold text-emerald-950">
                  {session.user.role === 'ADMIN' ? 'Administrator Sistem' : 'Kontingen Sekolah'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-900 line-clamp-1 font-semibold">
                {session.user.role === 'ADMIN' ? 'Panitia Pelaksana Pusat' : currentLembaga?.nama}
              </p>
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                {session.user.role === 'ADMIN' ? 'Hak Akses Penuh' : `ID: ${currentLembaga?.id}`}
              </span>
            </div>

            {/* Nav Menu */}
            <nav className="space-y-1 text-xs font-semibold">
              {session.user.role === 'ADMIN' ? (
                <>
                  <SidebarItem
                    icon={<LayoutDashboard className="w-4 h-4" />}
                    label="Dashboard"
                    active={activeTab === 'dashboard'}
                    onClick={() => {
                      setActiveTab('dashboard');
                      setMobileMenuOpen(false);
                    }}
                  />
                  <div className="pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">
                    Manajemen & Verifikasi
                  </div>
                  <SidebarItem
                    icon={<Building2 className="w-4 h-4" />}
                    label="Data Lembaga"
                    active={activeTab === 'lembaga'}
                    count={lembagaList.length}
                    onClick={() => {
                      setActiveTab('lembaga');
                      setMobileMenuOpen(false);
                    }}
                  />
                  <SidebarItem
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    label="Verifikasi Peserta"
                    active={activeTab === 'verifikasi-peserta'}
                    count={pesertaList.filter(p => p.status === 'MENUNGGU VERIFIKASI').length}
                    highlightCount
                    onClick={() => {
                      setActiveTab('verifikasi-peserta');
                      setMobileMenuOpen(false);
                    }}
                  />
                  <SidebarItem
                    icon={<Trophy className="w-4 h-4" />}
                    label="Master Cabang Lomba"
                    active={activeTab === 'cabang'}
                    count={cabangList.length}
                    onClick={() => {
                      setActiveTab('cabang');
                      setMobileMenuOpen(false);
                    }}
                  />
                  <SidebarItem
                    icon={<Calendar className="w-4 h-4" />}
                    label="Jadwal & Pengumuman"
                    active={activeTab === 'kegiatan'}
                    onClick={() => {
                      setActiveTab('kegiatan');
                      setMobileMenuOpen(false);
                    }}
                  />
                  <SidebarItem
                    icon={<ImageIcon className="w-4 h-4" />}
                    label="Galeri"
                    active={activeTab === 'galeri-admin'}
                    count={StorageService.getFotoKegiatan().length + StorageService.getVideoKegiatan().length}
                    onClick={() => {
                      setActiveTab('galeri-admin');
                      setMobileMenuOpen(false);
                    }}
                  />
                  <div className="pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">
                    Pelaporan & Kartu
                  </div>
                  <SidebarItem
                    icon={<Printer className="w-4 h-4" />}
                    label="Cetak Kartu Peserta"
                    active={activeTab === 'cetak-kartu-admin'}
                    count={pesertaList.filter(p => p.status === 'TERVERIFIKASI').length}
                    onClick={() => {
                      setActiveTab('cetak-kartu-admin');
                      setMobileMenuOpen(false);
                    }}
                  />
                  <SidebarItem
                    icon={<FileSpreadsheet className="w-4 h-4" />}
                    label="Laporan & Rekap"
                    active={activeTab === 'laporan'}
                    onClick={() => {
                      setActiveTab('laporan');
                      setMobileMenuOpen(false);
                    }}
                  />
                  <div className="pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">
                    Sistem & Keamanan
                  </div>
                  <SidebarItem
                    icon={<ShieldAlert className="w-4 h-4" />}
                    label="Log Audit Keamanan"
                    active={activeTab === 'audit'}
                    onClick={() => {
                      setActiveTab('audit');
                      setMobileMenuOpen(false);
                    }}
                  />
                  <SidebarItem
                    icon={<Database className="w-4 h-4" />}
                    label="Cadangan Basis Data"
                    active={activeTab === 'backup'}
                    onClick={() => {
                      setActiveTab('backup');
                      setMobileMenuOpen(false);
                    }}
                  />
                  <SidebarItem
                    icon={<Settings className="w-4 h-4" />}
                    label="Pengaturan PORSENI"
                    active={activeTab === 'pengaturan'}
                    onClick={() => {
                      setActiveTab('pengaturan');
                      setMobileMenuOpen(false);
                    }}
                  />
                </>
              ) : (
                /* Lembaga Navigation */
                <>
                  <SidebarItem
                    icon={<LayoutDashboard className="w-4 h-4" />}
                    label="Dashboard"
                    active={activeTab === 'dashboard'}
                    onClick={() => {
                      setActiveTab('dashboard');
                      setMobileMenuOpen(false);
                    }}
                  />
                  <SidebarItem
                    icon={<Building2 className="w-4 h-4" />}
                    label="Profil Lembaga"
                    active={activeTab === 'profil'}
                    onClick={() => {
                      setActiveTab('profil');
                      setMobileMenuOpen(false);
                    }}
                  />
                  <div className="pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">
                    Data Atlet & Seniman
                  </div>
                  <SidebarItem
                    icon={<Users className="w-4 h-4" />}
                    label="Data Peserta"
                    active={activeTab === 'peserta'}
                    count={userPesertaList.length}
                    onClick={() => {
                      setActiveTab('peserta');
                      setMobileMenuOpen(false);
                    }}
                  />
                  <SidebarItem
                    icon={<FileSpreadsheet className="w-4 h-4" />}
                    label="Import Excel"
                    active={activeTab === 'import'}
                    onClick={() => {
                      setActiveTab('import');
                      setMobileMenuOpen(false);
                    }}
                  />
                  <SidebarItem
                    icon={<Eye className="w-4 h-4" />}
                    label="Pratinjau Kartu Peserta"
                    active={activeTab === 'kartu'}
                    count={userPesertaList.filter(p => p.status === 'TERVERIFIKASI').length}
                    onClick={() => {
                      setActiveTab('kartu');
                      setMobileMenuOpen(false);
                    }}
                  />
                  <SidebarItem
                    icon={<FileText className="w-4 h-4" />}
                    label="Rekap Kontingen"
                    active={activeTab === 'rekap'}
                    onClick={() => {
                      setActiveTab('rekap');
                      setMobileMenuOpen(false);
                    }}
                  />
                  <div className="pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">
                    Informasi & Akun
                  </div>
                  <SidebarItem
                    icon={<BookOpen className="w-4 h-4" />}
                    label="Panduan & Juknis"
                    active={activeTab === 'panduan'}
                    onClick={() => {
                      setActiveTab('panduan');
                      setMobileMenuOpen(false);
                    }}
                  />
                  <SidebarItem
                    icon={<KeyRound className="w-4 h-4" />}
                    label="Ganti Password"
                    active={activeTab === 'profil'}
                    onClick={() => {
                      setActiveTab('profil');
                      setMobileMenuOpen(false);
                    }}
                  />
                </>
              )}
            </nav>
          </div>

          <div className="p-4 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 block font-mono">
              PORSENI DIGITAL v1.0 Resmi
            </span>
          </div>
        </aside>

        {/* MAIN VIEWPORT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {session.user.role === 'ADMIN' ? (
            /* ADMIN VIEWPORT */
            <>
              {activeTab === 'dashboard' && (
                <AdminDashboard
                  lembagaList={lembagaList}
                  pesertaList={pesertaList}
                  cabangList={cabangList}
                  pengaturan={settings}
                  onNavigate={tab => setActiveTab(tab)}
                />
              )}
              {activeTab === 'lembaga' && (
                <AdminLembaga
                  lembagaList={lembagaList}
                  pesertaList={pesertaList}
                  onRefresh={reloadData}
                  onShowToast={addToast}
                />
              )}
              {activeTab === 'verifikasi-peserta' && (
                <AdminVerifikasiPeserta
                  pesertaList={pesertaList}
                  lembagaList={lembagaList}
                  cabangList={cabangList}
                  onRefresh={reloadData}
                  onShowToast={addToast}
                />
              )}
              {activeTab === 'cabang' && (
                <AdminCabang
                  cabangList={cabangList}
                  onRefresh={reloadData}
                  onShowToast={addToast}
                />
              )}
              {activeTab === 'kegiatan' && (
                <AdminKegiatan
                  onRefresh={reloadData}
                  onShowToast={addToast}
                />
              )}
              {activeTab === 'galeri-admin' && (
                <AdminGaleri
                  onRefresh={reloadData}
                  onShowToast={addToast}
                />
              )}
              {activeTab === 'cetak-kartu-admin' && (
                <LembagaKartu
                  lembaga={lembagaList[0]}
                  pesertaList={pesertaList}
                  cabangList={cabangList}
                  lembagaList={lembagaList}
                  onShowToast={addToast}
                />
              )}
              {activeTab === 'laporan' && (
                <AdminLaporan
                  pesertaList={pesertaList}
                  lembagaList={lembagaList}
                  cabangList={cabangList}
                  onShowToast={addToast}
                />
              )}
              {activeTab === 'audit' && <AdminAuditLog />}
              {activeTab === 'backup' && (
                <AdminBackup
                  onRefresh={reloadData}
                  onShowToast={addToast}
                />
              )}
              {activeTab === 'pengaturan' && (
                <AdminPengaturan
                  onRefresh={reloadData}
                  onShowToast={addToast}
                />
              )}
            </>
          ) : (
            /* LEMBAGA VIEWPORT */
            currentLembaga && (
              <>
                {activeTab === 'dashboard' && (
                  <LembagaDashboard
                    lembaga={currentLembaga}
                    pesertaList={userPesertaList}
                    cabangList={cabangList}
                    pengaturan={settings}
                    onNavigate={tab => setActiveTab(tab)}
                  />
                )}
                {activeTab === 'peserta' && (
                  <LembagaPeserta
                    lembaga={currentLembaga}
                    pesertaList={userPesertaList}
                    cabangList={cabangList}
                    onRefresh={reloadData}
                    onShowToast={addToast}
                  />
                )}
                {activeTab === 'import' && (
                  <LembagaImportExcel
                    lembaga={currentLembaga}
                    onSuccessImport={count => {
                      addToast('success', `Berhasil mengimpor ${count} peserta ke kontingen Anda!`);
                      reloadData();
                      setActiveTab('peserta');
                    }}
                    onShowToast={addToast}
                  />
                )}
                {activeTab === 'kartu' && (
                  <LembagaKartu
                    lembaga={currentLembaga}
                    pesertaList={userPesertaList}
                    cabangList={cabangList}
                    onShowToast={addToast}
                  />
                )}
                {activeTab === 'profil' && (
                  <LembagaProfil
                    lembaga={currentLembaga}
                    onRefresh={reloadData}
                    onShowToast={addToast}
                  />
                )}
                {activeTab === 'rekap' && (
                  <LembagaRekap
                    lembaga={currentLembaga}
                    pesertaList={userPesertaList}
                    cabangList={cabangList}
                    onShowToast={addToast}
                  />
                )}
                {activeTab === 'panduan' && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                      <BookOpen className="w-5 h-5 text-emerald-700" />
                      <h2 className="text-base font-extrabold text-slate-900">
                        Petunjuk Teknis (Juknis) & Panduan Operasional Kontingen
                      </h2>
                    </div>
                    <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
                        <h4 className="font-bold text-sm mb-1">Ketentuan Pokok Partisipasi:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Siswa/atlet harus tercatat aktif di semester ganjil tahun ajaran berjalan.</li>
                          <li>Maksimal mengikuti 1 nomor pertandingan untuk menjaga konsentrasi jadwal.</li>
                          <li>Wajib mengunggah scan dokumen asli (Kartu Pelajar, Akta/KK, dan Surat Keterangan Dokter).</li>
                        </ul>
                      </div>
                      <p>
                        Jika Anda membutuhkan panduan teknis lebih lanjut atau terkendala dalam unggah berkas, hubungi Sekretariat Panitia Pelaksana di nomor WhatsApp: <strong>{settings.telepon}</strong> atau surel <strong>{settings.email}</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )
          )}
        </main>
      </div>

      {/* Multi-Device Access & Cloud Real-Time Modal */}
      <MultiDeviceModal
        isOpen={showMultiDeviceModal}
        onClose={() => setShowMultiDeviceModal(false)}
        onShowToast={addToast}
      />
    </div>
  );
}

// Subcomponents: Sidebar Item & Toast Container
function SidebarItem({
  icon,
  label,
  active,
  count,
  highlightCount,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  count?: number;
  highlightCount?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-emerald-700 text-white font-bold shadow-xs'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <div className="flex items-center gap-2.5 truncate">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      {typeof count === 'number' && (
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
            active
              ? 'bg-emerald-900 text-white'
              : highlightCount && count > 0
              ? 'bg-amber-100 text-amber-800'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto p-3.5 rounded-xl shadow-xl border text-xs flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${
            t.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : t.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : t.type === 'warning'
              ? 'bg-amber-900 text-white border-amber-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />}
            {t.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />}
            <span className="leading-relaxed font-medium">{t.message}</span>
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-white/70 hover:text-white shrink-0 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
