import { DEPOT } from './depot';

export const COMPANY = {
  tradingName: 'The Cosy Canvas Co.',
  legalName: 'The Cosy Canvas Company',
  email: 'hello@cosycanvasco.com',
  phone: '+44 7700 900123',
  website: 'https://cosycanvas.co.uk',
  websiteLabel: 'cosycanvas.co.uk',
  base: `${DEPOT.label}, ${DEPOT.region}, ${DEPOT.country}`,
  hours: DEPOT.hoursShort,
  registered: 'Registered in Scotland',
} as const;
