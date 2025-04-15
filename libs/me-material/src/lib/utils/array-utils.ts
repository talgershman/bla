import _every from 'lodash-es/every';

export const isArrayEmptyValues = (arr: string[]): boolean => {
  return _every(arr, (item) => {
    const value = item.trim ? item.trim() : item;
    if (!value) {
      return true;
    }
    return false;
  });
};

export const copyArrayObject = (arr: Array<any>): Array<any> => {
  if (!arr) {
    return arr;
  }
  return arr.map((item) => ({...item}));
};
