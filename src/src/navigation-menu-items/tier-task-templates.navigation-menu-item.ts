import { defineNavigationMenuItem, NavigationMenuItemType } from 'twenty-sdk/define';
import { PARTNER_TIER_TASK_TEMPLATE_UNIVERSAL_IDENTIFIER } from '../objects/partner-tier-task-template.object';

export default defineNavigationMenuItem({
  universalIdentifier: '3e87c620-e43f-46da-8e23-43f269929f73',
  name: 'Tier Task Templates',
  icon: 'IconChecklist',
  color: 'blue',
  position: 91,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: PARTNER_TIER_TASK_TEMPLATE_UNIVERSAL_IDENTIFIER,
});
