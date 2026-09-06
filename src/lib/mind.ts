/**
 * Lightweight preschool mind — warm teacher voice, short beats, topic branches.
 * Greeting offers talk OR two pictures; ~8 min arc ends with one first-principles
 * wonder (why/how/what if variants), never a quiz grade. Always exactly two pictures.
 * Topics: dinos / forest folklore classics / feelings / animals / nature / ice (original).
 * Folklore priority: Three Little Pigs, Little Red Riding Hood, gentle classics.
 * No Disney IP names in spoken content. Allergy filter wraps food labels.
 */

import {
  buildAllergyInterruptTurn,
  filterPictureChoices,
  filterSpeechText,
  getAllergyTeachLine,
  shouldHardAllergyInterrupt,
  type PictureChoice,
} from './allergyFilter';
import { isHangupPhrase } from './hangupPhrase';

export { isHangupPhrase };

/** Preschool topic branches — forest = folklore story arcs. */
export type Topic = 'dinos' | 'forest' | 'feelings' | 'animals' | 'nature' | 'ice';

export type MindTurn = {
  speech: string;
  captions: { naomi?: string; luce: string };
  twoPictureChoices: [PictureChoice, PictureChoice];
  /** Topic locked for this sitting after she picks (or talks) one */
  topic?: Topic | null;
};

export type MindInput = {
  /** Kid utterance or picture label */
  naomiSaid?: string;
  /** Picture choice id if she tapped */
  pictureId?: string;
  turnIndex: number;
  /** Session already greeted */
  greeted?: boolean;
  /** Topic carried from prior turns in this sitting */
  topic?: Topic | null;
};

type Beat = {
  speech: string;
  choices: [PictureChoice, PictureChoice];
  teachAllergy?: boolean;
  /** Mark the single first-principles beat near end of the arc */
  firstPrinciples?: boolean;
};

/** Default greeting pictures: dinosaurs / forest-or-folklore. Talk unlocks more. */
const GREETING: Beat = {
  speech:
    "Hi Naomi! I'm Luce — come sit with me. Want dinosaurs, or a forest story? Tap a picture, or say animals, nature, or feelings.",
  choices: [
    { id: 'dinos', emoji: '🦖', label: 'dinosaurs' },
    { id: 'forest', emoji: '🌲', label: 'forest story' },
  ],
};

const DINO_BEATS: Beat[] = [
  {
    speech:
      "Ooh, dinosaurs — let's go soft and slow. A gentle triceratops loves sunny rocks. Want to count three warm rocks with me, or say a soft hi to a stegosaurus?",
    choices: [
      { id: 'rocks', emoji: '🪨', label: 'count rocks' },
      { id: 'stego', emoji: '🦕', label: 'stegosaurus' },
    ],
  },
  {
    speech:
      "Stomp-stomp, so gentle — a friendly brachiosaurus stretches up to the leaves. Soft neck, soft feet. Shall we munch pretend leaves together, or try a tiny T-rex roar?",
    choices: [
      { id: 'leaves', emoji: '🍃', label: 'leaves' },
      { id: 'trex', emoji: '🦖', label: 'T-rex' },
    ],
  },
  {
    speech:
      "Look — a little velociraptor practices careful feet in the tall grass. One, two, three. Come count eggs with me, or splash in a warm puddle?",
    choices: [
      { id: 'eggs', emoji: '🥚', label: 'count eggs' },
      { id: 'puddle', emoji: '💧', label: 'puddle' },
    ],
  },
  {
    speech:
      "Oh sweet — a triceratops and a stegosaurus share the shade. No scares, just friends. Peek at the moon with them, or follow a brachiosaurus path?",
    choices: [
      { id: 'moon', emoji: '🌙', label: 'moon' },
      { id: 'path', emoji: '🛤️', label: 'dino path' },
    ],
  },
  {
    speech:
      "T-rex practices a tiny happy roar — not too loud. Velociraptor claps her careful feet. Want a tiny roar together, or a quiet stretch beside me?",
    choices: [
      { id: 'roar', emoji: '📣', label: 'tiny roar' },
      { id: 'stretch', emoji: '🧘', label: 'stretch' },
    ],
  },
];

/**
 * Folklore / classic preschool stories (primary story path).
 * Gentle retells: Three Little Pigs, Little Red Riding Hood, plus soft classics.
 * Always exactly two emoji pictures that illustrate the beat.
 */
