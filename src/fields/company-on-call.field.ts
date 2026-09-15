import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { CALL_UNIVERSAL_IDENTIFIER } from '../objects/call.object';

export const COMPANY_ON_CALL_FIELD_UNIVERSAL_IDENTIFIER =
  'e6491e22-a0e4-4ad7-b271-6c75a53c2b06';

export const CALLS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER =
  '7fdd6802-38e8-4ba9-ba32-2a446f071ab4';

export default defineField({
  universalIdentifier: COMPANY_ON_CALL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CALL_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'company',
  label: 'Empresa',
  description: 'Empresa relacionada con la llamada o interacción.',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    CALLS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
  isNullable: true,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'companyId',
  },
});
