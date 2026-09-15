import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const COMPANY_SECTOR_FIELD_UNIVERSAL_IDENTIFIER =
  'd54dd493-df91-476d-9461-47022a1589ee';

export default defineField({
  universalIdentifier: COMPANY_SECTOR_FIELD_UNIVERSAL_IDENTIFIER,

  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,

  type: FieldType.SELECT,

  name: 'sector',
  label: 'Sector',

  description:
    'Sector principal de actividad de la organización.',
  icon: 'IconCategory',
  options: [
    {
      value: 'ELECTROMAGNETICS',
      label: 'Electromagnetics',
      position: 0,
      color: 'blue',
    },
    {
      value: 'ELECTRONICA',
      label: 'Electrónica',
      position: 1,
      color: 'purple',
    },
    {
      value: 'EMPRESAS_LOCALES',
      label: 'Empresas Locales',
      position: 2,
      color: 'green',
    },
    {
      value: 'EQUIPACIONES',
      label: 'Equipaciones',
      position: 3,
      color: 'orange',
    },
    {
      value: 'MERCHANDISING',
      label: 'Merchandising',
      position: 4,
      color: 'pink',
    },
    {
      value: 'MATERIALES',
      label: 'Materiales',
      position: 5,
      color: 'yellow',
    },
    {
      value: 'LIQUIDO',
      label: 'Líquido',
      position: 6,
      color: 'cyan',
    },
    {
      value: 'INFORMATICA',
      label: 'Informática',
      position: 7,
      color: 'blue',
    },
    {
      value: 'LOGISTICA',
      label: 'Logística',
      position: 8,
      color: 'gray',
    },
    {
      value: 'MECANIZADOS',
      label: 'Mecanizados',
      position: 9,
      color: 'orange',
    },
    {
      value: 'IMPRESION_3D',
      label: 'Impresión 3D',
      position: 10,
      color: 'purple',
    },
    {
      value: 'MISCELANEA',
      label: 'Miscelánea',
      position: 11,
      color: 'gray',
    },
  ],
});