const FOREST_BEATS: Beat[] = [
  {
    speech:
      "Story time — come close. Once upon a soft morning, three little pigs packed tiny tool belts. One hummed, one skipped, one checked the sky. Shall we follow the first pig to gather straw, or walk with the second pig toward the sticks?",
    choices: [
      { id: 'straw', emoji: '🌾', label: 'straw' },
      { id: 'sticks', emoji: '🪵', label: 'sticks' },
    ],
  },
  {
    speech:
      "The first pig built a cozy straw house — swish, swish — then waved hello. The second pig stacked stick walls, careful and proud. A breezy wolf neighbor sniffed by… but we keep this gentle: he only huffed a tiny puff and sat down to think. Help stack more sticks, or peek in the straw window?",
    choices: [
      { id: 'stack', emoji: '🧱', label: 'stack' },
      { id: 'window', emoji: '🪟', label: 'window' },
    ],
  },
  {
    speech:
      "The third little pig built a strong brick house — clap, clap, safe and warm. She invited her sisters in for tea and apple slices. The wolf learned soft manners and knocked politely. Knock on the brick door with me, or pour pretend tea for the pigs?",
    choices: [
      { id: 'knock', emoji: '🚪', label: 'knock' },
      { id: 'tea', emoji: '🫖', label: 'tea' },
    ],
  },
  {
    speech:
      "Another story path: Little Red Riding Hood skips along a sunny trail in her soft red cape. She carries a basket of warm bread for Grandma — never scary, just kind. Hold the red cape with me, or peek in the picnic basket?",
    choices: [
      { id: 'cape', emoji: '🧥', label: 'red cape' },
      { id: 'basket', emoji: '🧺', label: 'basket' },
    ],
  },
  {
    speech:
      "At Grandma's cottage, flowers nod by the door and soup smells cozy. Little Red knocks — tap tap — and Grandma opens with the biggest hug. A shy forest friend waits outside learning to wait his turn. Hug Grandma with me, or pick a flower for the table?",
    choices: [
      { id: 'grandma', emoji: '👵', label: 'grandma' },
      { id: 'flower-gift', emoji: '🌷', label: 'flower' },
    ],
  },
  {
    speech:
      "One more classic hush: Goldilocks finds three soft chairs and three warm bowls — she tries the smallest, just-right seat and says thank you. Or we can visit Jack's tall green beanstalk that only climbs to a friendly cloud picnic. Sit in the small chair, or climb the soft beanstalk?",
    choices: [
      { id: 'chair', emoji: '🪑', label: 'small chair' },
      { id: 'beanstalk', emoji: '🌱', label: 'beanstalk' },
    ],
  },
  {
    speech:
      "On a soft Italian night, kind La Befana flies with care — never scary — and an Irish hillside light blinks hello. We made a folklore nest of kindness. Hold a story hug with me, or blow a quiet wind kiss to the pigs and Little Red?",
    choices: [
      { id: 'hug', emoji: '🤗', label: 'story hug' },
      { id: 'wind', emoji: '🌬️', label: 'wind kiss' },
    ],
  },
];

const FEELINGS_BEATS: Beat[] = [
  {
    speech:
      "Feelings time — I'm right here with you. Sometimes our hearts feel big and sunny. Is your heart feeling happy, or a little quiet today?",
    choices: [
      { id: 'happy', emoji: '☀️', label: 'happy' },
      { id: 'quiet', emoji: '🌙', label: 'quiet' },
    ],
  },
  {
    speech:
      "When we feel wiggly, a soft stretch helps so much. Want to stretch tall like a tree with me, or curl small like a seed?",
    choices: [
      { id: 'tall', emoji: '🌲', label: 'tall' },
      { id: 'seed', emoji: '🌱', label: 'small' },
    ],
  },
  {
    speech:
      "Mommy and Daddy love every feeling you have. We can send them a warm heart, or a gentle wave — you choose.",
    choices: [
      { id: 'heart', emoji: '💛', label: 'heart' },
      { id: 'wave', emoji: '👋', label: 'wave' },
    ],
  },
  {
    speech:
      "Brave and kind can sit side by side. Shall we practice a brave breath together, or share a kind smile?",
    choices: [
      { id: 'breath', emoji: '😮‍💨', label: 'breath' },
      { id: 'smile', emoji: '😊', label: 'smile' },
    ],
  },
  {
    speech:
      "Our feelings nest is so cozy. Hold a soft hug for yourself, or save a hug for Mommy or Daddy later?",
    choices: [
      { id: 'self-hug', emoji: '🤗', label: 'soft hug' },
      { id: 'share-hug', emoji: '👪', label: 'share hug' },
    ],
  },
];

