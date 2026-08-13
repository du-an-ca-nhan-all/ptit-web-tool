import React, { useState } from 'react';
import { hashSHA512 } from '../utils/crypto';
import { LoginUser, ExamRecord } from '../types';
import { LogIn, Lock, User } from 'lucide-react';

interface LoginScreenProps {
  users: LoginUser[];
  records: ExamRecord[];
  onLogin: (user: LoginUser) => void;
}

export default function LoginScreen({ users, records, onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password) {
      setError('Vui lòng nhập tài khoản và mật khẩu');
      return;
    }

    setIsLoading(true);

    try {
      const normalizedInput = username.trim().toLowerCase();
      const user = users.find(u => u.username.toLowerCase() === normalizedInput);
      
      if (user) {
        if (user.password_hash) {
          const hash = await hashSHA512(password);
          if (hash !== user.password_hash) {
            setError('Tài khoản hoặc mật khẩu không chính xác');
            setIsLoading(false);
            return;
          }
        } else {
          if (password !== user.username.toUpperCase()) {
            setError('Tài khoản hoặc mật khẩu không chính xác');
            setIsLoading(false);
            return;
          }
        }
        // Success for user in yaml
        const { password_hash, ...safeUser } = user;
        onLogin(safeUser as LoginUser);
      } else {
        // Fallback: check if username matches password (uppercase) and exists in records
        const upperInput = username.trim().toUpperCase();
        if (password.trim().toUpperCase() === upperInput) {
          const exists = records.some(r => r.MaSV?.toUpperCase() === upperInput);
          if (exists) {
            const studentRecord = records.find(r => r.MaSV?.toUpperCase() === upperInput);
            const fallbackUser: LoginUser = {
              username: upperInput,
              role: 'sinh_vien',
              lop: studentRecord?.MaLop || '',
              // password_hash is omitted or empty
            };
            onLogin(fallbackUser);
          } else {
            setError('Tài khoản không tồn tại trong hệ thống');
          }
        } else {
          setError('Tài khoản hoặc mật khẩu không chính xác');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Đã xảy ra lỗi khi đăng nhập');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Hệ Thống Quản Lý Lịch Thi</h1>
          <p className="text-blue-100 mt-2 text-sm">Vui lòng đăng nhập để tiếp tục</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm font-medium mb-6 text-center border border-rose-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tên đăng nhập</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  placeholder="Nhập tên tài khoản"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/30 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Đăng Nhập'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
