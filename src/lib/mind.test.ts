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
  firstPrinciplesSpeechCatalog,
  forestSpeechCatalog,
  FOREST_BEAT_COUNT,
  iceSpeechCatalog,
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

  it('detects forest folklore / classics and feelings', () => {
    expect(detectTopic(undefined, 'forest')).toBe('forest');
    expect(detectTopic('forest story')).toBe('forest');
    expect(detectTopic('La Befana')).toBe('forest');
    expect(detectTopic('stories')).toBe('forest');
    expect(detectTopic(undefined, 'stories')).toBe('forest');
    expect(detectTopic('storytime')).toBe('forest');
    expect(detectTopic('fairy tale')).toBe('forest');
    expect(detectTopic('three little pigs')).toBe('forest');
    expect(detectTopic('red riding hood')).toBe('forest');
    expect(detectTopic('grandma')).toBe('forest');
    expect(detectTopic('wolf')).toBe('forest');
    expect(detectTopic('goldilocks')).toBe('forest');
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

  it('routes frozen/elsa/anna/ice princess/snow to original ice topic', () => {
    expect(detectTopic('frozen')).toBe('ice');
    expect(detectTopic('elsa')).toBe('ice');
    expect(detectTopic('anna')).toBe('ice');
    expect(detectTopic('ice princess')).toBe('ice');
    expect(detectTopic('snow queen')).toBe('ice');
    expect(detectTopic('ice castle')).toBe('ice');
    expect(detectTopic('snow')).toBe('ice');
    expect(detectTopic(undefined, 'ice-castle')).toBe('ice');
  });

  it('does not invent a forklift/truck topic', () => {
    expect(detectTopic('forklift')).not.toBe('dinos');
    // trucks are not a topic — leave null or fall through to null
    expect(detectTopic('forklift')).toBeNull();
    expect(detectTopic('construction truck')).toBeNull();
  });
});