const ANIMALS_BEATS: Beat[] = [
  {
    speech:
      "Animal friends — oh, look! A soft bunny wiggles her nose just for you. Shall we hop with the bunny, or pat a gentle puppy?",
    choices: [
      { id: 'bunny', emoji: '🐰', label: 'bunny' },
      { id: 'puppy', emoji: '🐶', label: 'puppy' },
    ],
  },
  {
    speech:
      "A kitty purrs on a sunny sill, and a pony waits in the meadow. Want cozy kitty cuddles, or a soft pony ride with me?",
    choices: [
      { id: 'kitty', emoji: '🐱', label: 'kitty' },
      { id: 'pony', emoji: '🐴', label: 'pony' },
    ],
  },
  {
    speech:
      "Birds chirp a little hello, and fish make tiny splash circles. Shall we chirp with the birds, or splash with the fish?",
    choices: [
      { id: 'chirp', emoji: '🐦', label: 'birds' },
      { id: 'splash-fish', emoji: '🐟', label: 'fish' },
    ],
  },
  {
    speech:
      "A ladybug lands on our finger — so careful — and a butterfly floats by. Count ladybug spots with me, or dance with the butterfly?",
    choices: [
      { id: 'ladybug', emoji: '🐞', label: 'ladybug' },
      { id: 'butterfly', emoji: '🦋', label: 'butterfly' },
    ],
  },
  {
    speech:
      "Night hush, sweetheart: a sleepy owl blinks, and a whale sings under soft waves. Owl hoot, or whale song?",
    choices: [
      { id: 'owl', emoji: '🦉', label: 'owl' },
      { id: 'whale', emoji: '🐋', label: 'whale' },
    ],
  },
];

const NATURE_BEATS: Beat[] = [
  {
    speech:
      "Nature walk — take my hand. The sky feels so big and friendly today. Shall we warm up in the sun, or dance in soft rain?",
    choices: [
      { id: 'sun', emoji: '☀️', label: 'sun' },
      { id: 'rain', emoji: '🌧️', label: 'rain' },
    ],
  },
  {
    speech:
      "A cloud floats like a soft pillow, and flowers open their little faces. Cloud hug with me, or smell the flowers?",
    choices: [
      { id: 'cloud', emoji: '☁️', label: 'cloud' },
      { id: 'bloom', emoji: '🌼', label: 'flower' },
    ],
  },
  {
    speech:
      "A little river sings over rocks, and a green hill waits for climbing. Splash in the river together, or climb the hill?",
    choices: [
      { id: 'river', emoji: '🏞️', label: 'river' },
      { id: 'hill', emoji: '⛰️', label: 'hill' },
    ],
  },
  {
    speech:
      "Wind tickles our cheeks — hee — and a rainbow paints the sky. Blow a wind kiss, or point at the rainbow with me?",
    choices: [
      { id: 'breeze', emoji: '🌬️', label: 'wind' },
      { id: 'rainbow', emoji: '🌈', label: 'rainbow' },
    ],
  },
  {
    speech:
      "We gather one soft leaf and one bright star wish. Hold a leaf close, or make a quiet star wish?",
    choices: [
      { id: 'leaf', emoji: '🍃', label: 'leaf' },
      { id: 'wish-star', emoji: '⭐', label: 'star' },
    ],
  },
];

/**
 * Original ice / winter / snow-princess adventure — no Disney character names.
 * Keywords like frozen/elsa/anna route here; spoken lines stay original.
 */
