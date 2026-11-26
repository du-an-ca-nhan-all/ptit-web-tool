import { LMS_BASE_URL, LMS_USER_AGENT } from './constants';
import { CookieJar } from './cookieJar';
import type { LmsActivityItem, LmsSectionItem } from './types';

/**
 * Lấy chi tiết các chương (sections) và hoạt động học tập (activities) trong một khóa học LMS
 */
export async function fetchLmsCourseSections(
  courseId: string,
  tokenOrCookies: string
): Promise<{
  courseId: string;
  courseTitle: string;
  sections: LmsSectionItem[];
  totalActivities: number;
}> {
  const jar = new CookieJar(tokenOrCookies);
  const courseUrl = `${LMS_BASE_URL}/course/view.php?id=${courseId}`;

  const res = await fetch(courseUrl, {
    headers: {
      Cookie: jar.getCookieHeader(),
      'User-Agent': LMS_USER_AGENT,
    },
  });
  const html = await res.text();

  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title>([\s\S]*?)<\/title>/i);
  const courseTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : `Môn học ${courseId}`;

  const sections: LmsSectionItem[] = [];
  const sectionRegex = /<li[^>]*class="[^"]*section[^"]*"[^>]*>([\s\S]*?)<\/li>/g;
  let secMatch: RegExpExecArray | null;
  let totalAct = 0;

  while ((secMatch = sectionRegex.exec(html)) !== null) {
    const secHtml = secMatch[1];
    const secTitleMatch = secHtml.match(/class="[^"]*sectionname[^"]*"[^>]*>([\s\S]*?)<\/(?:h3|a)>/i);
    const secTitle = secTitleMatch ? secTitleMatch[1].replace(/<[^>]+>/g, '').trim() : 'Chung';

    const actRegex =
      /href="(https:\/\/lms\.pttc1\.edu\.vn\/mod\/([a-z0-9_]+)\/view\.php\?id=(\d+))"[^>]*>([\s\S]*?)<\/a>/g;
    let actMatch: RegExpExecArray | null;
    const activities: LmsActivityItem[] = [];
    const seenActId = new Set<string>();

    while ((actMatch = actRegex.exec(secHtml)) !== null) {
      const fullUrl = actMatch[1];
      const modType = actMatch[2];
      const actId = actMatch[3];
      const actName = actMatch[4].replace(/<[^>]+>/g, '').trim();

      if (!seenActId.has(actId) && actName) {
        seenActId.add(actId);
        activities.push({
          id: actId,
          type: modType,
          name: actName,
          url: fullUrl,
        });
        totalAct++;
      }
    }

    if (activities.length > 0) {
      sections.push({
        title: secTitle,
        activities,
      });
    }
  }

  return {
    courseId,
    courseTitle,
    sections,
    totalActivities: totalAct,
  };
}
