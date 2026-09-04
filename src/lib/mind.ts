/**
 * Lightweight preschool mind — greeting, short story beat, one question.
 * Returns speech, captions, and exactly two picture choices.
 * Allergy filter applied before any food-related labels leave this module.
 */

import {
  filterPictureChoices,
  filterSpeechText,
  getAllergyTeachLine,
  type PictureChoice,
} from './allergyFilter';

export type MindTurn = {
  speech: string;
  captions: { naomi?: string; luce: string };
  twoPictureChoices: [PictureChoice, PictureChoice];
};

export type MindInput = {
  /** Kid utterance or picture label */
  naomiSaid?: string;
  /** Picture choice id if she tapped */
  pictureId?: string;
  turnIndex: number;
  /** Session already greeted */
  greeted?: boolean;
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
};

const GREETING: Beat = {
  speech:
    "Hi Naomi! I'm Luce. I'm so glad you're here. Shall we visit dinosaurs, or a cozy forest story?",
  choices: [
    { id: 'dinos', emoji: '🦖', label: 'dinosaurs' },
    { id: 'forest', emoji: '🌲', label: 'forest story' },
  ],
};

const BEATS: Beat[] = [
  {
    speech:
      'A gentle triceratops munched leafy plants by a warm river. She liked slow steps and sunny rocks. What should she look at next — the big moon, or a friend brachiosaurus?',
    choices: [
      { id: 'moon', emoji: '🌙', label: 'moon' },
      { id: 'brachio', emoji: '🦕', label: 'brachiosaurus' },
    ],
  },
  {
    speech:
      'In a soft Italian night, La Befana flew on her broom with kindness, never scare. She peeked at cozy windows. Should we follow her to the village, or wave hello to the stars?',
    choices: [
      { id: 'village', emoji: '🏘️', label: 'village' },
      { id: 'stars', emoji: '⭐', label: 'stars' },
    ],
  },
  {
    speech:
      'A little velociraptor practiced careful feet in the tall grass. Counting helps: one, two, three. Do you want to count eggs, or roar like a T-rex?',
    choices: [
      { id: 'eggs', emoji: '🥚', label: 'count eggs' },
      { id: 'roar', emoji: '🦖', label: 'T-rex roar' },
    ],
  },
  {
    speech:
      'After play, we wash hands and ask Mommy or Daddy before any snack. Apples are a happy choice. Would you pick an apple, or a banana?',
    choices: [
      { id: 'apple', emoji: '🍎', label: 'apple' },
      { id: 'banana', emoji: '🍌', label: 'banana' },
    ],
    teachAllergy: true,
  },
  {
    speech:
      'An Irish hillside held soft green moss and a tiny friendly light — never spooky. The light danced near a creek. Shall we splash in the creek, or rest on the moss?',
    choices: [
      { id: 'creek', emoji: '💧', label: 'creek' },
      { id: 'moss', emoji: '🌿', label: 'moss' },
    ],
  },
];

const FAREWELL: Beat = {
  speech: 'Bye-bye, Naomi. I loved our story time. Go give Mommy or Daddy a big hug. See you soon!',
  choices: [
    { id: 'hug', emoji: '🤗', label: 'hug' },
    { id: 'wave', emoji: '👋', label: 'wave' },
  ],
};

function celebrate(naomiSaid?: string, pictureId?: string): string {
  if (pictureId) {
    return `You picked that — wonderful! `;
  }
  if (naomiSaid && naomiSaid.trim()) {
    return `I heard you. Thank you! `;
  }
  return '';
}

/**
 * Produce the next preschool turn. Always exactly two picture choices.
 */
export function nextTurn(input: MindInput): MindTurn {
  const said = input.naomiSaid?.trim() ?? '';

  if (said && isHangupPhrase(said)) {
    return finalize(FAREWELL, said);
  }

  if (!input.greeted || input.turnIndex <= 0) {
    return finalize(GREETING, said);
  }

  const beat = BEATS[(input.turnIndex - 1) % BEATS.length];
  const prefix = celebrate(said, input.pictureId);
  return finalize(
    {
      ...beat,
      speech: prefix + beat.speech,
    },
    said,
  );
}

function finalize(beat: Beat, naomiSaid: string): MindTurn {
  const includeTeach =
    !!beat.teachAllergy || (beat.speech.toLowerCase().includes('snack') && Math.random() < 0.35);

  let speech = filterSpeechText(beat.speech, {
    includeTeachLine: includeTeach,
  });

  // Ensure teach line can appear occasionally on snack beat even if random missed
  if (beat.teachAllergy && !speech.includes('Nuts make Naomi sick')) {
    speech = `${speech} ${getAllergyTeachLine()}`;
  }

  const choices = filterPictureChoices(beat.choices);
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
  };
}
