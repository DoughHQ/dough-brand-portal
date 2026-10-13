type Props = {
  singleTestMode: boolean
  priceMode: boolean
}

export default function OwnProductColumnHead({ singleTestMode, priceMode }: Props) {
  return (
    <div className="cb-field-head-left">
      <div className="cb-field-col-title">{singleTestMode ? 'Your concepts' : 'Your product'}</div>
      <div className="cb-field-col-meta">
        {singleTestMode
          ? 'The designs respondents will evaluate.'
          : priceMode
            ? 'The product or concept you want respondents to evaluate.'
            : 'Add the product or concept variants you want respondents to evaluate.'}
      </div>
    </div>
  )
}
