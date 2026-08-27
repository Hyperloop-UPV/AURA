import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const COMPANY_NIF_FIELD_UNIVERSAL_IDENTIFIER =
  'cdff2d0b-96f6-43bd-9da9-b2de19b4a52b';

export default defineField({
  universalIdentifier: COMPANY_NIF_FIELD_UNIVERSAL_IDENTIFIER,

  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,

  type: FieldType.TEXT,

  name: 'nif',
  label: 'NIF',
  icon: 'IconId',
  description:
    'Número de identificación fiscal de la organización.',
});
