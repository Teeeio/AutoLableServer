/**
 * B站API服务
 * 处理与B站API的交互
 */

import https from 'https';
import { CONFIG } from '../config/constants.js';

/**
 * HTTP请求辅助函数
 */
function fetchJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers }, (response) => {
      // 处理重定向
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        response.resume();
        fetchJson(response.headers.location, headers).then(resolve, reject);
        return;
      }

      // 处理错误
      if (response.statusCode && response.statusCode >= 400) {
        response.resume();
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        try {
          const text = Buffer.concat(chunks).toString('utf8');
          resolve(JSON.parse(text));
        } catch (err) {
          reject(err);
        }
      });
    });

    request.on('error', reject);
  });
}

/**
 * 获取B站视频封面
 */
export async function getBilibiliCover(bvid) {
  if (!bvid || !bvid.trim()) {
    return { ok: false, error: 'Missing bvid.' };
  }

  try {
    const infoUrl = `${CONFIG.BILIBILI.BASE_URL}/x/web-interface/view?bvid=${bvid}`;
    const data = await fetchJson(infoUrl, {
      Referer: CONFIG.BILIBILI.REFERER,
      'User-Agent': CONFIG.BILIBILI.USER_AGENT
    });

    return {
      ok: true,
      pic: data?.data?.pic || '',
      title: data?.data?.title || ''
    };
  } catch (err) {
    return { ok: false, error: 'Failed to fetch cover.' };
  }
}
