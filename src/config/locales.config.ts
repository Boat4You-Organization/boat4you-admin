import { LANGUAGE_LABEL_MAP, Language } from '@/models/user.model';

export type Locale = {
  id: Language;
  label: string;
};

const locales: Locale[] = [
  { id: Language.ENGLISH, label: LANGUAGE_LABEL_MAP[Language.ENGLISH] },
  { id: Language.CROATIAN, label: LANGUAGE_LABEL_MAP[Language.CROATIAN] },
];

export default locales;
