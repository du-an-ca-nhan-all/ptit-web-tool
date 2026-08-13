export const PRICING_CONFIG = {
  commonRoom: 600000,
  englishOralRoom: 2000000, // Tiếng anh vấn đáp
};

export const calculateRoomPrice = (subject: string, subjectCode: string, room: string, examFormat: string = ''): number => {
  const subjectLower = (subject || '').toLowerCase();
  const formatLower = (examFormat || '').toLowerCase();
  const roomLower = (room || '').toLowerCase();
  
  // Check if it's English and Oral (Vấn đáp)
  const isEnglish = subjectLower.includes('tiếng anh') || subjectLower.includes('english');
  const isOral = subjectLower.includes('vấn đáp') || roomLower.includes('vấn đáp') || formatLower.includes('vấn đáp') || formatLower.includes('vđ') || formatLower === 'vd';
  
  if (isEnglish && isOral) {
    return PRICING_CONFIG.englishOralRoom;
  }
  
  return PRICING_CONFIG.commonRoom;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};
