import { HTML_LATIN_ENTITIES } from './latinEntities';
import { HTML_LATIN_EXTENDED_ENTITIES } from './latinExtendedEntities';
import { HTML_SYMBOL_ENTITIES } from './symbolEntities';

export const HTML_NAMED_ENTITIES: Record<string, string> = {
  ...HTML_LATIN_ENTITIES,
  ...HTML_LATIN_EXTENDED_ENTITIES,
  ...HTML_SYMBOL_ENTITIES,
};
