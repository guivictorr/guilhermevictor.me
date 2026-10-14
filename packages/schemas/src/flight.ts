import { z } from "zod"
import { IsoDateTime } from "./common"

/** "2024-06-13T08:07" in the airport's own local time (no offset). */
export const LocalDateTime = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/,
    "Enter a valid date and time"
  )
export type LocalDateTime = z.infer<typeof LocalDateTime>

export const Iata = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Use the 3-letter airport code")

export const CabinClass = z.enum(["economy", "premium", "business", "first"])
export type CabinClass = z.infer<typeof CabinClass>

const optionalShort = z.string().trim().max(100).optional()

/**
 * A flight you took. Times are local to each airport, like on a boarding
 * pass; durations come from the airports' timezones.
 */
export const FlightInput = z.object({
  from: Iata,
  to: Iata,
  departure: LocalDateTime,
  arrival: LocalDateTime.optional(),
  /** e.g. "G32054" (IATA airline code + number). */
  flightNumber: z
    .string()
    .trim()
    .toUpperCase()
    .transform((v) => v.replace(/\s+/g, ""))
    .optional(),
  airline: optionalShort,
  aircraft: optionalShort,
  /** Tail number, e.g. "PR-GXA". */
  registration: optionalShort,
  seat: z.string().trim().toUpperCase().max(5).optional(),
  cabin: CabinClass.optional(),
  /** Booking code / PNR. */
  reservation: z.string().trim().toUpperCase().max(10).optional(),
  notes: z.string().trim().max(5000).optional(),
})
export type FlightInput = z.infer<typeof FlightInput>

export const Flight = FlightInput.extend({
  id: z.uuid(),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
})
export type Flight = z.infer<typeof Flight>
