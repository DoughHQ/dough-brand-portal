export type {
  ProductMaster,
  ProductMasterProduct,
  MasterSku,
  MasterImage,
  MasterPrice,
  MasterDietary,
  MasterIntelligence,
  MasterCoverage,
  OpenCorrection,
  RecentChange,
  EvidenceRung,
} from './types'
export { fetchProductMaster, callWriteRpc } from './fetch'
export { humanizeRpcError, getHint, parseErrorDetails, looksLikeMissingRpc } from './errors'
export { SUPPORT_EMAIL, SUPPORT_MAILTO, supportHref } from './support'
export {
  pageShell,
  card,
  productName,
  sectionHeading,
  consumerQuestion,
  bodyText,
  fieldLabel,
  fieldValue,
  caption,
  chip,
  button,
} from './styles'
