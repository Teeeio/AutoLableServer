/**
 * API 接口测试脚本
 * 测试所有客户端与服务器交互的API
 */

const BASE_URL = 'http://localhost:8787';

// 测试结果统计
let passed = 0;
let failed = 0;
const results = [];

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    const data = await response.json().catch(() => ({}));
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

function log(name, success, detail = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}${detail ? ` (${detail})` : ''}`);
  if (success) passed++;
  else failed++;
  results.push({ name, success, detail });
}

async function test(name, fn) {
  try {
    await fn();
  } catch (error) {
    log(name, false, error.message);
  }
}

// ==================== 测试开始 ====================

let authToken = '';
let testUserId = '';
let testCardId = '';

async function runTests() {
  console.log('\n========================================');
  console.log('    AutoLableServer API 测试');
  console.log('========================================\n');

  // ---------- 健康检查 ----------
  console.log('--- 健康检查 ---');
  await test('GET /api/health', async () => {
    const { status, data } = await request('/api/health');
    log('健康检查', status === 200 && data.ok === true, `status: ${status}`);
  });

  // ---------- 认证相关 ----------
  console.log('\n--- 认证相关 ---');

  await test('POST /api/auth/register', async () => {
    const { status, data } = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: `testuser_${Date.now()}`,
        password: 'test1234'
      })
    });
    log('用户注册', status === 200 && data.ok === true, `status: ${status}`);
  });

  await test('POST /api/auth/login', async () => {
    const { status, data } = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'demo',
        password: 'demo'
      })
    });
    const success = status === 200 && data.ok === true && data.token;
    log('用户登录', success, `status: ${status}`);
    if (success) {
      authToken = data.token;
      testUserId = data.user?.id;
    }
  });

  await test('GET /api/auth/session', async () => {
    const { status, data } = await request('/api/auth/session', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log('获取会话', status === 200 && data.ok === true, `status: ${status}`);
  });

  // ---------- 卡片相关 ----------
  console.log('\n--- 卡片相关 ---');

  await test('POST /api/cards - 创建卡片', async () => {
    const { status, data } = await request('/api/cards', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({
        title: '测试卡片',
        bvid: 'BV1test123456',
        aid: 12345678,
        cid: 87654321,
        start: 10.5,
        end: 30.5,
        visibility: 'private',
        tags: ['test', 'demo'],
        clipTags: ['clip1']
      })
    });
    const success = status === 200 && data.ok === true && data.item?.id;
    log('创建卡片', success, `status: ${status}, cardId: ${data.item?.id}`);
    if (success) testCardId = data.item.id;
  });

  await test('GET /api/cards - 获取我的卡片', async () => {
    const { status, data } = await request('/api/cards', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log('获取我的卡片', status === 200 && data.ok === true, `count: ${data.items?.length}`);
  });

  await test('GET /api/cards/public - 获取公开卡片', async () => {
    const { status, data } = await request('/api/cards/public');
    log('获取公开卡片', status === 200 && data.ok === true, `count: ${data.items?.length}`);
  });

  await test('PATCH /api/cards/:id - 更新卡片', async () => {
    if (!testCardId) {
      log('更新卡片', false, '没有测试卡片ID');
      return;
    }
    const { status, data } = await request(`/api/cards/${testCardId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ title: '更新后的测试卡片' })
    });
    log('更新卡片', status === 200 && data.ok === true, `status: ${status}`);
  });

  // ---------- 发布/下架 ----------
  console.log('\n--- 发布/下架 ---');

  await test('POST /api/cards/:id/publish - 发布卡片', async () => {
    if (!testCardId) {
      log('发布卡片', false, '没有测试卡片ID');
      return;
    }
    const { status, data } = await request(`/api/cards/${testCardId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({
        categoryId: 'kpop',
        searchTags: ['kpop', 'dance'],
        clipTags: ['test']
      })
    });
    log('发布卡片', status === 200 && data.ok === true, `status: ${status}`);
  });

  await test('POST /api/cards/:id/unpublish - 下架卡片', async () => {
    if (!testCardId) {
      log('下架卡片', false, '没有测试卡片ID');
      return;
    }
    const { status, data } = await request(`/api/cards/${testCardId}/unpublish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log('下架卡片', status === 200 && data.ok === true, `status: ${status}`);
  });

  // ---------- 点赞功能 ----------
  console.log('\n--- 点赞功能 ---');

  await test('POST /api/cards/:id/like - 点赞卡片', async () => {
    if (!testCardId) {
      log('点赞卡片', false, '没有测试卡片ID');
      return;
    }
    const { status, data } = await request(`/api/cards/${testCardId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log('点赞卡片', status === 200 && data.ok === true, `isLiked: ${data.isLiked}`);
  });

  await test('POST /api/cards/:id/like - 取消点赞', async () => {
    if (!testCardId) {
      log('取消点赞', false, '没有测试卡片ID');
      return;
    }
    const { status, data } = await request(`/api/cards/${testCardId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log('取消点赞', status === 200 && data.ok === true, `isLiked: ${data.isLiked}`);
  });

  await test('GET /api/my/liked-cards - 获取点赞的卡片', async () => {
    const { status, data } = await request('/api/my/liked-cards', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log('获取点赞的卡片', status === 200 && data.ok === true, `count: ${data.items?.length}`);
  });

  // ---------- 分类功能 ----------
  console.log('\n--- 分类功能 ---');

  await test('GET /api/categories - 获取分类列表', async () => {
    const { status, data } = await request('/api/categories');
    log('获取分类列表', status === 200 && data.ok === true && data.items?.length > 0,
      `count: ${data.items?.length}`);
  });

  await test('GET /api/categories/:id/cards - 获取分类下的卡片', async () => {
    const { status, data } = await request('/api/categories/kpop/cards');
    log('获取分类下的卡片', status === 200 && data.ok === true, `count: ${data.items?.length}`);
  });

  // ---------- B站API ----------
  console.log('\n--- B站API ---');

  await test('GET /api/bili/cover - 获取B站封面', async () => {
    const { status, data } = await request('/api/bili/cover?bvid=BV1GJ411x7h7');
    // 可能因为网络问题失败，只检查格式
    const success = status === 200 && (data.ok === true || data.ok === false);
    log('获取B站封面', success, `status: ${status}`);
  });

  // ---------- 标签相关 ----------
  console.log('\n--- 标签相关 ---');

  await test('GET /api/tags - 获取公开标签', async () => {
    const { status, data } = await request('/api/tags');
    log('获取公开标签', status === 200 && data.ok === true, `count: ${data.items?.length}`);
  });

  // ---------- 收藏夹相关 ----------
  console.log('\n--- 收藏夹相关 ---');

  await test('GET /api/collections/public - 获取公开收藏夹', async () => {
    const { status, data } = await request('/api/collections/public');
    log('获取公开收藏夹', status === 200 && data.ok === true, `count: ${data.items?.length}`);
  });

  // ---------- 清理测试数据 ----------
  console.log('\n--- 清理测试数据 ---');

  await test('DELETE /api/cards/:id - 删除卡片', async () => {
    if (!testCardId) {
      log('删除卡片', false, '没有测试卡片ID');
      return;
    }
    const { status, data } = await request(`/api/cards/${testCardId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log('删除卡片', status === 200 && data.ok === true, `status: ${status}`);
  });

  await test('POST /api/auth/logout - 登出', async () => {
    const { status, data } = await request('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log('用户登出', status === 200 && data.ok === true, `status: ${status}`);
  });

  // ---------- 结果汇总 ----------
  console.log('\n========================================');
  console.log('    测试结果汇总');
  console.log('========================================');
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📊 总计: ${passed + failed}`);
  console.log(`📈 成功率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('========================================\n');

  if (failed > 0) {
    console.log('失败的测试:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.detail}`);
    });
  }
}

runTests().catch(console.error);
