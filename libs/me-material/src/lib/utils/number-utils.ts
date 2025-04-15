export const NAFormatter = (num: string): string => {
  return num ? num.toString() : `N/A`;
};

export const parseInteger = (num: string): number | null => {
  try {
    return Number.parseInt(num, 10);
    // eslint-disable-next-line
  } catch (e) {}
  return null;
};
