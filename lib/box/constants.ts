/** Scan/pay copy — respondents physically scan the package. Do not reuse concept identity copy. */
export const BOX_UPC_SCAN_HELP =
  "This barcode is how we confirm the respondent tried the product. If it's wrong, they can't complete the box and won't be paid. Check it against the physical package."

export const BOX_TRIED_LOOP_TITLE = 'What counts as "tried"?'

export const BOX_TRIED_LOOP_BODY =
  'Not a tap. In Dough, "tried" means someone actually lived with your product — they scanned it, ranked it head-to-head against real competitors, and came back to battle it again. A completed loop. That\'s the difference between "I think I\'d like this" and "I bought it, tasted it, and here\'s exactly where it lands against the shelf." Every "tried" taster in your audience is a verdict you can trust — earned, not self-reported.'

export const BOX_BATTLE_INFO_TITLE = 'What is a battle?'

export const BOX_BATTLE_INFO_BODY =
  'A battle is a head-to-head comparison in this category — someone ranks two products against each other. Battles are engagement; they can be farmed. A completed loop (scan, try, battle, return) is what earns level. Leave blank for no engagement bar.'

export const BOX_DEFAULT_BATTLE_QUESTION = 'Which would you buy?'

export const BOX_BATTLE_QUESTION_TITLE = 'Writing a good battle question'

export const BOX_BATTLE_QUESTION_INTRO =
  "This is the forced choice every respondent makes between two products — it's what your ranking is built on. A few principles:"

export const BOX_BATTLE_QUESTION_POINTS: { title: string; body: string }[] = [
  {
    title: 'Keep it about a real decision.',
    body: '"Which would you buy?" or "Which would you grab for lunch?" beats "Which is better?" — you want a choice they\'d actually make, not an abstract judgment.',
  },
  {
    title: 'Match it to what you\'re measuring.',
    body: 'Testing an occasion? "Which would you reach for after a workout?" Testing value? "Which is worth the price?" The question frames the whole result.',
  },
  {
    title: 'Stay neutral.',
    body: 'Don\'t lead — "Which of these premium options do you prefer?" biases the answer. Let the products, not the wording, win.',
  },
  {
    title: 'One question, one construct.',
    body: 'Ask about preference or purchase intent or fit-for-occasion — not several at once.',
  },
]

export const BOX_BATTLE_QUESTION_FOOTER =
  'Whatever you ask is recorded and shown with your results, so you always know exactly what your ranking measures.'