const ICE_BEATS: Beat[] = [
  {
    speech:
      "Snow sparkles on our mittens — hush, it's soft and bright. A kind snow princess opens her ice-castle door and waves you in. Shall we step into the ice castle, or catch a falling snowflake on our tongue?",
    choices: [
      { id: 'ice-castle', emoji: '🏰', label: 'ice castle' },
      { id: 'snowflake', emoji: '❄️', label: 'snowflake' },
    ],
  },
  {
    speech:
      "Inside, snow-sister friends slide on a smooth ice hallway — giggle, careful feet. Warm cocoa waits on a frosty table. Slide with the snow sisters, or sip pretend cocoa with me?",
    choices: [
      { id: 'slide', emoji: '🛷', label: 'sled slide' },
      { id: 'cocoa', emoji: '☕', label: 'cocoa' },
    ],
  },
  {
    speech:
      "The snow princess braids a scarf of moonlight and shares mittens that match. Outside, the winter pond shines like a mirror — we skate only tiny careful circles. Wear the soft mittens, or skate a tiny circle?",
    choices: [
      { id: 'mittens', emoji: '🧤', label: 'mittens' },
      { id: 'skate', emoji: '⛸️', label: 'skate' },
    ],
  },
  {
    speech:
      "We build a round snow fort with a sparkle window, then hang a paper-star lantern. A gentle snow hare peeks in to say hello. Stack a snow block with me, or light the star lantern?",
    choices: [
      { id: 'snow-fort', emoji: '☃️', label: 'snow fort' },
      { id: 'lantern', emoji: '⭐', label: 'lantern' },
    ],
  },
  {
    speech:
      "Night hush in the ice castle: the snow princess hums a homemade lullaby — not from any movie — just for you. Blow a snow kiss to the moon, or wrap up in a warm winter hug?",
    choices: [
      { id: 'snow-kiss', emoji: '🌙', label: 'snow kiss' },
      { id: 'winter-hug', emoji: '🤗', label: 'winter hug' },
    ],
  },
];

/** Two+ wonder angles per topic — one picked per sitting (never a quiz). */
const FIRST_PRINCIPLES: Record<Topic, Beat[]> = {
  dinos: [
    {
      speech:
        "Wonder time with me — just curious, no right answer. What if a T-rex and a triceratops both wanted the same sunny rock? Why might sharing feel better than grabbing, and how could they take turns kindly?",
      choices: [
        { id: 'take-turns', emoji: '🔄', label: 'take turns' },
        { id: 'sit-together', emoji: '🤝', label: 'sit together' },
      ],
      firstPrinciples: true,
    },
    {
      speech:
        "Let's wonder together. How does a brachiosaurus know the high leaves are for stretching, not grabbing? What if being gentle with our long necks — and our friends — is the kindest way?",
      choices: [
        { id: 'gentle-neck', emoji: '🦕', label: 'gentle' },
        { id: 'kind-reach', emoji: '🍃', label: 'kind reach' },
      ],
      firstPrinciples: true,
    },
  ],
  forest: [
    {
      speech:
        "Wonder time — just curious. Why do you think the three little pigs were safer when they helped each other? What if kindness and strong bricks are both ways to care — how would you help a friend?",
      choices: [
        { id: 'help-friend', emoji: '🤝', label: 'help' },
        { id: 'build-strong', emoji: '🧱', label: 'build strong' },
      ],
      firstPrinciples: true,
    },
    {
      speech:
        "Come wonder with me. What if Little Red and Grandma feel warm because they share hugs and wait turns? Why might knocking politely feel kinder than rushing, and how can we practice?",
      choices: [
        { id: 'knock-kind', emoji: '🚪', label: 'knock kind' },
        { id: 'share-hug-fp', emoji: '💛', label: 'share hug' },
      ],
      firstPrinciples: true,
    },
  ],
  feelings: [
    {
      speech:
        "Wonder time — I'm curious with you. How do you know when your heart needs a hug? What if your tummy, tears, or smile are messengers — why might your body tell you first?",
      choices: [
        { id: 'tummy', emoji: '🫧', label: 'tummy' },
        { id: 'tears-smile', emoji: '💧', label: 'tears/smile' },
      ],
      firstPrinciples: true,
    },
    {
      speech:
        "Let's wonder softly. What if a brave breath and a kind smile are tools in the same toolbox? Why might naming a feeling help it feel smaller, and how could we practice together?",
      choices: [
        { id: 'name-feel', emoji: '🗣️', label: 'name it' },
        { id: 'breathe-feel', emoji: '😮‍💨', label: 'breathe' },
      ],
      firstPrinciples: true,
    },
  ],
  animals: [
    {
      speech:
        "Wonder time — just curious. What if the bunny and the puppy both wanted the same soft blanket? Why is sharing hard sometimes, and how could friends still be gentle?",
      choices: [
        { id: 'share-blanket', emoji: '🫂', label: 'share' },
        { id: 'take-turns-blanket', emoji: '🔄', label: 'turns' },
      ],
      firstPrinciples: true,
    },
    {
      speech:
        "Come wonder with me. How does a whale know when to sing soft under the waves? What if animal friends listen with their whole bodies — why might quiet listening be a kind of love?",
      choices: [
        { id: 'listen-soft', emoji: '👂', label: 'listen' },
        { id: 'sing-soft', emoji: '🎵', label: 'soft song' },
      ],
      firstPrinciples: true,
    },
  ],
  nature: [
    {
      speech:
        "Wonder time — let's think gently. Why do you think rain helps flowers grow? What if water is a drink for living things — how does the sun help after the rain?",
      choices: [
        { id: 'drink', emoji: '💧', label: 'drink' },
        { id: 'grow', emoji: '🌱', label: 'grow' },
      ],
      firstPrinciples: true,
    },
    {
      speech:
        "Let's wonder under the big sky. What if wind and rainbows are nature's way of saying hello after a storm? Why might change feel okay when the sky still holds us, and how do we notice it?",
      choices: [
        { id: 'notice-sky', emoji: '🌤️', label: 'notice' },
        { id: 'hello-sky', emoji: '🌈', label: 'hello' },
      ],
      firstPrinciples: true,
    },
  ],
  ice: [
    {
      speech:
        "Wonder time in the soft snow — just curious. What if the ice castle feels warm because friends share mittens and cocoa? Why might sharing keep winter hearts cozy, and how would you share?",
      choices: [
        { id: 'share-warm', emoji: '🧤', label: 'share' },
        { id: 'cozy-heart', emoji: '💛', label: 'cozy heart' },
      ],
      firstPrinciples: true,
    },
    {
      speech:
        "Come wonder with me. How does a snowflake know to land so gently? What if being careful on ice is a kind of kindness to our bodies — why might slow steps feel brave?",
      choices: [
        { id: 'gentle-step', emoji: '⛸️', label: 'gentle' },
        { id: 'brave-slow', emoji: '❄️', label: 'slow brave' },
      ],
      firstPrinciples: true,
    },
  ],
};