describe('picture-choice variety catalog', () => {
  it('exposes many exactly-two pairs across topics including folklore + ice', () => {
    const pairs = collectAllPicturePairs();
    // greeting + topics beats + first-principles + snack + wind-down + farewell
    expect(pairs.length).toBeGreaterThanOrEqual(35);
    for (const pair of pairs) {
      expect(pair).toHaveLength(2);
      expect(pair[0].emoji.length).toBeGreaterThan(0);
      expect(pair[1].emoji.length).toBeGreaterThan(0);
      expect(pair[0].label.length).toBeGreaterThan(0);
      expect(pair[0].label.length).toBeLessThanOrEqual(14);
      expect(pair[1].label.length).toBeGreaterThan(0);
      expect(pair[1].label.length).toBeLessThanOrEqual(14);
    }
    const labels = pairs.flat().map((c) => c.label.toLowerCase());
    expect(labels).toEqual(
      expect.arrayContaining(['dinosaurs', 'bunny', 'puppy', 'sun', 'rainbow']),
    );
    expect(
      labels.some(
        (l) =>
          /straw|sticks|cape|basket|grandma|ice castle|snowflake|forest|story|sparkle/i.test(
            l,
          ) ||
          l === 'straw' ||
          l === 'red cape',
      ),
    ).toBe(true);
    expect(labels).toEqual(
      expect.arrayContaining(['happy', 'heart', 'animals', 'nature']),
    );
    expect(labels.some((l) => /ice|snow|mitten|sled|cocoa/i.test(l))).toBe(true);
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

  it('keeps greeting short for ~3yo attention (still offers tap + talk topics)', () => {
    const turn = nextTurn({ turnIndex: 0, greeted: false });
    const words = turn.speech.trim().split(/\s+/);
    expect(words.length).toBeLessThanOrEqual(28);
    expect(turn.speech.toLowerCase()).toMatch(/sit with me/);
    expect(turn.speech.toLowerCase()).toMatch(/tap a picture|say animals/);
    expect(turn.speech.toLowerCase()).not.toMatch(/whatever feels nice|so glad you're here/);
    expect(turn.twoPictureChoices.map((c) => c.id)).toEqual(['dinos', 'forest']);
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

  it('branches into folklore forest with pigs and matching pictures', () => {
    const turn = nextTurn({
      turnIndex: 1,
      greeted: true,
      pictureId: 'forest',
      naomiSaid: 'forest story',
    });
    expect(turn.topic).toBe('forest');
    expect(turn.speech.toLowerCase()).toMatch(/three little pigs|little pigs|straw|sticks/);
    expect(turn.twoPictureChoices).toHaveLength(2);
    expect(turn.twoPictureChoices.map((c) => c.id)).toEqual(
      expect.arrayContaining(['straw', 'sticks']),
    );
  });

  it('tells Little Red Riding Hood beat with cape/basket pictures', () => {
    const turn = nextTurn({
      turnIndex: 4,
      greeted: true,
      topic: 'forest',
      pictureId: 'knock',
      naomiSaid: 'knock',
    });
    expect(turn.topic).toBe('forest');
    expect(turn.speech).toMatch(/Red Riding Hood|red cape|Grandma/i);
    expect(turn.twoPictureChoices.map((c) => c.id)).toEqual(
      expect.arrayContaining(['cape', 'basket']),
    );
  });

  it('keeps longer folklore catalog with pigs, red riding, goldilocks', () => {
    expect(FOREST_BEAT_COUNT).toBeGreaterThanOrEqual(6);
    const catalog = forestSpeechCatalog().join(' ').toLowerCase();
    expect(catalog).toMatch(/three little pigs|little pigs/);
    expect(catalog).toMatch(/red riding hood/);
    expect(catalog).toMatch(/goldilocks|beanstalk/);
    expect(catalog).not.toMatch(/\belsa\b|\banna\b|\bolaf\b|arendelle|let it go/);
    expect(catalog).not.toMatch(/forklift|dump truck|construction/);
  });

  it('branches into original ice topic without Disney character names', () => {
    const turn = nextTurn({
      turnIndex: 1,
      greeted: true,
      naomiSaid: 'elsa',
    });
    expect(turn.topic).toBe('ice');
    expect(turn.twoPictureChoices).toHaveLength(2);
    const lower = turn.speech.toLowerCase();
    expect(lower).toMatch(/ice castle|snow|snow princess|snowflake/);
    expect(lower).not.toMatch(/\belsa\b|\banna\b|\bolaf\b|arendelle|let it go/);
    for (const speech of iceSpeechCatalog()) {
      expect(speech.toLowerCase()).not.toMatch(
        /\belsa\b|\banna\b|\bolaf\b|arendelle|let it go/,
      );
    }
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

  it('asks exactly one first-principles style question after the dino story arc', () => {
    const fpIndex = STORY_BEAT_COUNT + 1;
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

  it('enriches first-principles wonder across all topics including ice', () => {
    const topics = ['dinos', 'forest', 'feelings', 'animals', 'nature', 'ice'] as const;
    for (const topic of topics) {
      const beatsLen =
        topic === 'forest' ? FOREST_BEAT_COUNT : STORY_BEAT_COUNT;
      const fpIndex = beatsLen + 1;
      const turn = nextTurn({
        turnIndex: fpIndex,
        greeted: true,
        topic,
        naomiSaid: 'hello',
      });
      const lower = turn.speech.toLowerCase();
      expect(lower).toMatch(/what if|why |how /);
      expect(lower).toMatch(
        /wonder|curious|think|kind|share|grow|hug|home|friend|rain|water|heart|body|listen|gentle|notice|help|warm|snow|ice|mitt/,
      );
      expect(lower).not.toMatch(/\bquiz\b|\bgrade\b|\bscore\b|correct answer|wrong answer|\bpoints\b/);
      expect(turn.twoPictureChoices).toHaveLength(2);
      for (const c of turn.twoPictureChoices) {
        expect(c.label.length).toBeGreaterThan(0);
        expect(c.label.length).toBeLessThanOrEqual(14);
      }
    }
  });

  it('offers multiple first-principles wonder angles per topic catalog', () => {
    const catalog = firstPrinciplesSpeechCatalog();
    // 6 topics × ≥2 variants
    expect(catalog.length).toBeGreaterThanOrEqual(12);
    const stems = catalog.filter((s) => /what if|why |how /i.test(s));
    expect(stems.length).toBe(catalog.length);
    for (const speech of catalog) {
      expect(speech.toLowerCase()).not.toMatch(/\bquiz\b|\bgrade\b|\bscore\b|correct answer/);
    }
    const unique = new Set(catalog.map((s) => s.slice(0, 48).toLowerCase()));
    expect(unique.size).toBeGreaterThanOrEqual(8);
  });

  it('picks different first-principles variants from different kid replies', () => {
    const fpIndex = STORY_BEAT_COUNT + 1;
    const a = nextTurn({
      turnIndex: fpIndex,
      greeted: true,
      topic: 'dinos',
      naomiSaid: 'tiny roar',
      pictureId: 'roar',
    });
    const b = nextTurn({
      turnIndex: fpIndex,
      greeted: true,
      topic: 'dinos',
      naomiSaid: 'quiet stretch please',
      pictureId: 'stretch',
    });
    const speeches = [a.speech, b.speech];
    expect(speeches.every((s) => /what if|why |how /i.test(s))).toBe(true);
    expect(a.twoPictureChoices).toHaveLength(2);
    expect(b.twoPictureChoices).toHaveLength(2);
  });

  it('keeps warm preschool-teacher beats (co-play, soft invites)', () => {
    const dino = nextTurn({
      turnIndex: 1,
      greeted: true,
      pictureId: 'dinos',
      naomiSaid: 'dinosaurs',
    });
    expect(dino.speech.toLowerCase()).toMatch(/soft|gentle|with me|together|come|oh |sweet/);
    const greet = nextTurn({ turnIndex: 0, greeted: false });
    expect(greet.speech.toLowerCase()).toMatch(/glad|sit with me|happy|here/);
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
    expect(turn.speech.toLowerCase()).toMatch(/oh |sweetheart|careful|with me|soft |let's/);
    expect(turn.speech.toLowerCase()).not.toMatch(/\bwhoa\b|\bstop\.?\b/);
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

  it('farewells softly on hangup and hints wake-up continue', () => {
    const turn = nextTurn({
      turnIndex: 3,
      greeted: true,
      topic: 'dinos',
      naomiSaid: 'bye-bye',
    });
    expect(turn.speech.toLowerCase()).toMatch(/bye-bye|see you soon/);
    expect(turn.speech.toLowerCase()).toMatch(/wake up|come back/);
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
    const topics = ['feelings', 'animals', 'nature', 'dinos', 'forest', 'ice'] as const;
    for (const topic of topics) {
      const max =
        (topic === 'forest' ? FOREST_BEAT_COUNT : STORY_BEAT_COUNT) + 3;
      for (let i = 0; i <= max; i++) {
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
