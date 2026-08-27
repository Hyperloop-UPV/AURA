import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { CALL_UNIVERSAL_IDENTIFIER } from '../objects/call.object';

import {
  CALLS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_ON_CALL_FIELD_UNIVERSAL_IDENTIFIER,
} from './person-on-call.field';

export default defineField({
  universalIdentifier: CALLS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.RELATION,
  name: 'calls',
  label: 'Llamadas',
  description: 'Llamadas e interacciones relacionadas con este contacto.',
  relationTargetObjectMetadataUniversalIdentifier:
    CALL_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    PERSON_ON_CALL_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
