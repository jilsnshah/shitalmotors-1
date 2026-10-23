// Offline concierge: deterministic answers from the dealership data.
// Used when no Anthropic API key is configured, the API is unreachable, or the
// site is hosted statically. Every sentence is assembled from data — nothing invented.
import { BUSINESS, OUTLETS, SERVICE_OFFERINGS, formatPhone } from '../../data/business.ts'
import { MODELS, COMMERCIAL } from '../../data/models.generated.ts'
import type { Model, Outlet } from '../../data/types.ts'

const lakh = (n: number) => `₹${n.toFixed(2)} lakh`

const MODEL_ALIASES: [RegExp, string][] = [
  [/\bthar\s*roxx\b|\broxx\b/, 'thar-roxx'],
  [/\bxuv\s*3xo\s*ev\b|\b3xo\s*ev\b/, 'xuv-3xo-ev'],
  [/\bxuv\s*3xo\b|\b3xo\b/, 'xuv-3xo'],
  [/\bxuv\s*7xo\b|\b7xo\b/, 'xuv-7xo'],
  [/\bxuv\s*400\b|\bxuv400\b/, 'xuv400-ev'],
  [/\bxev\s*9e\b|\b9e\b/, 'xev-9e'],
  [/\bxev\s*9s\b|\b9s\b/, 'xev-9s'],
  [/\bbe\s*6\b|\bbe6\b|\bsporteq\b/, 'be-6-sporteq'],
  [/\bbolero\s*neo\s*(plus|\+)/, 'bolero-neo-plus'],
  [/\bbolero\s*neo\b/, 'bolero-neo'],
  [/\bscorpio\b/, 'scorpio'],
  [/\bthar(\s*og)?\b/, 'thar-og'],
  [/\bbolero\b(?!\s*(neo|pik|max|camper))/, 'bolero'],
]

const AREA_ALIASES: [RegExp, string[]][] = [
  [/\bashram/, ['ashram-road']],
  [/\bchandkheda|tapovan|nigamnagar|motera|sabarmati/, ['chandkheda', 'chandkheda-workshop']],
  [/\bvishala|narol|vasna|maninagar/, ['vishala']],
  [/\bsarkhej|sanand chokdi|makarba|prahlad/, ['sarkhej']],
  [/\bsanand\b/, ['sanand']],
  [/\bsurendranagar|wadhwan|wadhwan/, ['surendranagar-showroom', 'surendranagar-workshop']],
  [/\bbopal|ring road|s\.?p\.?\s*ring|shela|ghuma|south bopal/, ['bopal']],
  [/\bnavapura|changodar/, ['navapura']],
]

export interface LocalContext {
  section?: string
  modelSlug?: string
}

function findModels(q: string): Model[] {
  const found: string[] = []
  let rest = q
  for (const [re, slug] of MODEL_ALIASES) {
    if (re.test(rest)) {
      found.push(slug)
      rest = rest.replace(re, ' ')
    }
  }
  return found.map((s) => MODELS.find((m) => m.slug === s)!).filter(Boolean)
}

function outletLine(o: Outlet) {
  return `${o.kind === 'showroom' ? 'Showroom' : 'Workshop'} · ${o.name}${o.city !== 'Ahmedabad' ? '' : ', Ahmedabad'}: ${o.address} – ${o.pin}. ${o.hours
    .map((h) => `${h.days} ${h.time}`)
    .join(', ')}. Call ${o.phones.map(formatPhone).join(' / ')}.`
}

function modelSummary(m: Model) {
  const spec = m.specs.map((s) => `${s.label.toLowerCase()} ${s.value} ${s.unit}`).join(', ')
  return `${m.fullName}: ${lakh(m.priceFrom)} – ${lakh(m.priceTo)} ex-showroom Ahmedabad, ${m.variants.length} variant${m.variants.length > 1 ? 's' : ''}, ${m.fuels.join(' / ')} with ${m.transmissions.join(' / ').toLowerCase()} transmission${spec ? `; ${spec}` : ''}.`
}

