/**
 * Minimal regression test for AutoLableServer.
 */

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8787';

let passed = 0;
let failed = 0;

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  });

  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  return { status: response.status, data };
}

function record(name, success, detail = '') {
  const prefix = success ? 'PASS' : 'FAIL';
  console.log(`${prefix} ${name}${detail ? ` - ${detail}` : ''}`);

  if (success) {
    passed += 1;
  } else {
    failed += 1;
  }
}

function assert(name, condition, detail = '') {
  record(name, Boolean(condition), detail);
}

async function main() {
  const username = `api_test_${Date.now()}`;
  const password = 'pass1234';

  const health = await request('/api/health');
  assert('health', health.status === 200 && health.data.ok === true, `status=${health.status}`);

  const spoofedSession = await request('/api/auth/session', {
    headers: { 'x-user-id': 'u-1' }
  });
  assert(
    'x-user-id rejected',
    spoofedSession.status === 200 && spoofedSession.data.user === null,
    `status=${spoofedSession.status}`
  );

  const register = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  assert('register', register.status === 200 && register.data.ok === true, `status=${register.status}`);

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  const token = login.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };
  assert('login', login.status === 200 && Boolean(token), `status=${login.status}`);

  const session = await request('/api/auth/session', { headers: authHeaders });
  assert(
    'session sanitized',
    session.status === 200 &&
      session.data.user &&
      !('passwordHash' in session.data.user) &&
      !('salt' in session.data.user),
    `status=${session.status}`
  );

  const collectionsUnauthorized = await request('/api/collections');
  assert('collections require auth', collectionsUnauthorized.status === 401, `status=${collectionsUnauthorized.status}`);

  const collectionsMine = await request('/api/collections', { headers: authHeaders });
  const defaultCollectionId = collectionsMine.data.items?.[0]?.id;
  assert(
    'collections mine',
    collectionsMine.status === 200 && Array.isArray(collectionsMine.data.items),
    `status=${collectionsMine.status}`
  );

  const privateCollectionAnonymous = await request(`/api/collections/${defaultCollectionId}`);
  assert(
    'private collection protected',
    privateCollectionAnonymous.status === 403,
    `status=${privateCollectionAnonymous.status}`
  );

  const createCard = await request('/api/cards', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Regression Card',
      bvid: 'BV1GJ411x7h7',
      aid: 1,
      cid: 2,
      start: 0,
      end: 15,
      tags: ['regression'],
      clipTags: ['clip']
    })
  });

  const cardId = createCard.data.item?.id;
  assert('create card', createCard.status === 200 && Boolean(cardId), `status=${createCard.status}`);

  const updateCardRange = await request(`/api/cards/${cardId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      start: 3.25,
      end: 12.75,
      searchTags: ['regression', 'updated'],
      clipTags: ['clip', 'range']
    })
  });
  assert(
    'update card range',
    updateCardRange.status === 200 &&
      updateCardRange.data.item?.start === 3.25 &&
      updateCardRange.data.item?.end === 12.75,
    `status=${updateCardRange.status}`
  );

  const cardsAfterRangeUpdate = await request('/api/cards', { headers: authHeaders });
  const updatedCard = cardsAfterRangeUpdate.data.items?.find((item) => item.id === cardId);
  assert(
    'updated range persisted',
    cardsAfterRangeUpdate.status === 200 &&
      updatedCard?.start === 3.25 &&
      updatedCard?.end === 12.75,
    `status=${cardsAfterRangeUpdate.status}`
  );

  const publishCard = await request(`/api/cards/${cardId}/publish`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      categoryId: 'kpop',
      searchTags: ['regression', 'deploy'],
      clipTags: ['clip']
    })
  });
  assert('publish card', publishCard.status === 200 && publishCard.data.item?.visibility === 'public', `status=${publishCard.status}`);

  const publicCards = await request('/api/cards/public');
  assert(
    'public cards visible',
    publicCards.status === 200 && publicCards.data.items?.some((item) => item.id === cardId),
    `status=${publicCards.status}`
  );

  const likeCard = await request(`/api/cards/${cardId}/like`, {
    method: 'POST',
    headers: authHeaders
  });
  assert('like card', likeCard.status === 200 && likeCard.data.isLiked === true, `status=${likeCard.status}`);

  const favoriteCard = await request(`/api/card-favorites/${cardId}`, {
    method: 'POST',
    headers: authHeaders
  });
  assert(
    'favorite card',
    favoriteCard.status === 200 && favoriteCard.data.isFavorite === true,
    `status=${favoriteCard.status}`
  );

  const likedCards = await request('/api/my/liked-cards', { headers: authHeaders });
  assert(
    'liked cards list',
    likedCards.status === 200 && likedCards.data.items?.some((item) => item.id === cardId),
    `status=${likedCards.status}`
  );

  const favoriteCards = await request('/api/my/card-favorites', { headers: authHeaders });
  assert(
    'favorite cards list',
    favoriteCards.status === 200 && favoriteCards.data.items?.some((item) => item.id === cardId),
    `status=${favoriteCards.status}`
  );

  const categoryCards = await request('/api/categories/kpop/cards');
  assert(
    'category cards',
    categoryCards.status === 200 && categoryCards.data.items?.some((item) => item.id === cardId),
    `status=${categoryCards.status}`
  );

  const deleteCard = await request(`/api/cards/${cardId}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert('delete card', deleteCard.status === 200, `status=${deleteCard.status}`);

  const logout = await request('/api/auth/logout', {
    method: 'POST',
    headers: authHeaders
  });
  assert('logout', logout.status === 200 && logout.data.ok === true, `status=${logout.status}`);

  console.log(`\nPassed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
