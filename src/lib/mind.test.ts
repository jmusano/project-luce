import { describe, expect, it } from 'vitest';
import {
  containsTreeNutFood,
  filterPictureChoices,
  getAllergyTeachLine,
  type PictureChoice,
} from './allergyFilter';
import {
  collectAllPicturePairs,
  detectTopic,
  isHangupPhrase,
  nextTurn,
  STORY_BEAT_COUNT,
} from './mind';

describe('isHangupPhrase (mind re-export)', () => {
  it('matches locked hangup phrases including kid "I am going later"', () => {
    expect(isHangupPhrase('bye')).toBe(true);
    expect(isHangupPhrase('bye-bye')).toBe(true);
    expect(isHangupPhrase('goodbye')).toBe(true);
    expect(isHangupPhrase('see you later')).toBe(true);
    expect(isHangupPhrase("I'm going later")).toBe(true);
    expect(isHangupPhrase('im going later')).toBe(true);
    expect(isHangupPhrase('I am going later')).toBe(true);
    expect(isHangupPhrase('Bye Bye!')).toBe(true);
    expect(isHangupPhrase('night-night')).toBe(true);
    expect(isHangupPhrase('see ya')).toBe(true);
    expect(isHangupPhrase('I gotta go')).toBe(true);
  });

  it('does not hang up on ordinary play talk', () => {
    expect(isHangupPhrase('dinosaurs')).toBe(false);
    expect(isHangupPhrase('T-rex')).toBe(false);
  });
});

describe('detectTopic', () => {
  it('detects dinos from picture or speech', () => {
    expect(detectTopic(undefined, 'dinos')).toBe('dinos');
    expect(detectTopic('dinosaurs please')).toBe('dinos');
    expect(detectTopic('triceratops!')).toBe('dinos');
  });

  it('detects forest/folklore/stories and feelings', () => {
    expect(detectTopic(undefined, 'forest')).toBe('forest');
    expect(detectTopic('forest story')).toBe('forest');
    expect(detectTopic('La Befana')).toBe('forest');
    expect(detectTopic('stories')).toBe('forest');
    expect(detectTopic(undefined, 'stories')).toBe('forest');
    expect(detectTopic('feelings')).toBe('feelings');
    expect(detectTopic(undefined, 'feelings')).toBe('feelings');
  });

  it('detects animals and nature from picture or speech', () => {
    expect(detectTopic(undefined, 'animals')).toBe('animals');
    expect(detectTopic('animals please')).toBe('animals');
    expect(detectTopic('bunny!')).toBe('animals');
    expect(detectTopic('puppy')).toBe('animals');
    expect(detectTopic(undefined, 'nature')).toBe('nature');
    expect(detectTopic('nature walk')).toBe('nature');
    expect(detectTopic('rainbow')).toBe('nature');
  });
});

