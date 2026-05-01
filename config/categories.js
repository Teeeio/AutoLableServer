export const DEFAULT_CATEGORIES = [
  { id: 'lovelive', name: 'LoveLive', description: 'LoveLive 相关舞台与剪辑' },
  { id: 'project-sekai', name: '世界计划', description: '世界计划相关舞台与剪辑' },
  { id: 'kpop', name: 'KPOP', description: 'KPOP 相关舞台与剪辑' },
  { id: 'ensemble-stars', name: '偶像梦幻祭', description: '偶像梦幻祭相关舞台与剪辑' },
  { id: 'general-otaku', name: '普宅', description: '通用二次元宅向内容' }
];

export function normalizeCategoryId(categoryId) {
  return String(categoryId || '').trim();
}
