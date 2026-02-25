/**
 * 数据访问层入口
 * 提供统一的数据访问接口
 */

import { loadData, saveData, initDataStorage } from './storage.js';
import {
  loadSessions,
  saveSessions,
  cleanupSessions,
  createSession,
  deleteSession,
  getSession
} from './session.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 初始化数据存储
const { dataPath, sessionPath } = initDataStorage(__dirname);

// 加载数据
let state = loadData(dataPath);
let sessions = loadSessions(sessionPath);

/**
 * 数据访问API
 */
export const dataAPI = {
  // State访问
  getState: () => state,
  setState: (newState) => { state = newState; },
  saveState: () => saveData(state, dataPath),

  // Sessions访问
  getSessions: () => sessions,
  saveSessions: () => saveSessions(sessions, sessionPath),
  cleanupSessions: () => { sessions = cleanupSessions(sessions, sessionPath); },
  createSession: (userId) => createSession(sessions, userId, sessionPath),
  deleteSession: (token) => deleteSession(sessions, token, sessionPath),
  getSession: (token) => getSession(sessions, token),

  // 用户操作
  getUsers: () => state.users,
  findUser: (predicate) => state.users.find(predicate),
  addUser: (user) => {
    state.users.unshift(user);
    saveData(state, dataPath);
  },

  // 标签操作
  getTags: () => state.tags,
  findTag: (predicate) => state.tags.find(predicate),
  addTag: (tag) => {
    state.tags.unshift(tag);
    saveData(state, dataPath);
  },
  updateTag: (predicate, updates) => {
    const tag = state.tags.find(predicate);
    if (tag) {
      Object.assign(tag, updates);
      saveData(state, dataPath);
    }
    return tag;
  },

  // 收藏操作(标签收藏)
  getFavorites: (userId) => state.favorites[userId] || [],
  setFavorites: (userId, favorites) => {
    state.favorites[userId] = favorites;
    saveData(state, dataPath);
  },
  toggleFavorite: (userId, tagId) => {
    const favorites = state.favorites[userId] || [];
    const index = favorites.indexOf(tagId);

    if (index >= 0) {
      favorites.splice(index, 1);
      state.favorites[userId] = favorites;
      saveData(state, dataPath);
      return { isFavorite: false, favorites };
    }

    favorites.push(tagId);
    state.favorites[userId] = favorites;
    saveData(state, dataPath);
    return { isFavorite: true, favorites };
  },

  // 卡片操作
  getCards: () => state.cards,
  findCard: (predicate) => state.cards.find(predicate),
  filterCards: (predicate) => state.cards.filter(predicate),
  addCard: (card) => {
    state.cards.unshift(card);
    state.cardIdCounter++;
    saveData(state, dataPath);
  },
  updateCard: (predicate, updates) => {
    const card = state.cards.find(predicate);
    if (card) {
      Object.assign(card, updates);
      saveData(state, dataPath);
    }
    return card;
  },
  deleteCard: (predicate) => {
    const index = state.cards.findIndex(predicate);
    if (index >= 0) {
      state.cards.splice(index, 1);
      saveData(state, dataPath);
      return true;
    }
    return false;
  },
  getCardIdCounter: () => state.cardIdCounter,

  // 卡片收藏操作
  getCardFavorites: (userId) => state.cardFavorites?.[userId] || [],
  toggleCardFavorite: (userId, cardId) => {
    if (!state.cardFavorites) {
      state.cardFavorites = {};
    }
    if (!state.cardFavorites[userId]) {
      state.cardFavorites[userId] = [];
    }

    const favorites = state.cardFavorites[userId];
    const index = favorites.indexOf(cardId);

    if (index >= 0) {
      favorites.splice(index, 1);
      saveData(state, dataPath);
      return { isFavorite: false };
    }

    favorites.push(cardId);
    saveData(state, dataPath);
    return { isFavorite: true };
  },

  // 卡片点赞操作
  getCardLikes: (userId) => state.cardLikes?.[userId] || [],
  toggleCardLike: (userId, cardId) => {
    if (!state.cardLikes) {
      state.cardLikes = {};
    }
    if (!state.cardLikes[userId]) {
      state.cardLikes[userId] = [];
    }

    const likes = state.cardLikes[userId];
    const index = likes.indexOf(cardId);

    if (index >= 0) {
      likes.splice(index, 1);
      saveData(state, dataPath);
      return { isLiked: false };
    }

    likes.push(cardId);
    saveData(state, dataPath);
    return { isLiked: true };
  },

  // 收藏夹操作
  getCollections: () => state.collections,
  findCollection: (predicate) => state.collections.find(predicate),
  filterCollections: (predicate) => state.collections.filter(predicate),
  addCollection: (collection) => {
    state.collections.push(collection);
    saveData(state, dataPath);
  },
  updateCollection: (predicate, updates) => {
    const collection = state.collections.find(predicate);
    if (collection) {
      Object.assign(collection, updates);
      saveData(state, dataPath);
    }
    return collection;
  },
  deleteCollection: (predicate) => {
    const index = state.collections.findIndex(predicate);
    if (index >= 0) {
      state.collections.splice(index, 1);
      saveData(state, dataPath);
      return true;
    }
    return false;
  },

  // 发布卡片操作 (独立于用户卡片)
  getPublishedCards: () => state.publishedCards || [],
  findPublishedCard: (predicate) => (state.publishedCards || []).find(predicate),
  filterPublishedCards: (predicate) => (state.publishedCards || []).filter(predicate),
  addPublishedCard: (card) => {
    if (!state.publishedCards) {
      state.publishedCards = [];
    }
    state.publishedCards.unshift(card);
    state.publishedCardIdCounter = (state.publishedCardIdCounter || 0) + 1;
    saveData(state, dataPath);
  },
  updatePublishedCard: (predicate, updates) => {
    if (!state.publishedCards) return null;
    const card = state.publishedCards.find(predicate);
    if (card) {
      Object.assign(card, updates);
      saveData(state, dataPath);
    }
    return card;
  },
  deletePublishedCard: (predicate) => {
    if (!state.publishedCards) return false;
    const index = state.publishedCards.findIndex(predicate);
    if (index >= 0) {
      state.publishedCards.splice(index, 1);
      saveData(state, dataPath);
      return true;
    }
    return false;
  },
  getPublishedCardIdCounter: () => state.publishedCardIdCounter || 0
};

export default dataAPI;
