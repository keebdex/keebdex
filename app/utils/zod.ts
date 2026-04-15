import { z } from 'zod'

export const nullableNumber = z.preprocess(
  (value) => (value === '' ? null : value),
  z.number().nullish(),
)
