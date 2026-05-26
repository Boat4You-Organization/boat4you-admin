export const snakeCaseToSentenceCase = (word: string) => word.split('_').join(' ');

export const camelCaseToSentenceCase = (word: string) => word.replace(/([A-Z])/g, ' $1');

export const capitalise = (word: string) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
