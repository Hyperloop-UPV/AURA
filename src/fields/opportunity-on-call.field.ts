import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { CALL_UNIVERSAL_IDENTIFIER } from '../objects/call.object';

export const OPPORTUNITY_ON_CALL_FIELD_UNIVERSAL_IDENTIFIER =
  '6e3b2301-3367-4351-a914-591ae3a99e7f';

export const CALLS_ON_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER =
  '870cf299-1b23-4af1-8b7e-8fa6bdda9d9d';

export default defineField({
  universalIdentifier: OPPORTUNITY_ON_CALL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CALL_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'opportunity',
  label: 'Oportunidad',
  description: 'Oportunidad relacionada con la llamada o interacción.',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    CALLS_ON_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER,
  isNullable: true,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'opportunityId',
  },
});
