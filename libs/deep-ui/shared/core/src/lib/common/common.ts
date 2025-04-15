import _isArray from 'lodash-es/isArray';

export const serializeFormDataRequest = (entity: any): FormData => {
  const formData = new FormData();
  Object.keys(entity || {}).forEach((key) => {
    if (_isArray(entity[key])) {
      //todo add logic that will put 'null' to be handle in the BE to clear
      entity[key].forEach((value) => {
        formData.append(key, value);
      });
    } else {
      formData.append(key, entity[key]);
    }
  });
  return formData;
};
