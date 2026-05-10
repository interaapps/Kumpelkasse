import { DebtEvent, Group, Member } from '@/types/debt';

export const currentUserId = 'julian';

export const mockGroups: Group[] = [
  { id: 'friends', name: 'Freundesgruppe 1' },
  { id: 'wg', name: 'WG' },
  { id: 'poker', name: 'Pokerabend' },
  { id: 'spain', name: 'Urlaub Spanien' },
];

export const mockMembers: Member[] = [
  {
    id: 'julian',
    name: 'Julian',
    initials: 'J',
    paypalUrl: 'paypal.me/julian',
    cashAppTag: '$julian',
    revolutHandle: '@julian',
    wiseUrl: 'wise.com/pay/me/julian',
    applePayContact: '+49 151 12345678',
    bankDetails: 'DE89 3704 0044 0532 0130 00',
    note: 'Am liebsten Paypal oder Uberweisung.',
  },
  { id: 'matti', name: 'Matti', initials: 'M', paypalUrl: 'paypal.me/matti', revolutHandle: '@matti' },
  { id: 'max', name: 'Max', initials: 'M', cashAppTag: '$max', venmoHandle: '@max' },
  { id: 'tim', name: 'Tim', initials: 'T' },
  {
    id: 'alex',
    name: 'Alex',
    initials: 'A',
    paypalUrl: 'paypal.me/alex',
    wiseUrl: 'wise.com/pay/me/alex',
    bankDetails: 'DE12 1002 0500 0000 1234 56',
  },
  { id: 'jonas', name: 'Jonas', initials: 'J' },
];

export const mockEvents: DebtEvent[] = [
  {
    id: 'event-poker-1',
    groupId: 'friends',
    type: 'game',
    title: 'Pokerabend',
    description: 'Julian +20€, Tim -20€',
    createdAt: '2026-05-09T22:15:00.000Z',
    lines: [
      { memberId: 'julian', amountCents: 2000 },
      { memberId: 'tim', amountCents: -2000 },
      { memberId: 'matti', amountCents: -1000 },
      { memberId: 'jonas', amountCents: 1000 },
    ],
  },
  {
    id: 'event-food-1',
    groupId: 'friends',
    type: 'split',
    title: 'Burgerme Bestellung',
    description: 'Max hat bezahlt · 4 Teilnehmer',
    createdAt: '2026-05-09T19:40:00.000Z',
    lines: [
      { memberId: 'max', amountCents: 5400 },
      { memberId: 'julian', amountCents: -1800 },
      { memberId: 'matti', amountCents: -1800 },
      { memberId: 'tim', amountCents: -1800 },
    ],
  },
  {
    id: 'event-direct-1',
    groupId: 'friends',
    type: 'direct',
    title: 'Matti schuldet dir',
    description: 'Direkte Schuld',
    createdAt: '2026-05-08T16:20:00.000Z',
    lines: [
      { memberId: 'julian', amountCents: 3200 },
      { memberId: 'matti', amountCents: -3200 },
    ],
  },
  {
    id: 'event-small-1',
    groupId: 'friends',
    type: 'payment',
    title: 'Kleine Zahlung',
    description: 'Alex bekommt Geld fur Snacks',
    createdAt: '2026-05-07T12:05:00.000Z',
    lines: [
      { memberId: 'alex', amountCents: 2200 },
      { memberId: 'julian', amountCents: -2200 },
    ],
  },
  {
    id: 'event-wg-1',
    groupId: 'wg',
    type: 'split',
    title: 'Wocheneinkauf',
    description: 'Julian hat bezahlt · WG Split',
    createdAt: '2026-05-06T18:10:00.000Z',
    lines: [
      { memberId: 'julian', amountCents: 4500 },
      { memberId: 'max', amountCents: -2250 },
      { memberId: 'alex', amountCents: -2250 },
    ],
  },
  {
    id: 'event-poker-group-1',
    groupId: 'poker',
    type: 'game',
    title: 'Cash Game',
    description: 'Tim +80€, Jonas -80€',
    createdAt: '2026-05-05T23:30:00.000Z',
    lines: [
      { memberId: 'tim', amountCents: 8000 },
      { memberId: 'jonas', amountCents: -8000 },
    ],
  },
  {
    id: 'event-spain-1',
    groupId: 'spain',
    type: 'split',
    title: 'Tapas Abend',
    description: 'Jonas hat bezahlt · 5 Teilnehmer',
    createdAt: '2026-05-04T21:00:00.000Z',
    lines: [
      { memberId: 'jonas', amountCents: 12400 },
      { memberId: 'julian', amountCents: -3100 },
      { memberId: 'matti', amountCents: -3100 },
      { memberId: 'tim', amountCents: -3100 },
      { memberId: 'alex', amountCents: -3100 },
    ],
  },
];
