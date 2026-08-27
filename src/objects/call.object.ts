import {
  defineObject,
  FieldType,
} from 'twenty-sdk/define';

export const CALL_UNIVERSAL_IDENTIFIER =
  '6b8ca70c-9517-47bd-a900-f11fb8525bc4';

export default defineObject({
  universalIdentifier: CALL_UNIVERSAL_IDENTIFIER,

  nameSingular: 'call',
  namePlural: 'calls',

  labelSingular: 'Llamada',
  labelPlural: 'Llamadas',

  icon: 'IconPhone',

  fields: [
    {
      universalIdentifier: 'fe86a73c-ec38-4874-8798-f7431b156d41',

      type: FieldType.TEXT,

      name: 'name',
      label: 'Nombre',

      description: 'Nombre o título de la interacción.',

      icon: 'IconPhone',
    },

    {
      universalIdentifier: '62809899-a6ce-4640-9009-96730a4763da',

      type: FieldType.DATE_TIME,

      name: 'calledAt',
      label: 'Fecha y hora',

      description: 'Fecha y hora en la que tuvo lugar la interacción.',

      icon: 'IconCalendarTime',
    },

    {
      universalIdentifier: 'a22cf587-c77e-4167-a06e-76879244656d',

      type: FieldType.SELECT,

      name: 'direction',
      label: 'Dirección',

      description: 'Indica si el contacto fue iniciado por AURA o por la organización.',

      icon: 'IconArrowsExchange',

      options: [
        {
          value: 'OUTGOING',
          label: 'Saliente',
          position: 0,
          color: 'blue',
        },
        {
          value: 'INCOMING',
          label: 'Entrante',
          position: 1,
          color: 'green',
        },
      ],
    },

    {
      universalIdentifier: '566d6018-189e-4144-812a-c24e3dd9535a',

      type: FieldType.SELECT,

      name: 'medium',
      label: 'Medio',

      description: 'Medio utilizado para realizar el contacto.',

      icon: 'IconDeviceMobile',

      options: [
        {
          value: 'PHONE',
          label: 'Teléfono',
          position: 0,
          color: 'blue',
        },
        {
          value: 'WHATSAPP',
          label: 'WhatsApp',
          position: 1,
          color: 'green',
        },
        {
          value: 'GOOGLE_MEET',
          label: 'Google Meet',
          position: 2,
          color: 'purple',
        },
        {
          value: 'MICROSOFT_TEAMS',
          label: 'Microsoft Teams',
          position: 3,
          color: 'blue',
        },
        {
          value: 'ZOOM',
          label: 'Zoom',
          position: 4,
          color: 'cyan',
        },
        {
          value: 'IN_PERSON',
          label: 'Presencial',
          position: 5,
          color: 'orange',
        },
        {
          value: 'OTHER',
          label: 'Otro',
          position: 6,
          color: 'gray',
        },
      ],
    },

    {
      universalIdentifier: 'ed07b419-6d79-4811-99e1-b43fa942716c',

      type: FieldType.SELECT,

      name: 'outcome',
      label: 'Resultado',

      description: 'Resultado del intento de contacto.',

      icon: 'IconPhoneCheck',

      options: [
        {
          value: 'CONTACTED',
          label: 'Contactado',
          position: 0,
          color: 'green',
        },
        {
          value: 'NO_ANSWER',
          label: 'Sin respuesta',
          position: 1,
          color: 'orange',
        },
        {
          value: 'VOICEMAIL',
          label: 'Buzón de voz',
          position: 2,
          color: 'yellow',
        },
        {
          value: 'BUSY',
          label: 'Ocupado',
          position: 3,
          color: 'red',
        },
        {
          value: 'OTHER',
          label: 'Otro',
          position: 4,
          color: 'gray',
        },
      ],
    },
  ],
});
