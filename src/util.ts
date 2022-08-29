// eslint-disable-next-line @typescript-eslint/ban-types
export const debounce = (callback: Function, wait: number) => {
  let timeoutId: number|undefined;
  return (...args: any[]) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      // eslint-disable-next-line prefer-spread
      callback.apply(null, args);
    }, wait);
  };
};
