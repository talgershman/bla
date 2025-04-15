export const b64EncodeUnicode = (str: string): string => {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match: string, p1: string) =>
      String.fromCharCode(Number(`0x${p1}`))
    )
  );
};

export const b64DecodeUnicode = (str: string): string => {
  return decodeURIComponent(
    atob(str)
      .split('')
      .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join('')
  );
};

export const padArr = (arr: string[], value: string, maxArrLength: number): string[] => {
  if (arr && arr.length > maxArrLength) {
    return arr;
  }
  const newArr = [...(arr || [])];
  let writeIndex = maxArrLength - newArr.length;
  while (writeIndex > 0) {
    newArr.push(value);
    writeIndex -= 1;
  }
  return newArr;
};

export const removeSpaces = (value: string): string => {
  if (!value) {
    return '';
  }
  return value.replace(/\s+/g, ' ').trim();
};

export const isString = (value: any): boolean => {
  return typeof value === 'string' || value instanceof String;
};

export const capitalize = (value: string): string => {
  return value ? value.charAt(0).toUpperCase() + value.substring(1).toLowerCase() : '';
};
