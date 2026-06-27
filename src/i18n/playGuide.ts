import type { Lang } from './LanguageContext'

/** A string available in both supported languages. */
export type Bi = Record<Lang, string>

const bi = (en: string, ar: string): Bi => ({ en, ar })

export interface CardTypeEntry {
  img: string
  alt: Bi
  title: Bi
  body: Bi
}

export interface ZoneEntry {
  n: number
  term: Bi
  desc: Bi
}

export interface PhaseEntry {
  key: string
  accent: 'red' | 'green' | 'blue' | 'purple' | 'straw'
  title: Bi
  body: Bi
}

export interface StepEntry {
  body: Bi
}

export interface ResourceLink {
  /** Internal app route — we intentionally never link out to the official site. */
  to: string
  img: string
  alt: Bi
  cta: Bi
}

export const PLAY_GUIDE = {
  pageTitle: bi('Play Guide', 'دليل اللعب'),
  intro: bi(
    'Everything you need to start playing the One Piece Card Game — what you need, the card types, the playmat, how to start, how to win, and the turn flow.',
    'كل ما تحتاجه للبدء في لعبة ون بيس للبطاقات — ما تحتاجه، وأنواع البطاقات، وبساط اللعب، وكيفية البدء، وكيفية الفوز، وتسلسل الدور.',
  ),

  // --- Section: What you need ---
  need: {
    title: bi('What You Need to Play', 'ما تحتاجه للعب'),
    lead: bi(
      "To play, you'll need 1 Leader Card, a 50-card deck, and 10 DON!! cards.",
      'للعب، ستحتاج إلى بطاقة قائد واحدة، ومجموعة من 50 بطاقة، و10 بطاقات دون!! (DON!!).',
    ),
    deckHeading: bi(
      'Your deck is made up of 3 types of cards:',
      'تتكوّن مجموعتك من 3 أنواع من البطاقات:',
    ),
    deckNote: bi(
      'Your deck must match the color of your Leader Card, and you can include up to 4 copies of any one card number.',
      'يجب أن تطابق مجموعتك لون بطاقة القائد، ويمكنك تضمين ما يصل إلى 4 نسخ من أي رقم بطاقة واحد.',
    ),
  },

  // --- Section: Card types ---
  cardsTitle: bi('Card Types', 'أنواع البطاقات'),
  cardTypes: [
    {
      img: 'card_leader.webp',
      alt: bi('Leader Card', 'بطاقة القائد'),
      title: bi('Leader Card', 'بطاقة القائد'),
      body: bi(
        'Your Leader sets the overall direction for your deck, and can attack and use effects. The Life value, shown in the lower right, determines how many Life cards you have. This number varies depending on your Leader card.',
        'يحدّد قائدك التوجّه العام لمجموعتك، ويمكنه الهجوم واستخدام التأثيرات. تحدّد قيمة الحياة، الظاهرة في أسفل اليمين، عدد بطاقات الحياة لديك. يختلف هذا الرقم حسب بطاقة القائد.',
      ),
    },
    {
      img: 'card_don.webp',
      alt: bi('DON!! Card', 'بطاقة دون!!'),
      title: bi('DON!! Cards', 'بطاقات دون!! (DON!!)'),
      body: bi(
        'DON!! cards are used to pay costs or given to Leaders and Characters to boost their power. You gain 2 DON!! cards automatically each turn (up to 10 total; on turn 1, the first player only gets 1).',
        'تُستخدم بطاقات دون!! لدفع التكاليف أو تُمنح للقادة والشخصيات لزيادة قوّتهم. تحصل على بطاقتي دون!! تلقائياً كل دور (حتى 10 إجمالاً؛ في الدور الأول يحصل اللاعب الأول على واحدة فقط).',
      ),
    },
    {
      img: 'card_chara.webp',
      alt: bi('Character Card', 'بطاقة شخصية'),
      title: bi('Character Cards', 'بطاقات الشخصيات'),
      body: bi(
        "Character cards are played from your hand by paying their cost with DON!! cards. They have power and effects, and can attack your opponent's Leader or Characters. They're the core component of any battle.",
        'تُلعب بطاقات الشخصيات من يدك بدفع تكلفتها ببطاقات دون!!. لها قوة وتأثيرات، ويمكنها مهاجمة قائد خصمك أو شخصياته. وهي العنصر الأساسي في أي معركة.',
      ),
    },
    {
      img: 'card_event.webp',
      alt: bi('Event Card', 'بطاقة حدث'),
      title: bi('Event Cards', 'بطاقات الأحداث'),
      body: bi(
        "Event cards are one-time effects you play from your hand by paying their DON!! cost. Many offer powerful effects, including some that can be used during your opponent's attack to turn the tides!",
        'بطاقات الأحداث هي تأثيرات لمرة واحدة تلعبها من يدك بدفع تكلفتها من دون!!. يقدّم كثير منها تأثيرات قوية، بما في ذلك بعضها الذي يمكن استخدامه أثناء هجوم خصمك لقلب الموازين!',
      ),
    },
    {
      img: 'card_stage.webp',
      alt: bi('Stage Card', 'بطاقة ساحة'),
      title: bi('Stage Cards', 'بطاقات الساحة'),
      body: bi(
        'Stage cards are played from your hand using DON!! cards. You can only have one on your field at a time, and they provide ongoing effects that support your Leader or Characters.',
        'تُلعب بطاقات الساحة من يدك باستخدام بطاقات دون!!. يمكنك امتلاك واحدة فقط في ميدانك في كل مرة، وهي توفّر تأثيرات مستمرة تدعم قائدك أو شخصياتك.',
      ),
    },
  ] satisfies CardTypeEntry[],

  // --- Section: Playmat ---
  seat: {
    title: bi('Playmat & Card Zones', 'بساط اللعب ومناطق البطاقات'),
    zones: [
      { n: 1, term: bi('Character Area', 'منطقة الشخصيات'), desc: bi('Where you play Character cards. You can have up to 5 Characters on the field at a time.', 'حيث تلعب بطاقات الشخصيات. يمكنك امتلاك ما يصل إلى 5 شخصيات في الميدان في وقت واحد.') },
      { n: 2, term: bi('Leader Card', 'بطاقة القائد'), desc: bi('Where you place your Leader card.', 'حيث تضع بطاقة القائد الخاصة بك.') },
      { n: 3, term: bi('Stage Card', 'بطاقة الساحة'), desc: bi('Where you play your Stage card. Each player can have only one at a time.', 'حيث تلعب بطاقة الساحة. يمكن لكل لاعب امتلاك واحدة فقط في كل مرة.') },
      { n: 4, term: bi('Deck', 'المجموعة'), desc: bi('Where you place your deck and draw cards from.', 'حيث تضع مجموعتك وتسحب منها البطاقات.') },
      { n: 5, term: bi('Trash', 'المهملات'), desc: bi("Where you place K.O.'d Characters and used cards.", 'حيث تضع الشخصيات المهزومة (K.O.) والبطاقات المستخدمة.') },
      { n: 6, term: bi('Cost Area', 'منطقة التكلفة'), desc: bi('Where you place DON!! cards. Use them to pay costs or power up for battle.', 'حيث تضع بطاقات دون!!. استخدمها لدفع التكاليف أو التقوية للمعركة.') },
      { n: 7, term: bi('DON!! Deck', 'مجموعة دون!!'), desc: bi('Where you place your DON!! deck. It contains exactly 10 DON!! cards.', 'حيث تضع مجموعة دون!!. تحتوي على 10 بطاقات دون!! بالضبط.') },
      { n: 8, term: bi('Life Cards', 'بطاقات الحياة'), desc: bi('Where you place your Life cards.', 'حيث تضع بطاقات الحياة الخاصة بك.') },
    ] satisfies ZoneEntry[],
  },

  // --- Section: How to start ---
  start: {
    title: bi('How to Start a Game', 'كيفية بدء اللعبة'),
    // Short captions for the custom setup-flow diagram (one per step).
    flow: [
      { icon: '🃏', label: bi('Set up', 'التجهيز') },
      { icon: '✊', label: bi('Decide turn', 'تحديد الدور') },
      { icon: '🖐️', label: bi('Draw 5', 'اسحب 5') },
      { icon: '🛡️', label: bi('Set Life', 'ضع الحياة') },
      { icon: '🚩', label: bi('Begin', 'ابدأ') },
    ],
    steps: [
      { body: bi('Shuffle your deck and place your Leader card, Deck, and DON!! deck in their zones. Your Leader card is placed face-up.', 'اخلط مجموعتك وضع بطاقة القائد والمجموعة ومجموعة دون!! في مناطقها. توضع بطاقة القائد ووجهها لأعلى.') },
      { body: bi('Do rock-paper-scissors to decide who goes first. The winner chooses to go first or second.', 'العبوا حجر-ورقة-مقص لتحديد من يبدأ. يختار الفائز اللعب أولاً أو ثانياً.') },
      { body: bi('Draw 5 cards from your deck. You may mulligan to redraw once if you like.', 'اسحب 5 بطاقات من مجموعتك. يمكنك إعادة السحب (مولِغان) مرة واحدة إن أردت.') },
      { body: bi("Take cards from the top of your deck equal to your Leader's Life value, and place them face-down in the Life area.", 'خذ من أعلى مجموعتك عدداً من البطاقات يساوي قيمة حياة قائدك، وضعها مقلوبة في منطقة الحياة.') },
      { body: bi('The player going first starts the game.', 'يبدأ اللاعب صاحب الدور الأول اللعبة.') },
    ] satisfies StepEntry[],
  },

  // --- Section: Victory ---
  victory: {
    title: bi('Victory Conditions', 'شروط الفوز'),
    lead: bi('You win the game by meeting one of the following conditions:', 'تفوز باللعبة بتحقيق أحد الشرطين التاليين:'),
    conds: [
      bi("You win a battle against your opponent's Leader when they have 0 Life cards remaining.", 'تفوز بمعركة ضد قائد خصمك بينما لا تتبقّى لديه أي بطاقة حياة (0).'),
      bi('Your opponent has no cards left in their deck.', 'لا تتبقّى لدى خصمك أي بطاقات في مجموعته.'),
    ],
  },

  // --- Section: Turn flow ---
  phase: {
    title: bi('Turn Flow', 'تسلسل الدور'),
    lead: bi('Each turn is made up of 5 phases that are always played in the same order.', 'يتكوّن كل دور من 5 مراحل تُلعب دائماً بالترتيب نفسه.'),
    phases: [
      { key: 'refresh', accent: 'red', title: bi('Refresh Phase', 'مرحلة التنشيط'), body: bi('Set all of your rested cards as active, and return all given DON!! cards to your cost area.', 'اجعل كل بطاقاتك المُرهَقة نشطة، وأعد كل بطاقات دون!! الممنوحة إلى منطقة التكلفة.') },
      { key: 'draw', accent: 'green', title: bi('Draw Phase', 'مرحلة السحب'), body: bi('Draw 1 card from your deck.', 'اسحب بطاقة واحدة من مجموعتك.') },
      { key: 'don', accent: 'blue', title: bi('DON!! Phase', 'مرحلة دون!!'), body: bi('Place 2 cards from your DON!! deck into your cost area.', 'ضع بطاقتين من مجموعة دون!! في منطقة التكلفة.') },
      { key: 'main', accent: 'purple', title: bi('Main Phase', 'المرحلة الرئيسية'), body: bi('You can play cards, and attack with your Leader or Characters.', 'يمكنك لعب البطاقات والهجوم بقائدك أو شخصياتك.') },
      { key: 'end', accent: 'straw', title: bi('End Phase', 'مرحلة النهاية'), body: bi("Your turn ends and it becomes your opponent's turn.", 'ينتهي دورك ويبدأ دور خصمك.') },
    ] satisfies PhaseEntry[],
  },

  // --- Section: Resources (internal app pages only — never the official site) ---
  guide: {
    title: bi('Put It Into Practice', 'طبّقه عملياً'),
    lead: bi(
      'Now try it inside the app — play a match against the bot, drill scenarios in the Training Arena, or look up any term in the Glossary.',
      'الآن جرّبه داخل التطبيق — العب مباراة ضد البوت، أو تدرّب على السيناريوهات في ساحة التدريب، أو ابحث عن أي مصطلح في المعجم.',
    ),
    links: [
      { to: '/play', img: 'thumbnail_tutorial-app.webp', alt: bi('Play vs Bot', 'اللعب ضد البوت'), cta: bi('Play vs Bot', 'العب ضد البوت') },
      { to: '/training', img: 'thumbnail_rules-manual.webp', alt: bi('Training Arena', 'ساحة التدريب'), cta: bi('Open Training Arena', 'افتح ساحة التدريب') },
      { to: '/glossary', img: 'thumbnail_faq.webp', alt: bi('Glossary', 'المعجم'), cta: bi('Open the Glossary', 'افتح المعجم') },
    ] satisfies ResourceLink[],
  },

  stepLabel: bi('Step', 'الخطوة'),
} as const
