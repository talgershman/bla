import {QueryFileSystemObject} from '../on-prem/on-prem.service';

export const getMockPaths = (): string[] => {
  return ['path1', 'temp/path2', 'path3'];
};

export const getMockResponsePaths = (
  rootPath: string,
  foundIndex = -1
): QueryFileSystemObject[] => {
  const arr: QueryFileSystemObject[] = [];
  const paths = getMockPaths();
  paths.forEach((path) => {
    arr.push({
      absolutePath: `/rootPath/${path}`,
      found: false,
      type: 'file',
    });
  });
  if (foundIndex !== -1) {
    arr[foundIndex].found = true;
  }
  return arr;
};
