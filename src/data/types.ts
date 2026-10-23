export type Fuel = 'Diesel' | 'Petrol' | 'Electric' | 'CNG'

export interface ModelColor {
  name: string
  hex: string
  src: string
}

export interface Variant {
  name: string
  fuel: string
  transmission: string
  /** Engine displacement ("2184 CC") or battery capacity ("59 kWh") as listed. */
  spec: string
  /** Ex-showroom Ahmedabad, ₹ lakh */
  price: number
}

export interface Model {
  slug: string
  name: string
  fullName: string
  category: 'suv' | 'esuv'
  priceFrom: number
  priceTo: number
  fuels: string[]
  transmissions: string[]
  specs: { label: string; value: string; unit: string }[]
  image: string
  imageSm: string
  lqip: string
  colors: ModelColor[]
  variants: Variant[]
  sourceUrl: string
}

export interface CommercialVehicle {
  slug: string
  name: string
  priceFrom: number
  type: 'Mini Truck' | 'Pick-Up'
  image: string
  lqip: string
  sourceUrl: string
}

export interface Testimonial {
  author: string
  text: string
  rating: number
  context: string
}

export interface Outlet {
  id: string
  kind: 'showroom' | 'workshop'
  name: string
  area: string
  city: 'Ahmedabad' | 'Sanand' | 'Surendranagar'
  address: string
  pin: string
  phones: string[]
  email?: string
  /** Opening hours, Monday first. null = not listed on the source site. */
  hours: { days: string; time: string }[]
  lat: number
  lng: number
  photo?: string
}
