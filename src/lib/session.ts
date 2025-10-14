const SESSION_COOKIE_KEY = 'scrum_poker_session';
const ROOM_COOKIE_KEY = 'scrum_poker_room';

export function generateSessionToken(): string {
  return crypto.randomUUID();
}

export function saveSession(sessionToken: string, roomId: string) {
  document.cookie = `${SESSION_COOKIE_KEY}=${sessionToken}; path=/; max-age=${60 * 60 * 24 * 7}`;
  document.cookie = `${ROOM_COOKIE_KEY}=${roomId}; path=/; max-age=${60 * 60 * 24 * 7}`;
}

export function getSessionToken(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === SESSION_COOKIE_KEY) {
      return value;
    }
  }
  return null;
}

export function getRoomId(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === ROOM_COOKIE_KEY) {
      return value;
    }
  }
  return null;
}

export function clearSession() {
  document.cookie = `${SESSION_COOKIE_KEY}=; path=/; max-age=0`;
  document.cookie = `${ROOM_COOKIE_KEY}=; path=/; max-age=0`;
}

export function convertPointsToTime(points: number): { hours: number; minutes: number } {
  const totalMinutes = points * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
}

export function formatTimeEstimation(points: number): string {
  const { hours, minutes } = convertPointsToTime(points);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}
