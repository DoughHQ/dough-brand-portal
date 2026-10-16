'use server'

import { moderateBrandPhoto } from '@/lib/productMaster/brandPhoto.server'

export async function moderateBrandPhotoAction(input: { holdingPath: string }) {
  return moderateBrandPhoto(input)
}