describe('picture-choice variety catalog', () => {
  it('exposes many exactly-two pairs across dinos/forest/feelings/animals/nature', () => {
    const pairs = collectAllPicturePairs();
    // greeting + 5 topics×5 beats + 5 first-principles + snack + wind-down + farewell
    expect(pairs.length).toBeGreaterThanOrEqual(30);
    for (const pair of pairs) {
      expect(pair).toHaveLength(2);
      expect(pair[0].emoji.length).toBeGreaterThan(0);
      expect(pair[1].emoji.length).toBeGreaterThan(0);
      // short ~3yo labels
      expect(pair[0].label.length).toBeGreaterThan(0);
      expect(pair[0].label.length).toBeLessThanOrEqual(16);
      expect(pair[1].label.length).toBeGreaterThan(0);
      expect(pair[1].label.length).toBeLessThanOrEqual(16);
    }
    const labels = pairs.flat().map((c) => c.label.toLowerCase());
    expect(labels).toEqual(expect.arrayContaining(['dinosaurs', 'bunny', 'puppy', 'sun', 'rainbow']));
    expect(labels.some((l) => /forest|story|sparkle|befana|village/i.test(l) || l === 'sparkle' || l === 'village')).toBe(
      true,
    );
    expect(labels).toEqual(expect.arrayContaining(['happy', 'heart', 'animals', 'nature']));
  });

  it('never lets nut labels or peanut emoji survive filter on catalog or injected nuts', () => {
    const pairs = collectAllPicturePairs();
    for (const pair of pairs) {
      const safe = filterPictureChoices([...pair]);
      expect(safe).toHaveLength(2);
      for (const c of safe) {
        expect(containsTreeNutFood(c.label)).toBe(false);
        expect(containsTreeNutFood(c.id)).toBe(false);
        expect(c.emoji).not.toBe('🥜');
        expect(c.label.toLowerCase()).not.toMatch(
          /peanut|almond|cashew|walnut|pecan|hazelnut|pistachio|\bnuts?\b/,
        );
      }
    }

    const injected: PictureChoice[] = [
      { id: 'bad-a', emoji: '🥜', label: 'peanuts' },
      { id: 'bad-b', emoji: '🍪', label: 'almond butter' },
    ];
    const scrubbed = filterPictureChoices(injected);
    expect(scrubbed).toHaveLength(2);
    for (const c of scrubbed) {
      expect(containsTreeNutFood(c.label)).toBe(false);
      expect(c.emoji).not.toBe('🥜');
      expect(c.label.toLowerCase()).not.toMatch(/peanut|almond|cashew|walnut|nut/);
    }
  });
});

