// Australian Business Number checksum (ATO algorithm). A pass means the number is well formed,
// not that the business exists; the admin still confirms it on ABN Lookup.
const WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]

export function cleanAbn(input: string): string {
  return input.replace(/\s+/g, '')
}

export function isValidAbn(input: string): boolean {
  const abn = cleanAbn(input)
  if (!/^\d{11}$/.test(abn)) return false
  const digits = abn.split('').map(Number)
  digits[0] -= 1
  const sum = digits.reduce((s, d, i) => s + d * WEIGHTS[i], 0)
  return sum % 89 === 0
}
