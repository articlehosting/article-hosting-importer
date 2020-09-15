export const decodeJSONContent = <T>(content: string | Buffer): T => {
  const temp: string = content instanceof Buffer ? content.toString() : content;

  try {
    return <T>JSON.parse(temp);
  } catch (err) {
    return <T>{};
  }
};

export const objectIsEmpty = (obj: any): boolean => {
  // need to disable the eslint rule because ....
  // eslint-disable-next-line no-restricted-syntax
  for (const keyName in obj) {
    // eslint-disable-next-line no-prototype-builtins
    if (obj.hasOwnProperty(keyName)) {
      return false;
    }
  }

  return true;
};
