import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const COMPANY_IS_UPV_FIELD_UNIVERSAL_IDENTIFIER =
  '89088f89-ba62-49a0-9aae-0ffb521c54c4';

export default defineField({
  universalIdentifier: COMPANY_IS_UPV_FIELD_UNIVERSAL_IDENTIFIER,

  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,

  type: FieldType.BOOLEAN,

  name: 'isUpv',
  label: 'UPV',

  description:
    'Indica si la organización pertenece o está vinculada a la UPV.',
  icon: 'IconBuildingCommunity',
  defaultValue: false,
});
