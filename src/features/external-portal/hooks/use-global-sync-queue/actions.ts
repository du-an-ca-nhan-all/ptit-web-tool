import { Dispatch, SetStateAction } from 'react';
import { GlobalNightlySyncConfigValue } from '@/src/lib/globalConfig';
import { EnqueueGlobalSyncJobOptions } from './types';
import { postGlobalSyncActionApi, postGlobalSyncRawActionApi } from './api';

interface UseGlobalSyncActionsParams {
  selectedBatchId: string | null;
  setSelectedBatchId: Dispatch<SetStateAction<string | null>>;
  setConfig: Dispatch<SetStateAction<GlobalNightlySyncConfigValue>>;
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
  setMessage: Dispatch<SetStateAction<string | null>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
  fetchQueueData: (batchIdToFetch?: string) => Promise<void>;
}

export function createGlobalSyncActions({
  selectedBatchId,
  setSelectedBatchId,
  setConfig,
  setIsSubmitting,
  setMessage,
  setErrorMessage,
  fetchQueueData,
}: UseGlobalSyncActionsParams) {
  // Đưa tác vụ vào queue
  const enqueueJob = async (options: EnqueueGlobalSyncJobOptions) => {
    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);
    try {
      const { res, data } = await postGlobalSyncActionApi({
        action: 'ENQUEUE',
        ...options,
      });

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Lỗi khi kích hoạt tác vụ');
      }

      setMessage(data.message || 'Đã đưa tác vụ vào hàng đợi thành công');
      if (data.batchId) setSelectedBatchId(data.batchId);
      await fetchQueueData(data.batchId);
      return data;
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối máy chủ');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kích hoạt quét chạy thử 22h
  const triggerNightlyScheduler = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);
    try {
      const { res, data } = await postGlobalSyncActionApi({
        action: 'TRIGGER_NIGHTLY',
      });

      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi chạy quét chu kỳ');
      }

      setMessage(data.message || 'Đã kích hoạt quét kiểm tra lịch chạy');
      await fetchQueueData();
      return data;
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối máy chủ');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hủy các tác vụ đang chờ
  const cancelPendingQueue = async (batchId?: string) => {
    setIsSubmitting(true);
    try {
      const { res, data } = await postGlobalSyncActionApi({
        action: 'CANCEL_PENDING',
        batchId: batchId || selectedBatchId || undefined,
      });
      if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi khi hủy hàng đợi');
      setMessage(data.message || 'Đã hủy các tác vụ đang chờ');
      await fetchQueueData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi hủy hàng đợi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Thử lại các tác vụ lỗi
  const retryFailedQueue = async (batchId?: string) => {
    setIsSubmitting(true);
    try {
      const { res, data } = await postGlobalSyncActionApi({
        action: 'RETRY_FAILED',
        batchId: batchId || selectedBatchId || undefined,
      });
      if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi khi thử lại hàng đợi');
      setMessage(data.message || 'Đã đưa các tác vụ lỗi vào lại hàng đợi');
      await fetchQueueData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi thử lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dọn dẹp các batch đã hoàn thành
  const clearCompletedBatches = async () => {
    setIsSubmitting(true);
    try {
      const { res, data } = await postGlobalSyncActionApi({
        action: 'CLEAR_COMPLETED',
      });
      if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi khi dọn dẹp');
      setMessage(data.message || 'Đã dọn dẹp các đợt chạy đã xong');
      setSelectedBatchId(null);
      await fetchQueueData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi dọn dẹp');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cập nhật cấu hình lịch chạy ban đêm
  const updateConfig = async (newConfig: Partial<GlobalNightlySyncConfigValue>) => {
    setIsSubmitting(true);
    try {
      const { res, data } = await postGlobalSyncActionApi({
        action: 'UPDATE_CONFIG',
        config: newConfig,
      });
      if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi khi cập nhật cấu hình');
      setMessage(data.message || 'Đã cập nhật cấu hình thành công');
      if (data.config) setConfig(data.config);
      return data;
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi cập nhật cấu hình');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kích hoạt lại worker
  const resumeWorker = async (batchId?: string) => {
    try {
      await postGlobalSyncRawActionApi({
        action: 'PROCESS_NEXT',
        batchId: batchId || selectedBatchId || undefined,
      });
      fetchQueueData();
    } catch (err) {
      console.error('resumeWorker error:', err);
    }
  };

  // Phục hồi các tác vụ bị kẹt RUNNING
  const recoverStuckQueue = async (batchId?: string) => {
    setIsSubmitting(true);
    try {
      const { res, data } = await postGlobalSyncActionApi({
        action: 'RECOVER_STUCK',
        batchId: batchId || selectedBatchId || undefined,
      });
      if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi khi khôi phục');
      setMessage(data.message || 'Đã khôi phục các tác vụ bị kẹt thành công.');
      await fetchQueueData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi khôi phục');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    enqueueJob,
    triggerNightlyScheduler,
    cancelPendingQueue,
    retryFailedQueue,
    clearCompletedBatches,
    updateConfig,
    resumeWorker,
    recoverStuckQueue,
  };
}
