import React, { useState } from 'react';
import { AuditLog } from '../../types';
import { StorageService } from '../../services/storage';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  RefreshCw,
} from 'lucide-react';

export const AdminAuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(StorageService.getAuditLogs());

  const handleRefresh = () => {
    setLogs(StorageService.getAuditLogs());
  };
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  const filtered = logs.filter(log => {
    const matchSearch =
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.aktivitas.toLowerCase().includes(search.toLowerCase()) ||
      log.rincian.toLowerCase().includes(search.toLowerCase()) ||
      log.id.toLowerCase().includes(search.toLowerCase());
    const matchRole = !filterRole || log.role === filterRole;
    const matchStatus = !filterStatus || log.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-extrabold text-slate-900">
                Log Audit & Jejak Aktivitas Keamanan Sistem
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Merekam seluruh riwayat autentikasi, transaksi verifikasi, perubahan data, dan ekspor dokumen.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
              {filtered.length} Catatan Log
            </span>
            <button
              onClick={handleRefresh}
              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              title="Perbarui data log terkini"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari aktivitas, user, atau rincian..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <select
              value={filterRole}
              onChange={e => {
                setFilterRole(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Semua Hak Akses / Role</option>
              <option value="ADMIN">ADMIN</option>
              <option value="LEMBAGA">LEMBAGA</option>
              <option value="SISTEM">SISTEM</option>
              <option value="PUBLIK">PUBLIK</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={e => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Semua Status Log</option>
              <option value="SUKSES">SUKSES</option>
              <option value="GAGAL">GAGAL</option>
              <option value="PERINGATAN">PERINGATAN</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">ID Log</th>
                <th className="px-4 py-3">Waktu (WIB)</th>
                <th className="px-4 py-3">Pengguna & Role</th>
                <th className="px-4 py-3">Aktivitas</th>
                <th className="px-4 py-3">Rincian Perubahan</th>
                <th className="px-4 py-3">IP / Host</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ada catatan aktivitas audit yang sesuai filter.
                  </td>
                </tr>
              ) : (
                paginated.map(log => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-600 text-[11px]">
                        {log.id}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{log.user}</span>
                        <span className="text-[10px] text-emerald-800 font-semibold">{log.role}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {log.aktivitas}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs text-[11px] leading-relaxed">
                        {log.rincian}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                        {log.ip}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                            log.status === 'SUKSES'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.status === 'GAGAL'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {log.status === 'SUKSES' ? 'SUKSES' : log.status === 'GAGAL' ? 'GAGAL' : 'PERINGATAN'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan {(currentPage - 1) * rowsPerPage + 1} s.d{' '}
              {Math.min(currentPage * rowsPerPage, filtered.length)} dari {filtered.length} log
            </span>
            <div className="flex gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <span className="px-3 py-1 font-bold text-slate-800">
                Hal. {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
