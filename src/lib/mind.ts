/**
 * Lightweight preschool mind — warm teacher voice, short beats, topic branches.
 * Greeting offers talk OR two pictures; ~8 min arc ends with one first-principles
 * wonder (why/how/what if variants), never a quiz grade. Always exactly two pictures.
 * Topics span stories / nature / feelings / animals (plus dinos).
 * Allergy filter wraps food labels before anything leaves this module.
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

/** Preschool topic branches — stories map to forest folklore. */
export type Topic = 'dinos' | 'forest' | 'feelings' | 'animals' | 'nature';

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

/** Default greeting pictures: dinosaurs / forest-or-folklore. Talk unlocks animals, nature, feelings, stories. */
const GREETING: Beat = {
  // Short for ~3yo attention: name + sit invite + two pictures + talk unlocks.
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

/** Cozy folklore / stories (Italian La Befana + soft Irish light — never scary). */
const FOREST_BEATS: Beat[] = [
  {
    speech:
      "Come with me into the cozy forest. Soft moss under our toes — shh, it's friendly here. Shall we follow a tiny sparkle light, or listen for gentle birds?",
    choices: [
      { id: 'light', emoji: '✨', label: 'sparkle' },
      { id: 'birds', emoji: '🐦', label: 'birds' },
    ],
  },
  {
    speech:
      "On a soft Italian night, kind La Befana flies with care — never scary. She peeks at cozy windows. Want to follow her to the village, or wave to the stars with me?",
    choices: [
      { id: 'village', emoji: '🏘️', label: 'village' },
      { id: 'stars', emoji: '⭐', label: 'stars' },
    ],
  },
  {
    speech:
      "An Irish hillside holds green moss and a gentle creek — never spooky. The little light dances hello. Splash in the creek together, or rest on the soft moss?",
    choices: [
      { id: 'creek', emoji: '💧', label: 'creek' },
      { id: 'moss', emoji: '🌿', label: 'moss' },
    ],
  },
  {
    speech:
      "La Befana leaves a warm smile, and the Irish light blinks hello to you. We can gather soft flowers, or tell the trees a sweet good night.",
    choices: [
      { id: 'flowers', emoji: '🌸', label: 'flowers' },
      { id: 'trees', emoji: '🌳', label: 'trees' },
    ],
  },
  {
    speech:
      "Story time hush — we made a tiny folklore nest of kindness. Hold a story hug with me, or blow a quiet wind kiss?",
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

/** Friendly everyday animals — soft, never scary, short 3yo labels. */
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

/** Nature walk — sun, rain, river, rainbow; short labels, huge emoji. */
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
        "Wonder time — just curious. Why do you think La Befana and the Irish light both love cozy homes? What if kindness is what makes a home feel warm — how would you show it?",
      choices: [
        { id: 'warmth', emoji: '🏠', label: 'warmth' },
        { id: 'love', emoji: '💛', label: 'love' },
      ],
      firstPrinciples: true,
    },
    {
      speech:
        "Come wonder with me. What if the soft moss and the little creek are friends because they share the hillside? Why might sharing space feel peaceful, and how can we be gentle guests in a forest?",
      choices: [
        { id: 'share-space', emoji: '🌿', label: 'share' },
        { id: 'gentle-guest', emoji: '🕊️', label: 'gentle' },
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
    "Bye-bye, Naomi. I loved our story time so much. Go give Mommy or Daddy a big warm hug. See you soon!",
  choices: [
    { id: 'hug', emoji: '🤗', label: 'hug' },
    { id: 'wave', emoji: '👋', label: 'wave' },
  ],
};

const DINO_NAME_RE =
  /\b(t-?rex|triceratops|stegosaurus|brachiosaurus|velociraptor)\b/i;

/** Story beats before the single first-principles question (~5 min book-like). */
export const STORY_BEAT_COUNT = DINO_BEATS.length;

function topicBeats(topic: Topic): Beat[] {
  if (topic === 'dinos') return DINO_BEATS;
  if (topic === 'feelings') return FEELINGS_BEATS;
  if (topic === 'animals') return ANIMALS_BEATS;
  if (topic === 'nature') return NATURE_BEATS;
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
 * Greeting pictures: dinos | forest; talk may also say animals/nature/stories/feelings.
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
    // Avoid stealing forest "creek" / generic water — nature ids + explicit words only above
    return 'nature';
  }

  if (
    id === 'forest' ||
    id === 'stories' ||
    /\bforest|folklore|story|stories|befana|irish|celtic|fairy|moss|creek\b/.test(
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
    return 'You picked that — wonderful choice! ';
  }
  if (said) {
    return 'I heard you. Thank you, sweetheart! ';
  }
  return '';
}

/**
 * Produce the next preschool turn. Always exactly two picture choices.
 * Arc: greeting → topic story beats (~5) → ONE first-principles → snack teach → wind-down.
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
