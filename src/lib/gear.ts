export interface GearUsedIn {
  slug: string;
  title: string;
}

export interface GearItem {
  id: string;
  name: string;
  maker: string;
  category: string;
  why: string;
  href: string;
  image: string;
  imageAlt: string;
  usedIn: GearUsedIn[];
}

export const GEAR_ITEMS: GearItem[] = [
  {
    id: 'decathlon-2-seconds-easy-fresh-black',
    name: '2 Seconds Easy Fresh & Black 2-person tent',
    maker: 'Decathlon',
    category: 'Sleep',
    why: 'Up in two minutes. The recce tent for nights when a 4M is too much site — Glen Coe, a picnic bench, and a stove.',
    href: 'https://www.decathlon.co.uk/p/instant-2-person-camping-tent-2-seconds-easy-fresh-and-black/308355/c227c98c340m8553541',
    image: '/glencoe-red-squirrel/tent-and-stove.jpg',
    imageAlt: 'Decathlon two-man pop-up tent with the door open and a stove burning',
    usedIn: [
      {
        slug: 'red-squirrel-campsite-glencoe',
        title: 'Field notes from Red Squirrel',
      },
    ],
  },
];
