import {
    defineField,
    FieldType,
    RelationType,
    OnDeleteAction,
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { SEASON_UNIVERSAL_IDENTIFIER } from '../objects/season.object';

import { SEASON_SPONSORSHIPS_FIELD_ID } from './sponsorships-on-season.field';

export const OPPORTUNITY_SEASON_FIELD_ID =
    '340b16d2-7d22-4e3c-b668-3e18035ad73a';

export default defineField({
    universalIdentifier: OPPORTUNITY_SEASON_FIELD_ID,

    objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,

    type: FieldType.RELATION,

    name: 'season',
    label: 'Season',
    icon: 'IconCalendar',

    isNullable: true,

    relationTargetObjectMetadataUniversalIdentifier:
        SEASON_UNIVERSAL_IDENTIFIER,

    relationTargetFieldMetadataUniversalIdentifier:
        SEASON_SPONSORSHIPS_FIELD_ID,

    universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.RESTRICT,
        joinColumnName: 'seasonId',
    },
});