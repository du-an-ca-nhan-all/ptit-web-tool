'use client';

import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { postFlowQueueAction, postFlowQueueActionNoJson } from './api';
import { EnqueueFlowOptions } from './types';

interface UseFlowQueueActionsParams {
  selectedClass: string;
  monitorUsername: string;
  selectedBatchId: string | null;
  setSelectedBatchId: Dispatch<SetStateAction<string | null>>;
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
  setMessage: Dispatch<SetStateAction<string>>;
  setErrorMessage: Dispatch<SetStateAction<string>>;
  fetchQueueData: (batchId?: string) => Promise<void>;
}

export function useFlowQueueActions({
  selectedClass,
  monitorUsername,
  selectedBatchId,
  setSelectedBatchId,
  setIsSubmitting,
  setMessage,
  setErrorMessage,
  fetchQueueData,
}: UseFlowQueueActionsParams) {
  // Enqueue new flow action
  const enqueueFlow = useCallback(
    async (options: EnqueueFlowOptions) => {
      setIsSubmitting(true);
      setErrorMessage('');
      setMessage('');

      try {
        const { ok, data } = await postFlowQueueAction({
          action: 'ENQUEUE',
          classCode: selectedClass,
          monitorUsername,
          ...options,
        });

        if (ok && data.success) {
          setMessage(data.message || 'Đã đưa tác vụ vào hàng đợi thành công!');
          if (data.batchId) setSelectedBatchId(data.batchId);
          await fetchQueueData(data.batchId);
          return { success: true, batchId: data.batchId };
        } else {
          setErrorMessage(data.error || data.message || 'Không thể đưa vào hàng đợi');
          return { success: false };
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Lỗi mạng khi gửi tác vụ vào hàng đợi');
        return { success: false };
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedClass, monitorUsername, fetchQueueData, setIsSubmitting, setErrorMessage, setMessage, setSelectedBatchId]
  );

  // Cancel all pending items
  const cancelPendingQueue = useCallback(
    async (batchId?: string) => {
      setIsSubmitting(true);
      try {
        const { ok, data } = await postFlowQueueAction({
          action: 'CANCEL_PENDING',
          classCode: selectedClass,
          monitorUsername,
          batchId: batchId || selectedBatchId || undefined,
        });
        if (ok && data.success) {
          setMessage(data.message);
          await fetchQueueData(selectedBatchId || undefined);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Lỗi khi hủy hàng đợi');
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedClass, monitorUsername, selectedBatchId, fetchQueueData, setIsSubmitting, setMessage, setErrorMessage]
  );

  // Retry failed items
  const retryFailedQueue = useCallback(
    async (batchId?: string) => {
      setIsSubmitting(true);
      try {
        const { ok, data } = await postFlowQueueAction({
          action: 'RETRY_FAILED',
          classCode: selectedClass,
          monitorUsername,
          batchId: batchId || selectedBatchId || undefined,
        });
        if (ok && data.success) {
          setMessage(data.message);
          await fetchQueueData(selectedBatchId || undefined);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Lỗi khi thử lại hàng đợi');
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedClass, monitorUsername, selectedBatchId, fetchQueueData, setIsSubmitting, setMessage, setErrorMessage]
  );

  // Clear completed batches
  const clearCompletedBatches = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const { ok, data } = await postFlowQueueAction({
        action: 'CLEAR_COMPLETED',
        classCode: selectedClass,
        monitorUsername,
      });
      if (ok && data.success) {
        setMessage(data.message);
        setSelectedBatchId(null);
        await fetchQueueData();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi dọn dẹp hàng đợi');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedClass, monitorUsername, fetchQueueData, setIsSubmitting, setMessage, setSelectedBatchId, setErrorMessage]);

  // Resume worker if paused
  const resumeWorker = useCallback(async () => {
    try {
      await postFlowQueueActionNoJson({
        action: 'PROCESS_NEXT',
        classCode: selectedClass,
        monitorUsername,
        batchId: selectedBatchId || undefined,
      });
      await fetchQueueData(selectedBatchId || undefined);
    } catch (err) {
      console.error('Lỗi khi kích hoạt worker:', err);
    }
  }, [selectedClass, monitorUsername, selectedBatchId, fetchQueueData]);

  // Phục hồi các tác vụ bị kẹt RUNNING
  const recoverStuckQueue = useCallback(
    async (batchId?: string) => {
      setIsSubmitting(true);
      try {
        const { ok, data } = await postFlowQueueAction({
          action: 'RECOVER_STUCK',
          classCode: selectedClass,
          monitorUsername,
          batchId: batchId || selectedBatchId || undefined,
        });
        if (ok && data.success) {
          setMessage(data.message || 'Đã khôi phục các tác vụ bị kẹt thành công.');
          await fetchQueueData(selectedBatchId || undefined);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Lỗi khi khôi phục tác vụ bị kẹt');
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedClass, monitorUsername, selectedBatchId, fetchQueueData, setIsSubmitting, setMessage, setErrorMessage]
  );

  return {
    enqueueFlow,
    cancelPendingQueue,
    retryFailedQueue,
    clearCompletedBatches,
    resumeWorker,
    recoverStuckQueue,
  };
}
