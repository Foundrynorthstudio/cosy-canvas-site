import { DEPOT } from './depot';

export const COMPANY = {
  tradingName: 'The Cosy Canvas Co.',
  legalName: 'The Cosy Canvas Company',
  email: 'hello@cosycanvasco.com',
  phone: '+44 7377 987126',
  website: 'https://cosycanvasco.com',
  websiteLabel: 'cosycanvasco.com',
  base: `${DEPOT.label}, ${DEPOT.region}, ${DEPOT.country}`,
  hours: DEPOT.hoursShort,
  registered: 'Registered in Scotland',
} as const;
