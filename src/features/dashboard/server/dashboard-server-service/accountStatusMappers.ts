import {
  DashboardData,
  ExternalAccountStatus,
  TelegramSyncStatus,
} from '../../types/dashboard.types';

export function findExternalAccounts(externalAccounts?: any[]) {
  const qldttxAccount = externalAccounts?.find(
    (a) => a.systemKey === 'QLDTTX_PTTC1' || (a.systemUrl && a.systemUrl.includes('qldttx'))
  );
  const lmsAccount = externalAccounts?.find(
    (a) => a.systemKey === 'LMS_PTTC1' || (a.systemUrl && a.systemUrl.includes('lms.pttc1.edu.vn'))
  );
  const slinkAccount = externalAccounts?.find(
    (a) => a.systemKey === 'SLINK_PTIT' || (a.systemUrl && a.systemUrl.includes('slink.ptit.edu.vn'))
  );

  return { qldttxAccount, lmsAccount, slinkAccount };
}

export function buildAccountStatuses(params: {
  qldttxAccount: any;
  lmsAccount: any;
  slinkAccount: any;
  telConfig: any;
}): {
  externalAccountStatus: ExternalAccountStatus;
  lmsAccountStatus: ExternalAccountStatus;
  slinkAccountStatus: ExternalAccountStatus;
  telegramStatus: TelegramSyncStatus;
} {
  const { qldttxAccount, lmsAccount, slinkAccount, telConfig } = params;

  const externalAccountStatus: ExternalAccountStatus = {
    isConfigured: Boolean(qldttxAccount),
    isConnected: qldttxAccount?.status === 'CONNECTED',
    lastSyncAt: qldttxAccount?.lastSyncAt ? qldttxAccount.lastSyncAt.toISOString() : null,
    systemName: qldttxAccount?.systemName || 'Cổng QLDTTX (PTTC1)',
  };

  const lmsAccountStatus: ExternalAccountStatus = {
    isConfigured: Boolean(lmsAccount),
    isConnected: lmsAccount?.status === 'CONNECTED',
    lastSyncAt: lmsAccount?.lastSyncAt ? lmsAccount.lastSyncAt.toISOString() : null,
    systemName: lmsAccount?.systemName || 'Hệ thống học tập trực tuyến (LMS PTTC1)',
  };

  const slinkAccountStatus: ExternalAccountStatus = {
    isConfigured: Boolean(slinkAccount),
    isConnected: slinkAccount?.status === 'CONNECTED',
    lastSyncAt: slinkAccount?.lastSyncAt ? slinkAccount.lastSyncAt.toISOString() : null,
    systemName: slinkAccount?.systemName || 'Cổng Thông Tin PTIT S-Link',
  };

  const telegramStatus: TelegramSyncStatus = {
    isConfigured: Boolean(telConfig && telConfig.chatId),
    isEnabled: Boolean(telConfig?.isEnabled),
    chatId: telConfig?.chatId,
    botUsername: telConfig?.botUsername || null,
  };

  return {
    externalAccountStatus,
    lmsAccountStatus,
    slinkAccountStatus,
    telegramStatus,
  };
}

export function mapActiveBatch(activeBatch: any): DashboardData['activeBatch'] {
  if (!activeBatch) return null;

  return {
    id: activeBatch.id,
    code: activeBatch.code,
    name: activeBatch.name,
    semester: activeBatch.semester,
    academicYear: activeBatch.academicYear,
    startDate: activeBatch.startDate,
    endDate: activeBatch.endDate,
    isActive: activeBatch.isActive,
    description: activeBatch.description,
    createdAt: activeBatch.createdAt.toISOString(),
    updatedAt: activeBatch.updatedAt.toISOString(),
  };
}