describe('nextTurn', () => {
  it('greets with exactly two topic pictures (dinos / forest)', () => {
    const turn = nextTurn({ turnIndex: 0, greeted: false });
    expect(turn.twoPictureChoices).toHaveLength(2);
    expect(turn.twoPictureChoices[0].id).toBe('dinos');
    expect(turn.twoPictureChoices[1].id).toBe('forest');
    expect(turn.speech.toLowerCase()).toMatch(/dinosaur|forest|animals|nature|feelings/);
    expect(turn.topic).toBeNull();
    expect(turn.captions.luce).toBe(turn.speech);
  });

  it('branches into dino beats with real names after she picks dinos', () => {
    const turn = nextTurn({
      turnIndex: 1,
      greeted: true,
      pictureId: 'dinos',
      naomiSaid: 'dinosaurs',
    });
    expect(turn.topic).toBe('dinos');
    expect(turn.twoPictureChoices).toHaveLength(2);
    const blob = turn.speech.toLowerCase();
    expect(blob).toMatch(/triceratops|stegosaurus|brachiosaurus|t-rex|velociraptor/);
    expect(blob).not.toMatch(/cretaceous|jurassic period|extinction event|encyclopedia/);
  });

  it('branches into forest/folklore with light Italian or Irish notes', () => {
    const turn = nextTurn({
      turnIndex: 1,
      greeted: true,
      pictureId: 'forest',
      naomiSaid: 'forest story',
    });
    expect(turn.topic).toBe('forest');
    // Later forest beats mention Befana / Irish; early beat is cozy forest join-play
    const later = nextTurn({
      turnIndex: 2,
      greeted: true,
      topic: 'forest',
      pictureId: 'light',
      naomiSaid: 'sparkle',
    });
    expect(later.speech).toMatch(/Befana|Irish/i);
  });

  it('branches into animals with soft 3yo picture pairs', () => {
    const turn = nextTurn({
      turnIndex: 1,
      greeted: true,
      pictureId: 'animals',
      naomiSaid: 'animals',
    });
    expect(turn.topic).toBe('animals');
    expect(turn.twoPictureChoices).toHaveLength(2);
    expect(turn.twoPictureChoices.map((c) => c.label.toLowerCase())).toEqual(
      expect.arrayContaining(['bunny', 'puppy']),
    );
    expect(turn.speech.toLowerCase()).toMatch(/bunny|puppy|animal/);
  });

  it('branches into nature with short sun/rain style pairs', () => {
    const turn = nextTurn({
      turnIndex: 1,
      greeted: true,
      pictureId: 'nature',
      naomiSaid: 'nature',
    });
    expect(turn.topic).toBe('nature');
    expect(turn.twoPictureChoices).toHaveLength(2);
    expect(turn.twoPictureChoices.map((c) => c.id)).toEqual(
      expect.arrayContaining(['sun', 'rain']),
    );
    expect(turn.speech.toLowerCase()).toMatch(/sun|rain|nature/);
  });

  it('asks exactly one first-principles style question after the story arc', () => {
    const fpIndex = STORY_BEAT_COUNT + 1; // turnIndex after greeting + N story beats
    const turn = nextTurn({
      turnIndex: fpIndex,
      greeted: true,
      topic: 'dinos',
      naomiSaid: 'tiny roar',
      pictureId: 'roar',
    });
    expect(turn.speech.toLowerCase()).toMatch(/what if|why |how /);
    expect(turn.speech.toLowerCase()).not.toMatch(/quiz|grade|score|correct answer/);
    expect(turn.twoPictureChoices).toHaveLength(2);
  });

  it('hard-interrupts when Naomi mentions nut food (does not continue story beat)', () => {
    const turn = nextTurn({
      turnIndex: 2,
      greeted: true,
      topic: 'dinos',
      naomiSaid: 'I want peanuts',
    });
    expect(turn.speech).toContain(getAllergyTeachLine());
    expect(turn.speech.toLowerCase()).toMatch(/sick|don't eat/);
    // Must not slip into the normal dino celebration / next beat
    expect(turn.speech.toLowerCase()).not.toMatch(/roar-some|triceratops|stegosaurus/);
    expect(turn.twoPictureChoices).toHaveLength(2);
    for (const c of turn.twoPictureChoices) {
      expect(containsTreeNutFood(c.label)).toBe(false);
      expect(c.emoji).not.toBe('🥜');
    }
    expect(turn.topic).toBe('dinos');
  });

  it('includes allergy teach line on the snack beat and filters food labels', () => {
    const snackIndex = STORY_BEAT_COUNT + 2;
    const turn = nextTurn({
      turnIndex: snackIndex,
      greeted: true,
      topic: 'dinos',
      naomiSaid: 'take turns',
    });
    expect(turn.speech).toContain(getAllergyTeachLine());
    expect(turn.twoPictureChoices.map((c) => c.label.toLowerCase()).join(' ')).not.toMatch(
      /peanut|almond|cashew|walnut|pecan|hazelnut|pistachio/,
    );
    expect(turn.twoPictureChoices).toHaveLength(2);
  });

  it('farewells on hangup without changing hangup detection', () => {
    const turn = nextTurn({
      turnIndex: 3,
      greeted: true,
      topic: 'dinos',
      naomiSaid: 'bye-bye',
    });
    expect(turn.speech.toLowerCase()).toMatch(/bye-bye|see you soon/);
    expect(turn.twoPictureChoices).toHaveLength(2);
  });

  it('celebrates when she says a real dino name', () => {
    const turn = nextTurn({
      turnIndex: 2,
      greeted: true,
      topic: 'dinos',
      naomiSaid: 'stegosaurus',
    });
    expect(turn.speech).toMatch(/stegosaurus/i);
    expect(turn.speech).toMatch(/remembered/i);
  });

  it('always returns exactly two picture choices every turn', () => {
    const topics = ['feelings', 'animals', 'nature', 'dinos', 'forest'] as const;
    for (const topic of topics) {
      for (let i = 0; i <= STORY_BEAT_COUNT + 3; i++) {
        const turn = nextTurn({
          turnIndex: i,
          greeted: i > 0,
          topic: i > 0 ? topic : null,
          naomiSaid: i === 0 ? undefined : 'hello',
          pictureId: i === 1 ? topic : undefined,
        });
        expect(turn.twoPictureChoices).toHaveLength(2);
        expect(turn.twoPictureChoices[0].label.length).toBeGreaterThan(0);
        expect(turn.twoPictureChoices[1].label.length).toBeGreaterThan(0);
        for (const c of turn.twoPictureChoices) {
          expect(containsTreeNutFood(c.label)).toBe(false);
        }
      }
    }
  });
});
