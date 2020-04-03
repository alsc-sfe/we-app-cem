export class TimeoutError extends Error {
}
TimeoutError.prototype.name = 'TimeoutError';

export default function timeout(p, duration, message) {
  const t = new Promise((r, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(message));
    }, duration);
  });
  return Promise.race([p, t]);
}
