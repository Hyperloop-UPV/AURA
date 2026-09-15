import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const COMPANY_SPECIALTY_FIELD_UNIVERSAL_IDENTIFIER =
  '8cf64d40-4040-4b0c-a0ab-97236309a096';

export default defineField({
  universalIdentifier: COMPANY_SPECIALTY_FIELD_UNIVERSAL_IDENTIFIER,

  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,

  type: FieldType.TEXT,

  name: 'specialty',
  label: 'Especialidad',
  icon: 'IconTools',
  description:
    'Especialidad o ámbito técnico principal de la organización.',
});
