'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { usePWAContext } from '../../../components/pwa/PWAProvider';
import ForgotPasswordModal from './ForgotPasswordModal';
import { LoginScreenProps } from './login-screen/types';
import { useLoginScreen } from './login-screen/useLoginScreen';
import LoginHeader from './login-screen/LoginHeader';
import LoginFormTab from './login-screen/LoginFormTab';
import RegisterFormTab from './login-screen/RegisterFormTab';
import AdminContactFooter from './login-screen/AdminContactFooter';

export default function LoginScreen({
  users = [],
  records = [],
  initialError,
  onLogin,
}: LoginScreenProps) {
  const { isInstalled, openInstallModal } = usePWAContext();
  const state = useLoginScreen({ initialError, onLogin });

  void users;
  void records;

  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex flex-col items-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-3 py-4 sm:py-8 sm:px-6 font-sans overflow-y-auto overflow-x-hidden pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-[calc(env(safe-area-inset-bottom,0px)+2rem)]">
      {/* Dynamic Background Blurs */}
      <div className="fixed top-1/4 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="fixed bottom-1/4 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      {/* PWA Install Button on Login Screen */}
      {!isInstalled && (
        <button
          type="button"
          onClick={openInstallModal}
          className="fixed sm:absolute top-[calc(env(safe-area-inset-top,0px)+0.75rem)] right-3 sm:right-4 z-30 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/20 rounded-full text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95"
          title="Cài đặt PTIT EduSync về thiết bị"
        >
          <Download className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Cài Đặt App</span>
          <span className="sm:hidden">Cài App</span>
        </button>
      )}

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200/80 relative z-10 animate-in zoom-in-95 duration-300 my-auto shrink-0">
        {/* Header with Switcher Tabs */}
        <LoginHeader
          mode={state.mode}
          onSelectLogin={state.handleSelectLoginTab}
          onSelectRegister={state.handleSelectRegisterTab}
        />

        {/* ===================== TAB 1: LOGIN FORM ===================== */}
        {state.mode === 'LOGIN' && (
          <LoginFormTab
            username={state.username}
            password={state.password}
            showPassword={state.showPassword}
            error={state.error}
            isLoading={state.isLoading}
            onUsernameChange={state.setUsername}
            onPasswordChange={state.setPassword}
            onToggleShowPassword={() => state.setShowPassword(!state.showPassword)}
            onSubmit={state.handleLoginSubmit}
            onOpenForgotModal={() => state.setIsForgotModalOpen(true)}
            onSwitchToRegister={state.handleSwitchToRegisterFromLogin}
          />
        )}

        {/* ===================== TAB 2: REGISTER FORM ===================== */}
        {state.mode === 'REGISTER' && (
          <RegisterFormTab
            regUsername={state.regUsername}
            regPhone={state.regPhone}
            regPassword={state.regPassword}
            regNote={state.regNote}
            showRegPassword={state.showRegPassword}
            regSuccessMsg={state.regSuccessMsg}
            isAutoApproved={state.isAutoApproved}
            regError={state.regError}
            isRegistering={state.isRegistering}
            isCheckingStudent={state.isCheckingStudent}
            studentInfo={state.studentInfo}
            studentLookupError={state.studentLookupError}
            onRegUsernameChange={state.setRegUsername}
            onRegPhoneChange={state.setRegPhone}
            onRegPasswordChange={state.setRegPassword}
            onRegNoteChange={state.setRegNote}
            onToggleShowRegPassword={() => state.setShowRegPassword(!state.showRegPassword)}
            onSubmit={state.handleRegisterSubmit}
            onOpenForgotModal={() => state.setIsForgotModalOpen(true)}
            onSwitchToLogin={() => state.setMode('LOGIN')}
            onBackToLoginFromSuccess={state.handleBackToLoginFromRegisterSuccess}
          />
        )}

        {/* Bottom Spacing & Admin Contact Information */}
        <AdminContactFooter />
      </div>

      {/* Portal Forgot Password Modal (QLHT) */}
      <ForgotPasswordModal
        isOpen={state.isForgotModalOpen}
        onClose={() => state.setIsForgotModalOpen(false)}
        defaultUsername={state.username || state.regUsername}
        onSuccess={state.handleForgotPasswordSuccess}
      />
    </div>
  );
}