const SNACK_BEAT: Beat = {
  speech:
    "After play, we wash hands and ask Mommy or Daddy before any snack. Apples are a happy choice. Would you pick an apple with me, or a banana?",
  choices: [
    { id: 'apple', emoji: '🍎', label: 'apple' },
    { id: 'banana', emoji: '🍌', label: 'banana' },
  ],
  teachAllergy: true,
};

const WIND_DOWN: Beat = {
  speech:
    "What a lovely sitting — thank you for playing with me. We can visit animal friends, or walk in nature again. What sounds nice?",
  choices: [
    { id: 'animals', emoji: '🐰', label: 'animals' },
    { id: 'nature', emoji: '🌈', label: 'nature' },
  ],
};

const FAREWELL: Beat = {
  speech:
    "Bye-bye for now, Naomi. I loved our story time. If you want more, just say wake up or come back — I'm right here. Or go give Mommy or Daddy a warm hug. See you soon!",
  choices: [
    { id: 'hug', emoji: '🤗', label: 'hug' },
    { id: 'wave', emoji: '👋', label: 'wave' },
  ],
};

const DINO_NAME_RE =
  /\b(t-?rex|triceratops|stegosaurus|brachiosaurus|velociraptor)\b/i;

/** Disney / franchise names — detect only; never speak these in beats. */
const DISNEY_ICE_DETECT_RE =
  /\b(frozen|elsa|anna|olaf|arendelle|let\s*it\s*go)\b/i;

/** Story beats before first-principles for the default (dino-length) arc. */
export const STORY_BEAT_COUNT = DINO_BEATS.length;

/** Folklore forest arc length (pigs + red riding + classics). */
export const FOREST_BEAT_COUNT = FOREST_BEATS.length;

function topicBeats(topic: Topic): Beat[] {
  if (topic === 'dinos') return DINO_BEATS;
  if (topic === 'feelings') return FEELINGS_BEATS;
  if (topic === 'animals') return ANIMALS_BEATS;
  if (topic === 'nature') return NATURE_BEATS;
  if (topic === 'ice') return ICE_BEATS;
  return FOREST_BEATS;
}

