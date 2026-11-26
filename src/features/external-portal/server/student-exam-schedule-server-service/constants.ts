export const EXAM_AUTO_REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export const STATIC_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
  'Content-Type': 'application/json',
  Origin: 'https://qldttx.pttc1.edu.vn',
  Referer: 'https://qldttx.pttc1.edu.vn/',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  idpc: '0',
};

export const QLDTTX_EXAM_SEMESTERS_URL = 'https://qldttx.pttc1.edu.vn/api/report/w-locdshockylichthisinhvien';
export const QLDTTX_PERSONAL_EXAMS_URL = 'https://qldttx.pttc1.edu.vn/api/epm/w-locdslichthisvtheohocky';
