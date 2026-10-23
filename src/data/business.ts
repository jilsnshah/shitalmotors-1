// Facts transcribed from shitalmotors.com (home, about-us, outlet, bookservice and gallery pages).
// Keep this file the single source of truth: the UI and the AI concierge both read from it.
import type { Outlet } from './types.ts'

export const BUSINESS = {
  name: 'Shital Motors',
  legalName: 'Shital Motors Pvt. Ltd.',
  role: 'Authorised Mahindra dealer',
  since: 2004,
  region: 'Gujarat',
  customersServed: '2 lakh+',
  facilities: '3S — sales, service and spares',
  values: ['customer focus', 'integrity', 'respect', 'teamwork', 'transparency'],
  phones: {
    sales: ['9375808050', '8448005430'],
    service: ['9099183000', '9099182000'],
    serviceBooking: '9099182000',
  },
  email: {
    customerCare: 'customercare@shitalmotors.com',
    serviceCrm: 'crm.shitalmotors@gmail.com',
  },
  workingHours: '10:00 AM to 7:00 PM',
  website: 'https://www.shitalmotors.com',
  social: {
    facebook: 'https://www.facebook.com/shitalmotors/',
    instagram: 'https://www.instagram.com/mahindra_shital_motors',
    twitter: 'https://twitter.com/ShitalMotorsMM',
  },
  ownerApps: {
    rsa: 'https://www.withyouhamesha.com/RSA.aspx',
    shield: 'https://www.withyouhamesha.com/shield.aspx',
  },
} as const

const everyDay = (time: string) => [{ days: 'Mon – Sun', time }]
const monSat = (time: string) => [{ days: 'Mon – Sat', time }]

export const OUTLETS: Outlet[] = [
  {
    id: 'ashram-road',
    kind: 'showroom',
    name: 'Ashram Road',
    area: 'Ashram Road',
    city: 'Ahmedabad',
    address: '4 – Swastik Complex, Opp. Bata Showroom, Nr. Ashramroad Police Chowki, Ashram Road, Ahmedabad',
    pin: '380009',
    phones: ['8448005430'],
    email: 'customercare@shitalmotors.com',
    hours: everyDay('10 AM – 7 PM'),
    lat: 23.0362659,
    lng: 72.5690763,
  },
  {
    id: 'chandkheda',
    kind: 'showroom',
    name: 'Chandkheda',
    area: 'Tapovan Circle, Nigamnagar',
    city: 'Ahmedabad',
    address: 'Shop No. 13 to 17, Ground Floor, Anikedhya Capitol, Nr. Tapovan Circle, Nigamnagar, Chandkheda, Ahmedabad',
    pin: '382424',
    phones: ['9978448050'],
    email: 'customercare@shitalmotors.com',
    hours: monSat('10 AM – 7 PM'),
    lat: 23.118364,
    lng: 72.612545,
  },
  {
    id: 'vishala',
    kind: 'showroom',
    name: 'Vishala',
    area: 'Vishala – Narol Road',
    city: 'Ahmedabad',
    address: 'Ground / 1st Floor, Rajyash Rise, Vishala – Narol Road, Near Vishala Restaurant, Vishala, Ahmedabad',
    pin: '380007',
    phones: ['8448005430'],
    email: 'customercare@shitalmotors.com',
    hours: everyDay('10 AM – 7 PM'),
    lat: 22.991921,
    lng: 72.5368198,
  },
  {
    id: 'sarkhej',
    kind: 'showroom',
    name: 'Sarkhej',
    area: 'Sanand Chokdi',
    city: 'Ahmedabad',
    address: '07 & 08 Eliya Estate, Near Crossway Hotel, Opp. Signature-2, Sanand Chokdi, Sarkhej, Ahmedabad',
    pin: '382210',
    phones: ['9375808050'],
    email: 'customercare@shitalmotors.com',
    hours: [
      { days: 'Mon – Sat', time: '10 AM – 7 PM' },
      { days: 'Sun', time: '9:30 AM – 5 PM' },
    ],
    lat: 22.9867349,
    lng: 72.4936181,
  },
  {
    id: 'sanand',
    kind: 'showroom',
    name: 'Sanand',
    area: 'Sanand Bypass Road',
    city: 'Sanand',
    address: 'Near Riddhi-Siddhi Bungalow, Near Sanand Bypass Road, Sanand',
    pin: '382110',
    phones: ['7574987070'],
    email: 'customercare@shitalmotors.com',
    hours: [
      { days: 'Mon – Sat', time: '10 AM – 7 PM' },
      { days: 'Sun', time: '11 AM – 4 PM' },
    ],
    lat: 22.986171,
    lng: 72.3951398,
  },
  {
    id: 'surendranagar-showroom',
    kind: 'showroom',
    name: 'Surendranagar',
    area: 'Wadhwan',
    city: 'Surendranagar',
    address: 'Plot No. 106, Near Sarvo Petrol Pump, Main Road, Opp. Marketing Yard, Wadhwan, Surendranagar',
    pin: '363030',
    phones: ['7572807070'],
    email: 'customercare@shitalmotors.com',
    hours: everyDay('10 AM – 7 PM'),
    lat: 22.7203885,
    lng: 71.6681764,
  },
  {
    id: 'bopal',
    kind: 'workshop',
    name: 'S.P. Ring Road, Bopal',
    area: 'Bopal',
    city: 'Ahmedabad',
    address: 'Opp. Mahammadpura Patia, 220 ft Sardar Patel Ring Road, Bopal, Ahmedabad',
    pin: '380054',
    phones: ['9099183000', '9099182000'],
    email: 'crm.shitalmotors@gmail.com',
    hours: monSat('9:30 AM – 7 PM'),
    lat: 23.0079495,
    lng: 72.4776451,
    photo: '/media/outlets/s-p-ring-road-bopal.webp',
  },
  {
    id: 'navapura',
    kind: 'workshop',
    name: 'Navapura',
    area: 'Changodar Highway',
    city: 'Ahmedabad',
    address: 'Opp. Pharmacy College, Changodar Highway, Near Shree Ramdev Temple, Navapura, Ahmedabad',
    pin: '382210',
    phones: ['9825311230'],
    email: 'crm.shitalmotors@gmail.com',
    hours: monSat('9:30 AM – 7 PM'),
    lat: 22.9497,
    lng: 72.4645,
    photo: '/media/outlets/changodar.webp',
  },
  {
    id: 'surendranagar-workshop',
    kind: 'workshop',
    name: 'Surendranagar',
    area: 'Wadhwan',
    city: 'Surendranagar',
    address: 'Nr. Sarva Petrol Pump, Main Road, Opp. Marketing Yard, Wadhwan, Surendranagar',
    pin: '363030',
    phones: ['9601329293'],
    email: 'crm.shitalmotors@gmail.com',
    hours: everyDay('9:30 AM – 7 PM'),
    lat: 22.719888,
    lng: 71.668607,
    photo: '/media/outlets/surendranagar.webp',
  },
  {
    id: 'chandkheda-workshop',
    kind: 'workshop',
    name: 'Chandkheda',
    area: 'Nr. Safayar Party Plot',
    city: 'Ahmedabad',
    address: 'Plot No. 11, T.P. 44, Opp. Sangath Pines, Chandkheda, Nr. Safayar Party Plot, Ahmedabad',
    pin: '382424',
    phones: ['9825009538'],
    email: 'gmservicechandkheda@gmail.com',
    hours: monSat('9:30 AM – 7 PM'),
    lat: 23.1122601,
    lng: 72.6028264,
  },
]

