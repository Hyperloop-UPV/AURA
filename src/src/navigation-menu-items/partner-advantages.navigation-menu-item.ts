import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  PARTNER_ADVANTAGES_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from '../page-layouts/partner-advantages.page-layout';

export default defineNavigationMenuItem({
  universalIdentifier: '469d4675-326d-48db-96ff-e5a9dbcb0525',
  name: 'Ventajas Partners',
  icon: 'IconChecklist',
  color: 'blue',
  position: 40,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier:
    PARTNER_ADVANTAGES_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});
