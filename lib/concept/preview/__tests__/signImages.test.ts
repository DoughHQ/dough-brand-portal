import { describe, expect, it, vi, afterEach } from 'vitest'
import { signCombatantImages } from '../signImages'
import type { PreviewCombatant } from '../combatants'

vi.mock('@/lib/supabase', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        createSignedUrl: async (path: string) => ({
          data: {
            signedUrl: `https://proj.supabase.co/storage/v1/object/sign/concept-stimuli/${path}?token=t`,
          },
          error: null,
        }),
      }),
    },
  }),
}))

afterEach(() => {
  vi.clearAllMocks()
})

const concept: PreviewCombatant = {
  ref: 1,
  kind: 'concept',
  name: 'Package C',
  brand: null,
  image_url: 'concept-stimuli/12/draft/C-abc.png',
  price: null,
}

const product: PreviewCombatant = {
  ref: 2,
  kind: 'product',
  name: 'PB Blondie Bestie Sundae',
  brand: "Ben & Jerry's",
  image_url: 'https://cdn.example/sundae.jpg',
  price: null,
}

describe('signCombatantImages', () => {
  it('puts a signed https URL on a concept arm and never a storage ref', async () => {
    const [arm] = await signCombatantImages([concept])
    expect(arm?.image_url).toMatch(/^https:\/\//)
    expect(arm?.image_url).toContain('/storage/v1/object/sign/concept-stimuli/12/draft/C-abc.png')
    expect(arm?.image_url).not.toMatch(/^concept-stimuli\//)
    expect(arm?.image_unavailable).toBe(false)
  })

  it('passes product catalog https through', async () => {
    const [row] = await signCombatantImages([product])
    expect(row?.image_url).toBe('https://cdn.example/sundae.jpg')
    expect(row?.image_unavailable).toBe(false)
  })

  it('marks a missing image unavailable without fabricating a url', async () => {
    const [row] = await signCombatantImages([
      { ...concept, image_url: null },
    ])
    expect(row?.image_url).toBeNull()
    expect(row?.image_unavailable).toBe(true)
  })
})
