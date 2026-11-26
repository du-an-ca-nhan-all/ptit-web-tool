/**
 * QLDTTX Announcements fetcher.
 */

import { QLDTTX_ANNOUNCEMENTS_API_URL } from './constants';
import { postQldttxWithAuth } from './httpClient';
import type { QldttxAccountInput } from './types';

/**
 * Lấy danh sách thông báo từ cổng QLDTTX (https://qldttx.pttc1.edu.vn/#/xemthongbao)
 */
export async function fetchStudentAnnouncementsFromQLDTTX(account: QldttxAccountInput): Promise<{
  announcements: Array<{
    id: string;
    title: string;
    summary?: string;
    content?: string;
    publishDate?: string;
    sender?: string;
    isRead?: boolean;
    isMustRead?: boolean;
    targetSearch?: string;
    link?: string;
  }>;
  unreadCount: number;
  totalCount: number;
  newToken?: string;
}> {
  const bodyPayload = {
    filter: {
      id: null,
      is_noi_dung: true,
      is_web: true,
    },
    additional: {
      paging: {
        limit: 100,
        page: 1,
      },
      ordering: [
        {
          name: 'ngay_gui',
          order_type: 1,
        },
      ],
    },
  };

  const { response, parsed, newToken } = await postQldttxWithAuth({
    url: QLDTTX_ANNOUNCEMENTS_API_URL,
    body: bodyPayload,
    account,
  });

  if (!response.ok) {
    throw new Error(
      `Cổng QLDTTX phản hồi lỗi (${response.status}): ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`
    );
  }

  const dataObj = parsed?.data || {};
  const rawList: any[] = Array.isArray(dataObj?.ds_thong_bao)
    ? dataObj.ds_thong_bao
    : Array.isArray(dataObj?.items)
    ? dataObj.items
    : Array.isArray(dataObj)
    ? dataObj
    : [];

  const unreadCount = typeof dataObj?.notification === 'number' ? dataObj.notification : 0;
  const totalCount = typeof dataObj?.total_items === 'number' ? dataObj.total_items : rawList.length;

  const announcements = rawList.map((item: any, idx: number) => {
    const id = String(
      item.id ||
        item.id_thong_bao ||
        item.ma_thong_bao ||
        item.id_tb ||
        item.guid ||
        `${item.tieu_de || item.title || 'tb'}-${item.ngay_gui || item.ngay_tao || item.ngay_dang || idx}`
    );

    const title =
      item.tieu_de ||
      item.title ||
      item.ten_thong_bao ||
      item.subject ||
      'Thông báo mới từ Cổng QLDTTX (PTTC1)';

    const content =
      item.noi_dung ||
      item.content ||
      item.noi_dung_chi_tiet ||
      item.description ||
      '';

    const summary =
      item.noi_dung_tom_tat ||
      item.tom_tat ||
      item.summary ||
      (content ? content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().slice(0, 350) : '');

    const publishDate =
      item.ngay_gui ||
      item.ngay_dang ||
      item.ngay_tao ||
      item.created_at ||
      new Date().toISOString();

    const sender =
      item.nguoi_gui ||
      item.tac_gia ||
      item.don_vi_gui ||
      'Phòng Đào tạo / Giảng viên PTIT';

    const isRead = item.is_da_doc !== undefined ? Boolean(item.is_da_doc) : true;
    const isMustRead = Boolean(item.is_phai_xem);
    const targetSearch = item.doi_tuong_search || item.phan_cap_search || '';

    return {
      id,
      title,
      summary,
      content,
      publishDate,
      sender,
      isRead,
      isMustRead,
      targetSearch,
      link: 'https://qldttx.pttc1.edu.vn/#/xemthongbao',
    };
  });

  return {
    announcements,
    unreadCount,
    totalCount,
    newToken,
  };
}
