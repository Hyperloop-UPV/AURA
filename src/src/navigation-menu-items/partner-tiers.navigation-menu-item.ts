import { defineNavigationMenuItem, NavigationMenuItemType } from 'twenty-sdk/define';
import { PARTNER_TIER_UNIVERSAL_IDENTIFIER } from '../objects/partner-tier.object';

export default defineNavigationMenuItem({
  universalIdentifier: '36e443e1-7dad-4e8f-a385-a1ff47ec65be',
  name: 'Partner Tiers',
  icon: 'IconAward',
  color: 'yellow',
  position: 90,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: PARTNER_TIER_UNIVERSAL_IDENTIFIER,
});