export const SERVICE_OFFERINGS = [
  {
    id: 'qwik',
    title: 'Qwik Service',
    stat: '90',
    statUnit: 'min',
    body: 'Scheduled service that feels like a pit stop. Done in only 90 minutes, for the lowest downtime.',
  },
  {
    id: 'mees',
    title: 'mEES',
    stat: 'mEES',
    statUnit: 'estimates',
    body: 'The Mahindra Electronic Estimation System scientifically prepares an accurate estimate for body repair.',
  },
  {
    id: 'msow',
    title: 'Service on Wheels',
    stat: 'mSoW',
    statUnit: 'at your door',
    body: 'Routine service, basic repair and dry wash at your doorstep, via customised two- and four-wheelers.',
  },
  {
    id: 'pickdrop',
    title: 'Pick n Drop',
    stat: '↔',
    statUnit: 'pick-up & drop',
    body: 'We collect and return your SUV, with regular status updates, online approvals and online payment.',
  },
  {
    id: 'rsa',
    title: 'Roadside Assistance',
    stat: '8',
    statUnit: 'years of cover',
    body: 'Stranded anywhere? A wide range of benefits for as long as 8 years of owning a Mahindra SUV.',
  },
  {
    id: 'maxicare',
    title: 'Maxicare',
    stat: '✦',
    statUnit: 'care range',
    body: 'A curated range of products and treatments to keep your SUV looking as good as new.',
  },
] as const

/** Only awards whose plaque text is legible in the dealer's own gallery photos. */
export const AWARDS = [
  { img: '/media/gallery/awards-1142.webp', title: 'JDP No. 1', detail: 'Mahindra Rise · Delight 2 Dominate', year: '2015' },
  { img: '/media/gallery/awards-1143.webp', title: 'Best Corporate Leasing & Direct Billing', detail: 'Mahindra', year: 'FY 15' },
  { img: '/media/gallery/awards-1147.webp', title: 'Best Performer in Accessories', detail: 'Mahindra', year: 'H1 FY 16' },
  { img: '/media/gallery/awards-1146.webp', title: 'Preferred Financier Partner', detail: 'Mahindra Finance appreciation', year: '' },
] as const

export const AWARD_NOTES = [
  'All India 2nd Best CSI — Ahmedabad AO',
  'Excellent performance, JDP CSI 2017',
]

/** Dealer-published YouTube films (thumbnails load from YouTube only when the section is near). */
export const FILMS = [
  { id: 'uS0WPxmNZ0o', title: 'Service centre walkaround' },
  { id: '_Q6T6bxsd2Q', title: 'Navratri 2022 special delivery' },
  { id: 'A4d3Wk0ukMM', title: 'Customer delight story' },
  { id: '_h5B9-AMg6A', title: 'Customer delight story' },
] as const

export const PHOTOS = {
  deliveries: [9002, 9003, 9004, 9005, 9006, 9007, 9008, 9009, 9011, 9012, 9013, 9016, 9017, 9019, 9022, 9026, 9027, 9028].map(
    (n) => `/media/gallery/delivering-happiness-${n}.webp`,
  ),
  showroom: [4922, 4923, 4925, 4926, 4927, 4929, 4932, 4933, 4934, 4936].map((n) => `/media/gallery/showroom-images-${n}.webp`),
  service: [9082, 9083, 9084, 9085, 9086, 9081].map((n) => `/media/gallery/service-center-${n}.webp`),
  facilities: ['/media/outlets/s-p-ring-road-bopal.webp', '/media/outlets/changodar.webp', '/media/outlets/surendranagar.webp'],
}

export const formatLakh = (n: number) => `₹${n.toFixed(2)} lakh`
export const telHref = (n: string) => `tel:+91${n.replace(/\D/g, '')}`
export const formatPhone = (n: string) => `${n.slice(0, 5)} ${n.slice(5)}`
