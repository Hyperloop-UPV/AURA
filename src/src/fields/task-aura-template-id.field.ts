import { defineField, FieldType, STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: 'a59c3c69-e462-4893-96d9-5a3049b4c2bf',
  objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
  type: FieldType.TEXT,
  name: 'auraTaskTemplateId',
  label: 'AURA Task Template ID',
  description: 'Internal ID used to prevent duplicate generated tasks.',
  icon: 'IconFingerprint',
});
