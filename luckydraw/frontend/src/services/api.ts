/* Transitional facade: domain APIs now live with their features. */
export { authApi } from '@/features/session/api';
export { profileApi } from '@/features/profiles/api';
export { danmakuApi, roomApi } from '@/features/rooms/api';
export { lotteryApi } from '@/features/lottery/api';
export { clipboardApi, historyApi } from '@/features/settings/api';
