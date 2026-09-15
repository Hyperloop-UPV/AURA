import { defineField, FieldType, STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: '248a2330-29c9-4239-8363-3d2c39f536c8',
  objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
  type: FieldType.BOOLEAN,
  name: 'auraPartnerTask',
  label: 'AURA Partner Task',
  description: 'Task generated from an AURA Partner Tier template.',
  icon: 'IconSparkles',
  defaultValue: false,
});
