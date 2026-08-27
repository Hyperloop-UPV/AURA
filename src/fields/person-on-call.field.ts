import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { CALL_UNIVERSAL_IDENTIFIER } from '../objects/call.object';

export const PERSON_ON_CALL_FIELD_UNIVERSAL_IDENTIFIER =
  'de413062-ff3a-42bd-a6b3-241f69f7203b';

export const CALLS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER =
  '26ecd011-b4e2-48d4-9948-63e6696d8550';

export default defineField({
  universalIdentifier: PERSON_ON_CALL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CALL_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'person',
  label: 'Contacto',
  description: 'Persona con la que se realizó la llamada o interacción.',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    CALLS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  isNullable: true,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'personId',
  },
});
