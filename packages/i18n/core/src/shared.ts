// // meaning | description @ customID
export function getTranslatableContent(value: string) {
  const meaningSeparator = value.indexOf('|');
  const customIdSeparator = value.indexOf('@@');
  if (customIdSeparator === -1) {
    return {
      meaning: '',
      description: '',
      id: '',
    };
  } else {
    return {
      meaning:
        meaningSeparator <= -1
          ? value.slice(0, customIdSeparator).trim()
          : value.slice(0, meaningSeparator).trim(),
      description:
        meaningSeparator > -1
          ? value.slice(meaningSeparator + 1, customIdSeparator).trim()
          : '',
      id: value.slice(customIdSeparator + 3).trim(),
    };
  }
}

export function getMessageById(id: string, config) {
  if (config.messages && Object.keys(config.messages).length > 0) {
    const message = config.messages[config.current][id];
    return message ? message : 'Not found';
  }
  return 'Not found';
}

export function isUserOldEnough(user) {
  return user.age >= 18;
}
