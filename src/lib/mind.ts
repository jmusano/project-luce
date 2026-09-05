/**
 * Lightweight preschool mind — soft teacher voice, short beats, topic branches.
 * Greeting offers talk OR two pictures; ~8 min arc ends with one first-principles
 * question (why/how/what if), never a quiz grade. Always exactly two picture choices.
 * Allergy filter wraps food labels before anything leaves this module.
 */

import {
  filterPictureChoices,
  filterSpeechText,
  getAllergyTeachLine,
  type PictureChoice,
} from './allergyFilter';

export type Topic = 'dinos' | 'forest' | 'feelings';

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

const GOODBYE_RE =
  /\b(bye-bye|goodbye|good bye|bye|see you later|i'?m going later|im going later)\b/i;

export function isHangupPhrase(text: string): boolean {
  return GOODBYE_RE.test(text.trim());
}

type Beat = {
  speech: string;
  choices: [PictureChoice, PictureChoice];
  teachAllergy?: boolean;
  /** Mark the single first-principles beat near end of the arc */
  firstPrinciples?: boolean;
};

/** Default greeting pictures: dinosaurs / forest-or-folklore. Talk can also ask for stories or feelings. */
const GREETING: Beat = {
  speech:
    "Hi Naomi! I'm Luce. I'm so happy to play with you. Want dinosaurs, or a cozy forest story? You can tap a picture or just tell me — stories or feelings work too.",
  choices: [
    { id: 'dinos', emoji: '🦖', label: 'dinosaurs' },
    { id: 'forest', emoji: '🌲', label: 'forest story' },
  ],
};

const DINO_BEATS: Beat[] = [
  {
    speech:
      'Ooh, dinosaurs! Let\'s tiptoe with a gentle triceratops. She likes sunny rocks. Should we count three rocks, or say hi to a stegosaurus?',
    choices: [
      { id: 'rocks', emoji: '🪨', label: 'count rocks' },
      { id: 'stego', emoji: '🦕', label: 'stegosaurus' },
    ],
  },
  {
    speech:
      'Stomp-stomp — a friendly brachiosaurus stretches up to the leaves. Soft neck, soft feet. Want to munch pretend leaves, or roar like a T-rex?',
    choices: [
      { id: 'leaves', emoji: '🍃', label: 'leaves' },
      { id: 'trex', emoji: '🦖', label: 'T-rex' },
    ],
  },
  {
    speech:
      'A little velociraptor practices careful feet in the tall grass. One, two, three. Shall we count eggs, or splash in a warm puddle?',
    choices: [
      { id: 'eggs', emoji: '🥚', label: 'count eggs' },
      { id: 'puddle', emoji: '💧', label: 'puddle' },
    ],
  },
  {
    speech:
      'We found a triceratops and a stegosaurus sharing shade. No scares — just friends. Peek at the moon with them, or follow a brachiosaurus path?',
    choices: [
      { id: 'moon', emoji: '🌙', label: 'moon' },
      { id: 'path', emoji: '🛤️', label: 'dino path' },
    ],
  },
  {
    speech:
      'T-rex is practicing a tiny happy roar — not too loud. Velociraptor claps her feet. Want a tiny roar together, or a quiet stretch?',
    choices: [
      { id: 'roar', emoji: '📣', label: 'tiny roar' },
      { id: 'stretch', emoji: '🧘', label: 'stretch' },
    ],
  },
];

const FOREST_BEATS: Beat[] = [
  {
    speech:
      'Into the cozy forest we go. Soft moss under our toes. Shall we follow a tiny friendly light, or listen for birds?',
    choices: [
      { id: 'light', emoji: '✨', label: 'friendly light' },
      { id: 'birds', emoji: '🐦', label: 'birds' },
    ],
  },
  {
    speech:
      'On a soft Italian night, kind La Befana flies with care — never scary. She peeks at cozy windows. Follow her to the village, or wave to the stars?',
    choices: [
      { id: 'village', emoji: '🏘️', label: 'village' },
      { id: 'stars', emoji: '⭐', label: 'stars' },
    ],
  },
  {
    speech:
      'An Irish hillside holds green moss and a gentle creek — never spooky. The little light dances. Splash in the creek, or rest on the moss?',
    choices: [
      { id: 'creek', emoji: '💧', label: 'creek' },
      { id: 'moss', emoji: '🌿', label: 'moss' },
    ],
  },
  {
    speech:
      'La Befana leaves a warm smile, and the Irish light blinks hello. We can gather soft flowers, or tell the trees good night.',
    choices: [
      { id: 'flowers', emoji: '🌸', label: 'flowers' },
      { id: 'trees', emoji: '🌳', label: 'trees' },
    ],
  },
  {
    speech:
      'Story time hush: we made a tiny folklore nest of kindness. Hold a story hug, or blow a quiet wind kiss?',
    choices: [
      { id: 'hug', emoji: '🤗', label: 'story hug' },
      { id: 'wind', emoji: '🌬️', label: 'wind kiss' },
    ],
  },
];

const FEELINGS_BEATS: Beat[] = [
  {
    speech:
      'Feelings time. Sometimes our hearts feel big and sunny. Is your heart feeling happy, or a little quiet today?',
    choices: [
      { id: 'happy', emoji: '☀️', label: 'happy' },
      { id: 'quiet', emoji: '🌙', label: 'quiet' },
    ],
  },
  {
    speech:
      'When we feel wiggly, a soft stretch helps. Want to stretch tall like a tree, or curl small like a seed?',
    choices: [
      { id: 'tall', emoji: '🌲', label: 'stretch tall' },
      { id: 'seed', emoji: '🌱', label: 'curl small' },
    ],
  },
  {
    speech:
      'Mommy and Daddy love your feelings. We can send them a heart, or a gentle wave.',
    choices: [
      { id: 'heart', emoji: '💛', label: 'heart' },
      { id: 'wave', emoji: '👋', label: 'wave' },
    ],
  },
  {
    speech:
      'Brave and kind can sit together. Shall we practice a brave breath, or a kind smile?',
    choices: [
      { id: 'breath', emoji: '😮‍💨', label: 'brave breath' },
      { id: 'smile', emoji: '😊', label: 'kind smile' },
    ],
  },
  {
    speech:
      'Our feelings nest is cozy. Hold a soft hug for yourself, or share a hug with Mommy or Daddy later?',
    choices: [
      { id: 'self-hug', emoji: '🤗', label: 'soft hug' },
      { id: 'share-hug', emoji: '👪', label: 'share hug' },
    ],
  },
];

const FIRST_PRINCIPLES: Record<Topic, Beat> = {
  dinos: {
    speech:
      'Hmm… what if a T-rex and a triceratops both wanted the same sunny rock — how could they share it kindly?',
    choices: [
      { id: 'take-turns', emoji: '🔄', label: 'take turns' },
      { id: 'sit-together', emoji: '🤝', label: 'sit together' },
    ],
    firstPrinciples: true,
  },
  forest: {
    speech:
      'Why do you think La Befana and the Irish light both love cozy homes? What makes a home feel kind?',
    choices: [
      { id: 'warmth', emoji: '🏠', label: 'warmth' },
      { id: 'love', emoji: '💛', label: 'love' },
    ],
    firstPrinciples: true,
  },
  feelings: {
    speech:
      'How do you know when your heart needs a hug — what does your body tell you?',
    choices: [
      { id: 'tummy', emoji: '🫧', label: 'tummy feels' },
      { id: 'tears-smile', emoji: '💧', label: 'tears or smile' },
    ],
    firstPrinciples: true,
  },
};

const SNACK_BEAT: Beat = {
  speech:
    'After play, we wash hands and ask Mommy or Daddy before any snack. Apples are a happy choice. Would you pick an apple, or a banana?',
  choices: [
    { id: 'apple', emoji: '🍎', label: 'apple' },
    { id: 'banana', emoji: '🍌', label: 'banana' },
  ],
  teachAllergy: true,
};

const WIND_DOWN: Beat = {
  speech:
    'What a lovely sitting. We can play dinosaurs again, or rest with a forest hush. What sounds nice?',
  choices: [
    { id: 'dinos', emoji: '🦖', label: 'dinosaurs' },
    { id: 'forest', emoji: '🌲', label: 'forest hush' },
  ],
};

const FAREWELL: Beat = {
  speech:
    'Bye-bye, Naomi. I loved our story time. Go give Mommy or Daddy a big hug. See you soon!',
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
  return FOREST_BEATS;
}

/**
 * Detect topic from picture id and/or spoken words.
 * Greeting pictures: dinos | forest; talk may also say stories/feelings/dino names.
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
    return `Yes — ${dinoMatch[0]}! You remembered! `;
  }
  if (pictureId) {
    if (topic === 'dinos') return 'You picked that — roar-some! ';
    if (topic === 'feelings') return 'Thank you for sharing that. ';
    return 'You picked that — wonderful! ';
  }
  if (said) {
    return 'I heard you. Thank you! ';
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
    beat = FIRST_PRINCIPLES[topic];
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