export function answerLocally(question: string, ctx: LocalContext = {}): string {
  const q = question.toLowerCase().replace(/[’']/g, "'")
  const has = (re: RegExp) => re.test(q)
  let models = findModels(q)
  if (!models.length && ctx.modelSlug && has(/\b(it|this|its|variant|colou?r|price|cost|diesel|petrol|automatic|manual)\b/)) {
    const m = MODELS.find((x) => x.slug === ctx.modelSlug)
    if (m) models = [m]
  }

  if (has(/^(hi|hello|hey|namaste|kem cho|namaskar)\b/) && q.length < 24)
    return 'Namaste! I can help with Mahindra prices and variants, our showrooms and workshops, service bookings or a test drive. What are you looking for?'

  if (has(/\b(on[- ]?road|offer|discount|emi|loan|financ|exchange|stock|waiting|delivery time|insurance|mileage|kmpl)\b/)) {
    const m = models[0]
    return `I don't have live ${has(/emi|loan|financ/) ? 'finance or EMI details' : has(/stock|waiting|delivery/) ? 'stock or waiting-period information' : has(/mileage|kmpl/) ? 'mileage figures' : 'on-road prices or current offers'} — our sales team can confirm that for you${m ? ` on the ${m.name}` : ''}. Call ${formatPhone(BUSINESS.phones.sales[0])} or ${formatPhone(BUSINESS.phones.sales[1])}.\n[[call:${BUSINESS.phones.sales[0]}]]${m ? ` [[testdrive:${m.slug}]]` : ''}`
  }

  if (has(/test ?drive/)) {
    const m = models[0]
    return `Happy to set that up. Send a request with your preferred showroom${m ? ` for the ${m.name}` : ''} and the team will call you back to confirm a slot.\n[[testdrive:${m?.slug ?? ''}]] [[call:${BUSINESS.phones.sales[0]}]]`
  }

  if (models.length >= 2) {
    return `${models.slice(0, 3).map(modelSummary).join('\n')}\n${models
      .slice(0, 2)
      .map((m) => `[[model:${m.slug}]]`)
      .join(' ')}`
  }

  if (models.length === 1) {
    const m = models[0]
    if (has(/colou?r|shade|paint/)) return `${m.fullName} is listed in ${m.colors.map((c) => c.name).join(', ')}.\n[[model:${m.slug}]]`
    const fuel = has(/diesel/) ? 'Diesel' : has(/petrol/) ? 'Petrol' : null
    const tr = has(/automatic|\bat\b/) ? 'Automatic' : has(/manual|\bmt\b/) ? 'Manual' : null
    if (fuel || tr || has(/variant|trim|top|base|cheapest|lowest|highest/)) {
      let vs = m.variants.filter((v) => (!fuel || v.fuel === fuel) && (!tr || v.transmission === tr))
      if (!vs.length) return `The ${m.name} isn't listed with ${[fuel, tr].filter(Boolean).join(' ').toLowerCase()} options. It comes as ${m.fuels.join(' / ')}, ${m.transmissions.join(' / ').toLowerCase()}.\n[[model:${m.slug}]]`
      vs = [...vs].sort((a, b) => a.price - b.price)
      const pick = vs.length > 5 ? [vs[0], vs[1], vs[Math.floor(vs.length / 2)], vs[vs.length - 2], vs[vs.length - 1]] : vs
      return `${m.name}${fuel || tr ? ` (${[fuel, tr].filter(Boolean).join(', ').toLowerCase()})` : ''} — ${vs.length} variant${vs.length > 1 ? 's' : ''}, ex-showroom Ahmedabad:\n${pick
        .map((v) => `• ${v.name}: ${lakh(v.price)}`)
        .join('\n')}${vs.length > pick.length ? '\nThe model page lists every variant.' : ''}\n[[model:${m.slug}]] [[testdrive:${m.slug}]]`
    }
    return `${modelSummary(m)} Prices can change, so the showroom will confirm.\n[[model:${m.slug}]] [[testdrive:${m.slug}]]`
  }

  const under = q.match(/(?:under|below|within|less than|upto|up to)\s*(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)\s*(?:l|lakh|lac|lakhs)?/)
  if (under || has(/cheapest|budget|affordable|lowest price|starting price/)) {
    const cap = under ? parseFloat(under[1]) : Infinity
    const list = MODELS.filter((m) => m.priceFrom <= cap).sort((a, b) => a.priceFrom - b.priceFrom)
    if (!list.length) return `The most accessible SUV we list is the ${MODELS.reduce((a, b) => (a.priceFrom < b.priceFrom ? a : b)).fullName}. For commercial needs, the Supro range starts at ${lakh(COMMERCIAL[0].priceFrom)}.\n[[section:lineup]]`
    return `${under ? `Starting under ₹${cap} lakh` : 'Most accessible starting prices'} (ex-showroom Ahmedabad):\n${list
      .slice(0, 5)
      .map((m) => `• ${m.name} from ${lakh(m.priceFrom)}`)
      .join('\n')}\n[[model:${list[0].slug}]] [[section:lineup]]`
  }

  if (has(/\b(ev|evs|electric|e-?suv|battery|range|charg)/)) {
    const evs = MODELS.filter((m) => m.category === 'esuv').sort((a, b) => parseFloat(b.specs[1]?.value ?? '0') - parseFloat(a.specs[1]?.value ?? '0'))
    return `Our electric SUVs, by listed claimed range:\n${evs
      .map((m) => `• ${m.name}: up to ${m.specs[1]?.value} km/charge, ${m.specs[0]?.value} kWh, from ${lakh(m.priceFrom)}`)
      .join('\n')}\n[[model:${evs[0].slug}]] [[section:electric]]`
  }

  if (has(/commercial|pick-?up|pik-?up|truck|supro|veero|camper|maxx|loader|business vehicle/)) {
    return `Commercial line-up, starting ex-showroom prices:\n${COMMERCIAL.map((c) => `• ${c.name} (${c.type}) from ${lakh(c.priceFrom)}`).join('\n')}\nCall sales on ${formatPhone(BUSINESS.phones.sales[0])} for fitments and availability.\n[[section:commercial]] [[call:${BUSINESS.phones.sales[0]}]]`
  }

  const areaHits = AREA_ALIASES.filter(([re]) => re.test(q)).flatMap(([, ids]) => ids)
  const wantsWorkshop = has(/service|workshop|repair|maint|garage|body ?shop|accident/)
  const wantsShowroom = has(/showroom|buy|sales|purchase/)
  if (areaHits.length) {
    let outs = OUTLETS.filter((o) => areaHits.includes(o.id))
    if (wantsWorkshop) outs = outs.filter((o) => o.kind === 'workshop').length ? outs.filter((o) => o.kind === 'workshop') : outs
    if (wantsShowroom) outs = outs.filter((o) => o.kind === 'showroom').length ? outs.filter((o) => o.kind === 'showroom') : outs
    if (outs.length) return `${outs.map(outletLine).join('\n')}\n[[outlet:${outs[0].id}]] [[call:${outs[0].phones[0]}]]`
  }

  if (has(/qwik|90 ?min|quick service/)) return `${SERVICE_OFFERINGS[0].body} Book on ${formatPhone(BUSINESS.phones.serviceBooking)}.\n[[call:${BUSINESS.phones.serviceBooking}]] [[section:service]]`
  if (has(/roadside|rsa|breakdown|stranded|tow/)) return `${SERVICE_OFFERINGS[4].body} RSA can be bought online at withyouhamesha.com, or ask the workshop on ${formatPhone(BUSINESS.phones.service[0])}.\n[[call:${BUSINESS.phones.service[0]}]] [[section:service]]`
  if (has(/doorstep|on wheels|msow|home service/)) return `${SERVICE_OFFERINGS[2].body} Call ${formatPhone(BUSINESS.phones.serviceBooking)} to arrange it.\n[[call:${BUSINESS.phones.serviceBooking}]]`
  if (has(/pick ?(n|and|&)? ?drop|pickup and drop/)) return `${SERVICE_OFFERINGS[3].body} Call ${formatPhone(BUSINESS.phones.serviceBooking)} to arrange it.\n[[call:${BUSINESS.phones.serviceBooking}]]`

  if (wantsWorkshop) {
    const ws = OUTLETS.filter((o) => o.kind === 'workshop')
    return `To book a service in Ahmedabad, call ${formatPhone(BUSINESS.phones.serviceBooking)}. Our workshops:\n${ws.map((o) => `• ${o.name}, ${o.city} — ${o.phones.map(formatPhone).join(' / ')}`).join('\n')}\n[[call:${BUSINESS.phones.serviceBooking}]] [[section:service]]`
  }

  if (has(/showroom|branch|outlet|address|location|where|near|timing|hours|open|sunday|close/)) {
    const ss = OUTLETS.filter((o) => (wantsWorkshop ? o.kind === 'workshop' : o.kind === 'showroom'))
    return `We have ${OUTLETS.filter((o) => o.kind === 'showroom').length} showrooms and ${OUTLETS.filter((o) => o.kind === 'workshop').length} workshops:\n${ss
      .map((o) => `• ${o.name}, ${o.city} — ${o.hours.map((h) => `${h.days} ${h.time}`).join(', ')}`)
      .join('\n')}\nTell me your area and I'll point you to the nearest one.\n[[section:network]]`
  }

  if (has(/phone|call|contact|number|email|mail|whatsapp|reach/))
    return `Sales: ${BUSINESS.phones.sales.map(formatPhone).join(' / ')}. Service: ${BUSINESS.phones.service.map(formatPhone).join(' / ')}. Email ${BUSINESS.email.customerCare}. Hours ${BUSINESS.workingHours}.\n[[call:${BUSINESS.phones.sales[0]}]] [[call:${BUSINESS.phones.service[0]}]]`

  if (has(/about|history|since|who are|award|trust|experience|old/))
    return `Shital Motors has been an authorised Mahindra dealer in Gujarat since ${BUSINESS.since}, with sales, service and spares under one roof, and has served ${BUSINESS.customersServed} customers across Ahmedabad, Sanand and Surendranagar.\n[[section:stories]]`

  if (has(/suv|model|car|line-?up|range|vehicle|buy/)) {
    const suvs = MODELS.filter((m) => m.category === 'suv')
    return `Our SUV line-up: ${suvs.map((m) => m.name).join(', ')}. Electric: ${MODELS.filter((m) => m.category === 'esuv')
      .map((m) => m.name)
      .join(', ')}. Tell me a budget or a model and I'll narrow it down.\n[[section:lineup]]`
  }

  return `I can help with model prices and variants, electric SUVs, commercial vehicles, showroom and workshop details, service bookings or a test drive. For anything else, the team is on ${formatPhone(BUSINESS.phones.sales[0])}.\n[[call:${BUSINESS.phones.sales[0]}]]`
}
