/**
 * RFC 1321 MD5. Used only for the attribute-sample hash
 * (first 8 hex digits as int), matching mission_attribute_sample_plan.
 */
export function md5Hex(input: string): string {
  const bytes = unescape(encodeURIComponent(input))
  const msg: number[] = []
  for (let i = 0; i < bytes.length; i++) msg.push(bytes.charCodeAt(i))

  const n = msg.length
  msg.push(0x80)
  while ((msg.length + 8) % 64 !== 0) msg.push(0)
  const bitLen = n * 8
  for (let i = 0; i < 8; i++) msg.push((bitLen >>> (i * 8)) & 0xff)

  let a = 0x67452301
  let b = 0xefcdab89
  let c = 0x98badcfe
  let d = 0x10325476

  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
    9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
    16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10,
    15, 21,
  ]
  const K = new Array<number>(64)
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32)

  function rotl(x: number, n: number) {
    return (x << n) | (x >>> (32 - n))
  }

  for (let i = 0; i < msg.length; i += 64) {
    const w: number[] = []
    for (let j = 0; j < 16; j++) {
      const o = i + j * 4
      w[j] =
        msg[o]! | (msg[o + 1]! << 8) | (msg[o + 2]! << 16) | (msg[o + 3]! << 24)
    }
    let A = a
    let B = b
    let C = c
    let D = d
    for (let j = 0; j < 64; j++) {
      let f: number
      let g: number
      if (j < 16) {
        f = (B & C) | (~B & D)
        g = j
      } else if (j < 32) {
        f = (D & B) | (~D & C)
        g = (5 * j + 1) % 16
      } else if (j < 48) {
        f = B ^ C ^ D
        g = (3 * j + 5) % 16
      } else {
        f = C ^ (B | ~D)
        g = (7 * j) % 16
      }
      const tmp = D
      D = C
      C = B
      B = (B + rotl((A + f + K[j]! + w[g]!) | 0, S[j]!)) | 0
      A = tmp
    }
    a = (a + A) | 0
    b = (b + B) | 0
    c = (c + C) | 0
    d = (d + D) | 0
  }

  function hex(n: number) {
    let s = ''
    for (let i = 0; i < 4; i++) {
      const v = (n >>> (i * 8)) & 0xff
      s += v.toString(16).padStart(2, '0')
    }
    return s
  }
  return hex(a) + hex(b) + hex(c) + hex(d)
}

/** First 8 hex of md5(seed + ':attr:' + n) as unsigned int. */
export function attributeSampleHash(seed: string, roundNumber: number): number {
  const hex = md5Hex(`${seed}:attr:${roundNumber}`).slice(0, 8)
  return Number.parseInt(hex, 16)
}

export function sampledWhyRounds(
  seed: string,
  battleCount: number,
  k = 3
): number[] {
  if (battleCount < 1 || k < 1) return []
  const take = Math.min(k, battleCount)
  const ranked = Array.from({ length: battleCount }, (_, i) => i + 1).sort(
    (a, b) => attributeSampleHash(seed, a) - attributeSampleHash(seed, b) || a - b
  )
  return ranked.slice(0, take).sort((a, b) => a - b)
}