/**
 * Every hardcoded picture pair in the catalog (greeting → topics → snack → wind-down → farewell).
 * Used by tests to prove variety + allergy scrub on labels/emoji.
 */
export function collectAllPicturePairs(): [PictureChoice, PictureChoice][] {
  const beats: Beat[] = [
    GREETING,
    ...DINO_BEATS,
    ...FOREST_BEATS,
    ...FEELINGS_BEATS,
    ...ANIMALS_BEATS,
    ...NATURE_BEATS,
    ...ICE_BEATS,
    ...Object.values(FIRST_PRINCIPLES).flat(),
    SNACK_BEAT,
    WIND_DOWN,
    FAREWELL,
  ];
  return beats.map((b) => b.choices);
}

/** All first-principles wonder speeches (for variety tests — never grades). */
export function firstPrinciplesSpeechCatalog(): string[] {
  return Object.values(FIRST_PRINCIPLES)
    .flat()
    .map((b) => b.speech);
}

/** All ice-topic speeches (assert no Disney character names). */
export function iceSpeechCatalog(): string[] {
  return [...ICE_BEATS, ...FIRST_PRINCIPLES.ice].map((b) => b.speech);
}

/** Folklore forest speeches (pigs / red riding / classics). */
export function forestSpeechCatalog(): string[] {
  return [...FOREST_BEATS, ...FIRST_PRINCIPLES.forest].map((b) => b.speech);
}

/** Deterministic pick so the same input yields the same wonder angle. */
function pickFirstPrinciples(topic: Topic, input: MindInput): Beat {
  const variants = FIRST_PRINCIPLES[topic];
  const key = `${input.pictureId ?? ''}|${(input.naomiSaid ?? '').toLowerCase()}|${input.turnIndex}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h + key.charCodeAt(i) * (i + 3)) % 10007;
  }
  return variants[h % variants.length];
}

/**
 * Detect topic from picture id and/or spoken words.
 * Ice keywords (incl. Frozen franchise words) route to original ice topic.
 * Folklore keywords route to forest. No forklift/truck topic.
 */
export function detectTopic(
  naomiSaid?: string,
  pictureId?: string,
): Topic | null {
  const id = (pictureId ?? '').toLowerCase();
  const said = (naomiSaid ?? '').toLowerCase();
  const blob = `${id} ${said}`;

  if (
    id === 'dinos' ||
    id === 'trex' ||
    id === 'stego' ||
    id === 'brachio' ||
    /\bdino|\bdinosaur|t-?rex|triceratops|stegosaurus|brachiosaurus|velociraptor\b/.test(
      blob,
    )
  ) {
    return 'dinos';
  }

  if (
    id === 'feelings' ||
    /\bfeelings?\b/.test(said) ||
    /\bfeelings?\b/.test(id)
  ) {
    return 'feelings';
  }

  // Ice / winter / snow-princess (original). Detect franchise words; never speak them.
  if (
    id === 'ice' ||
    id === 'ice-castle' ||
    id === 'snowflake' ||
    id === 'snow-fort' ||
    DISNEY_ICE_DETECT_RE.test(blob) ||
    /\bice\s*princess\b|\bsnow\s*queen\b|\bice\s*castle\b|\bsnow\b|\bwinter\b|\bmittens\b|\bsled\b/.test(
      blob,
    )
  ) {
    return 'ice';
  }

  if (
    id === 'animals' ||
    id === 'bunny' ||
    id === 'puppy' ||
    id === 'kitty' ||
    id === 'pony' ||
    /\banimals?\b|\bbunny|\bpuppy|\bkitty|\bpony|\bladybug|\bbutterfly|\bwhale|\bowl\b/.test(
      blob,
    )
  ) {
    return 'animals';
  }

  if (
    id === 'nature' ||
    id === 'sun' ||
    id === 'rain' ||
    id === 'rainbow' ||
    /\bnature\b|\brainbow\b|\bsun\b|\brain\b|\briver\b|\bhill\b/.test(blob)
  ) {
    return 'nature';
  }

  // Folklore / classic stories → forest (primary story ask)
  if (
    id === 'forest' ||
    id === 'stories' ||
    id === 'straw' ||
    id === 'sticks' ||
    id === 'cape' ||
    id === 'basket' ||
    id === 'grandma' ||
    /\bforest|folklore|story|stories|storytime|fairy\s*tale|befana|irish|celtic|fairy|moss|creek\b/.test(
      blob,
    ) ||
    /\bpigs?\b|\bwolf\b|\bred\s*riding|\bgrandma\b|\bgoldilocks\b|\bbeanstalk\b|\bthree\s*little\b/.test(
      blob,
    )
  ) {
    return 'forest';
  }

  return null;
}

function celebrate(
  naomiSaid?: string,
  pictureId?: string,
  topic?: Topic | null,
): string {
  const said = naomiSaid?.trim() ?? '';
  const dinoMatch = said.match(DINO_NAME_RE);
  if (dinoMatch) {
    return `Yes — ${dinoMatch[0]}! You remembered — I'm so proud! `;
  }
  if (pictureId) {
    if (topic === 'dinos') return 'Oh yes — that one! Roar-some! ';
    if (topic === 'feelings') return 'Thank you for sharing that with me. ';
    if (topic === 'animals') return 'What a sweet animal friend — I love it! ';
    if (topic === 'nature') return 'Nature is so lovely with you! ';
    if (topic === 'ice') return 'Snow-sparkle yes — so cozy with you! ';
    if (topic === 'forest') return 'What a wonderful story choice! ';
    return 'You picked that — wonderful choice! ';
  }
  if (said) {
    return 'I heard you. Thank you, sweetheart! ';
  }
  return '';
}

