export const FLOW_QUEUE_CONCURRENCY = 3; // Xử lý đồng thời 3 sinh viên cùng lúc
export const DELAY_BETWEEN_CHUNKS_MS = 600; // Nghỉ 600ms giữa các chunk để tránh bị QLDTTX chặn

let isWorkerRunning = false;

export function getIsWorkerRunning(): boolean {
  return isWorkerRunning;
}

export function setIsWorkerRunning(value: boolean): void {
  isWorkerRunning = value;
}
