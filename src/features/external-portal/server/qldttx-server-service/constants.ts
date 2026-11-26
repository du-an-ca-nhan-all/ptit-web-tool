/**
 * QLDTTX API endpoints and static HTTP request constants.
 */

export const BASE_URL = 'https://qldttx.pttc1.edu.vn/#/home';
export const ORIGIN = 'https://qldttx.pttc1.edu.vn';
export const API_URL = 'https://qldttx.pttc1.edu.vn/api/dkmh/w-locdskqdkmhsinhvien';

export const REQUEST_BODY = {
  is_CVHT: false,
  is_Clear: false,
};

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

export const QLDTTX_ANNOUNCEMENTS_API_URL = 'https://qldttx.pttc1.edu.vn/api/web/w-locdsthongbao';
export const QLDTTX_SEMESTER_API_URL = 'https://qldttx.pttc1.edu.vn/api/sch/w-locdshockytkbuser';
export const QLDTTX_TIMETABLE_API_URL = 'https://qldttx.pttc1.edu.vn/api/sch/w-locdstkbtuanusertheohocky';
export const QLDTTX_GRADES_API_URL =
  'https://qldttx.pttc1.edu.vn/api/srm/w-locdsdiemsinhvien?hien_thi_mon_theo_hkdk=false';
export const QLDTTX_SUMMARY_GRADES_API_URL =
  'https://qldttx.pttc1.edu.vn/api/srm/w-locketquadiemsinhvien';
export const QLDTTX_LOW_GRADES_API_URL =
  'https://qldttx.pttc1.edu.vn/api/srm/w-locdsmhchuadatdiemtoithieu';
export const QLDTTX_SEMESTER_COURSES_API_URL =
  'https://qldttx.pttc1.edu.vn/api/sch/w-locdstkbhockytheodoituong';
export const QLDTTX_STUDENT_INFO_API_URL = 'https://qldttx.pttc1.edu.vn/api/dkmh/w-locsinhvieninfo';