/**
 * Produce the next preschool turn. Always exactly two picture choices.
 * Arc: greeting → topic story beats → ONE first-principles → snack teach → wind-down.
 */
export function nextTurn(input: MindInput): MindTurn {
  const said = input.naomiSaid?.trim() ?? '';

  if (said && isHangupPhrase(said)) {
    return finalize(FAREWELL, said, input.topic ?? null);
  }

  // Hard local allergy interrupt — never continue a beat that treats nuts as food.
  if (shouldHardAllergyInterrupt(said)) {
    const interrupt = buildAllergyInterruptTurn(said);
    return {
      ...interrupt,
      topic: input.topic ?? null,
    };
  }

  if (!input.greeted || input.turnIndex <= 0) {
    return finalize(GREETING, said, null);
  }

  const detected = detectTopic(said, input.pictureId);
  const topic: Topic = detected ?? input.topic ?? 'forest';

  // turnIndex 1 = first post-greeting response → story beat 0
  const phase = Math.max(0, input.turnIndex - 1);
  const beats = topicBeats(topic);

  let beat: Beat;
  if (phase < beats.length) {
    beat = beats[phase];
  } else if (phase === beats.length) {
    beat = pickFirstPrinciples(topic, input);
  } else if (phase === beats.length + 1) {
    beat = SNACK_BEAT;
  } else {
    beat = WIND_DOWN;
  }

  const prefix = celebrate(said, input.pictureId, topic);
  return finalize(
    {
      ...beat,
      speech: prefix + beat.speech,
    },
    said,
    topic,
  );
}

/**
 * Allergy-scrub labels/emoji, then lock exactly two huge choices for the UI.
 * Defense-in-depth with PictureChoices (which re-filters before render).
 */
function finalize(
  beat: Beat,
  naomiSaid: string,
  topic: Topic | null,
): MindTurn {
  const includeTeach =
    !!beat.teachAllergy ||
    (beat.speech.toLowerCase().includes('snack') && Math.random() < 0.35);

  let speech = filterSpeechText(beat.speech, {
    includeTeachLine: includeTeach,
  });

  if (beat.teachAllergy && !speech.includes('Nuts make Naomi sick')) {
    speech = `${speech} ${getAllergyTeachLine()}`;
  }

  const choices = filterPictureChoices([...beat.choices]);
  if (choices.length < 2) {
    choices.push(
      { id: 'safe-a', emoji: '🌸', label: 'flower' },
      { id: 'safe-b', emoji: '☁️', label: 'cloud' },
    );
  }

  const two = choices.slice(0, 2) as [PictureChoice, PictureChoice];

  return {
    speech,
    captions: {
      naomi: naomiSaid || undefined,
      luce: speech,
    },
    twoPictureChoices: two,
    topic,
  };
}
