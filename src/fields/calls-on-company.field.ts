import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { CALL_UNIVERSAL_IDENTIFIER } from '../objects/call.object';

import {
  CALLS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
  COMPANY_ON_CALL_FIELD_UNIVERSAL_IDENTIFIER,
} from './company-on-call.field';

export default defineField({
  universalIdentifier: CALLS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.RELATION,
  name: 'calls',
  label: 'Llamadas',
  description: 'Llamadas e interacciones relacionadas con esta empresa.',
  relationTargetObjectMetadataUniversalIdentifier:
    CALL_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    COMPANY_ON_CALL_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
