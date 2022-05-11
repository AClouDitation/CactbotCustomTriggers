// Rename this file to `raidboss.js` and edit it to change the raidboss ui.
// This file is Javascript.  Anything after "//" on a line is a comment.
// If you edit this file, remember to reload ACT or click the "Reload overlay"
// button on the raidboss overlay.
// If there are errors in this file, they will appear in the OverlayPlugin.dll
// log window in ACT.
// See: http://github.com/quisquous/cactbot/blob/main/docs/CactbotCustomization.md#check-the-overlayplugin-log-for-errors

// Path to sound played for info-priority text popups, or when "Info" is
// specified as the sound name.
Options.InfoSound = '../../resources/sounds/freesound/percussion_hit.webm';

// Path to sound played for alert-priority text popups, or when "Alert" is
// specified as the sound name.
Options.AlertSound = '../../resources/sounds/BigWigs/Alert.webm';

// Path to sound played for alarm-priority text popups, or when "Alarm" is
// specified as the sound name.
Options.AlarmSound = '../../resources/sounds/BigWigs/Alarm.webm';

// Path to sound played when "Long" is specified as the sound name.
Options.LongSound = '../../resources/sounds/BigWigs/Long.webm';

// Path to sound played when the fight starts, or when "Pull" is
// specified as the sound name.
Options.PullSound = '../../resources/sounds/freesound/sonar.webm';

// A set of nicknames to use for players, when trying to shorten names.
// See: https://github.com/quisquous/cactbot/blob/main/docs/CactbotCustomization.md#customizing-behavior
Options.PlayerNicks = {};

const dirToWaymark = [
  '4',
  'A',
  'B',
  'C',
  'D',
  '1',
  '2',
  '3',
  'UNKNOWN'
];

// An array of user-defined triggers, in the format defined in the trigger guide:
// See: https://github.com/quisquous/cactbot/blob/main/docs/CactbotCustomization.md#overriding-raidboss-triggers
// See also: https://github.com/quisquous/cactbot/tree/main/docs/RaidbossGuide.md

// Here's an example of overriding a trigger.
// This overrides the "Test Poke" trigger from:
// https://github.com/quisquous/cactbot/blob/main/ui/raidboss/data/00-misc/test.js
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendCommands(arr) {
  for (const command of arr) {
    console.log(command);
    callOverlayHandler({
      call: 'PostNamazu',
      c: 'command',
      p: command
    });
    await sleep(50);
  }
}

Options.Triggers.push({
  zoneId: ZoneId.MiddleLaNoscea,
  triggers: [{
      id: 'Test Poke',
      netRegex: NetRegexes.gameNameLog({
        line: 'You poke the striking dummy.*?',
        capture: false
      }),
      netRegexDe: NetRegexes.gameNameLog({
        line: 'Du stupst die Trainingspuppe an.*?',
        capture: false
      }, ),
      netRegexFr: NetRegexes.gameNameLog({
        line: 'Vous touchez légèrement le mannequin d\'entraînement du doigt.*?',
        capture: false,
      }, ),
      netRegexJa: NetRegexes.gameNameLog({
        line: '.*は木人をつついた.*?',
        capture: false
      }),
      netRegexCn: NetRegexes.gameNameLog({
        line: '.*用手指戳向木人.*?',
        capture: false
      }),
      netRegexKo: NetRegexes.gameNameLog({
        line: '.*나무인형을 쿡쿡 찌릅니다.*?',
        capture: false
      }),
      preRun: function (data) {
        data.pokes = (data.pokes || 0) + 1;
      },
      // Instead of printing the number of pokes with infoText like the original trigger,
      // This overrides the type and text of the output.
      alarmText: 'POKE (user file override)',
      run: () => {
        sendCommands(['/e <se.3>', '/e <se.6>']);
      }
    },
  ],
});

// Here's an example of overriding a timeline.
// This overrides the test timeline that you normally play with a `/countdown 5` in Middle La Noscea
// with an updated one from `user/test-override.txt`.
Options.Triggers.push({
  zoneId: ZoneId.MiddleLaNoscea,
  // This flag is required to clear any previously specified timelines.
  overrideTimelineFile: true,
  // This file is in the same directory as this JavaScript file.
  timelineFile: 'test-override.txt',
});

// Here's an example of a adding a custom regen trigger.
// It reminds you to use regen again when you are in Sastasha (unsynced).
Options.Triggers.push({
  // The zone this should apply to.
  // This should match the zoneId in the triggers file.
  zoneId: ZoneId.Sastasha,
  triggers: [
    // A more complicated regen trigger.
    {
      // This is a made up id that does not exist in cactbot.
      id: 'User Example Regen',
      // This will match log lines from ACT that look like this:
      // "Nacho Queen gains the effect of Regen from Taco Cat for 21.00 Seconds."
      regex: Regexes.gainsEffect({
        effect: 'Regen'
      }),
      delaySeconds: function (data, matches) {
        // Wait the amount of seconds regen lasts before reminding you to
        // reapply it.  This is not smart enough to figure out if you
        // cast it twice, and is left as an exercise for the reader to
        // figure out how to do so via storing variables on `data`.
        return data.ParseLocaleFloat(matches.duration);
      },
      alertText: 'Regen',
    },
  ],
});

// Due to changes introduced in patch 5.2, overhead markers now have a random offset
// added to their ID. This offset currently appears to be set per instance, so
// we can determine what it is from the first overhead marker we see.
const headmarkers = {
  // vfx/lockon/eff/lockon6_t0t.avfx
  'hyperdimensionalSlash': '00EA',
  // vfx/lockon/eff/r1fz_firechain_01x.avfx through 04x
  'firechainCircle': '0119',
  'firechainTriangle': '011A',
  'firechainSquare': '011B',
  'firechainX': '011C',
  // vfx/lockon/eff/r1fz_skywl_s9x.avfx
  'skywardLeap': '014A',
  // vfx/lockon/eff/m0244trg_a1t.avfx and a2t
  'sword1': '0032',
  'sword2': '0033',
  // vfx/lockon/eff/r1fz_holymeteo_s12x.avfx
  'meteor': '011D',
  // vfx/lockon/eff/r1fz_lockon_num01_s5x.avfx through num03
  'dot1': '013F',
  'dot2': '0140',
  'dot3': '0141',
};
const firstMarker = {
  'doorboss': headmarkers.hyperdimensionalSlash,
  'thordan': headmarkers.skywardLeap,
};
const getHeadmarkerId = (data, matches, firstDecimalMarker) => {
  // If we naively just check !data.decOffset and leave it, it breaks if the first marker is 00DA.
  // (This makes the offset 0, and !0 is true.)
  if (data.decOffset === undefined) {
    // This must be set the first time this function is called in DSR Headmarker Tracker.
    if (firstDecimalMarker === undefined)
      throw new UnreachableCode();
    data.decOffset = parseInt(matches.id, 16) - firstDecimalMarker;
  }
  // The leading zeroes are stripped when converting back to string, so we re-add them here.
  // Fortunately, we don't have to worry about whether or not this is robust,
  // since we know all the IDs that will be present in the encounter.
  return (parseInt(matches.id, 16) - data.decOffset).toString(16).toUpperCase().padStart(4, '0');
};
// Calculate combatant position in an all 8 cards/intercards
const matchedPositionTo8Dir = (combatant) => {
  // Positions are moved up 100 and right 100
  const y = combatant.PosY - 100;
  const x = combatant.PosX - 100;
  // During Thordan, knight dives start at the 8 cardinals + numerical
  // slop on a radius=23 circle.
  // N = (100, 77), E = (123, 100), S = (100, 123), W = (77, 100)
  // NE = (116.26, 83.74), SE = (116.26, 116.26), SW = (83.74, 116.26), NW = (83.74, 83.74)
  //
  // Map NW = 0, N = 1, ..., W = 7
  return (Math.round(5 - 4 * Math.atan2(x, y) / Math.PI) % 8);
};
// Calculate combatant position in 4 cardinals
const matchedPositionTo4Dir = (combatant) => {
  // Positions are moved up 100 and right 100
  const y = combatant.PosY - 100;
  const x = combatant.PosX - 100;
  // During the vault knights, Adelphel will jump to one of the 4 cardinals
  // N = (100, 78), E = (122, 100), S = (100, 122), W = (78, 100)
  //
  // N = 0, E = 1, S = 2, W = 3
  return (Math.round(2 - 2 * Math.atan2(x, y) / Math.PI) % 4);
};

Options.Triggers.push({
  zoneId: ZoneId.DragonsongsRepriseUltimate,
  //timelineFile: 'dragonsongs_reprise_ultimate.txt',
  initData: () => {
    return {
      phase: 'doorboss',
      firstAdelphelJump: true,
      diveFromGraceNum: {},
      diveFromGraceHasArrow: {
        1: false,
        2: false,
        3: false
      },
    };
  },
  triggers: [{
      id: 'DSR Playstation Fire Chains',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker(),
      condition: (data, matches) => data.phase === 'doorboss' && data.me === matches.target,
      alertText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id === headmarkers.firechainCircle)
          return output.circle();
        if (id === headmarkers.firechainTriangle)
          return output.triangle();
        if (id === headmarkers.firechainSquare)
          return output.square();
        if (id === headmarkers.firechainX)
          return output.x();
      },
      run: (data) => {
        sendCommands([
            '/p <se.3>',
            '/p ○△X',
            '/p □   □',
            '/p X△○']); ;
      },
      outputStrings: {
        circle: {
          en: 'Red Circle',
          de: 'Roter Kreis',
          fr: 'Cercle rouge',
          ko: '빨강 원형징',
        },
        triangle: {
          en: 'Green Triangle',
          de: 'Grünes Dreieck',
          fr: 'Triangle vert',
          ko: '초록 세모징',
        },
        square: {
          en: 'Purple Square',
          de: 'Lilanes Viereck',
          fr: 'Carré violet',
          ko: '보라 네모징',
        },
        x: {
          en: 'Blue X',
          de: 'Blaues X',
          fr: 'Croix bleue',
          ko: '파랑 X징',
        },
      },
    }, {
      id: 'DSR Skyblind',
      // 631A Skyblind (2.2s cast) is a targetted ground aoe where A65 Skyblind
      // effect expired on the player.
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({
        effectId: 'A65'
      }),
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration),
      response: Responses.moveAway(),
    }, {
      id: 'DSR Dragon\'s Rage',
      // 63C4 Is Thordan's --middle-- action, thordan jumps again and becomes untargetable, shortly after the 2nd 6C34 action
      type: 'Ability',
      netRegex: NetRegexes.ability({
        id: '63C4',
        source: 'King Thordan'
      }),
      netRegexDe: NetRegexes.ability({
        id: '63C4',
        source: 'Thordan'
      }),
      netRegexFr: NetRegexes.ability({
        id: '63C4',
        source: 'Roi Thordan'
      }),
      netRegexJa: NetRegexes.ability({
        id: '63C4',
        source: '騎神トールダン'
      }),
      netRegexCn: NetRegexes.ability({
        id: '63C4',
        source: '骑神托尔丹'
      }),
      netRegexKo: NetRegexes.ability({
        id: '63C4',
        source: '기사신 토르당'
      }),
      condition: (data) => (data.phase === 'thordan' && (data.thordanJumpCounter = (data.thordanJumpCounter ?? 0) + 1) === 2),
      delaySeconds: 0.5,
      promise: async(data, matches) => {
        // Select King Thordan
        let thordanData = null;
        thordanData = await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        });
        // if we could not retrieve combatant data, the
        // trigger will not work, so just resume promise here
        if (thordanData === null) {
          console.error(`King Thordan: null data`);
          return;
        }
        if (!thordanData.combatants) {
          console.error(`King Thordan: null combatants`);
          return;
        }
        const thordanDataLength = thordanData.combatants.length;
        if (thordanDataLength !== 1) {
          console.error(`King Thordan: expected 1 combatants got ${thordanDataLength}`);
          return;
        }
        // Add the combatant's position
        const thordan = thordanData.combatants.pop();
        if (!thordan)
          throw new UnreachableCode();
        data.thordanDir = matchedPositionTo8Dir(thordan);
      },
      infoText: (data, _matches, output) => {
        // Map of directions
        const dirs = {
          0: output.northwest(),
          1: output.north(),
          2: output.northeast(),
          3: output.east(),
          4: output.southeast(),
          5: output.south(),
          6: output.southwest(),
          7: output.west(),
          8: output.unknown(),
        };
        return output.thordanLocation({
          dir: dirs[data.thordanDir ?? 8],
        });
      },
      //run: (data) => delete data.thordanDir,
      outputStrings: {
        north: Outputs.north,
        northeast: Outputs.northeast,
        east: Outputs.east,
        southeast: Outputs.southeast,
        south: Outputs.south,
        southwest: Outputs.southwest,
        west: Outputs.west,
        northwest: Outputs.northwest,
        unknown: Outputs.unknown,
        thordanLocation: {
          en: '${dir} Thordan',
          de: '${dir} Thordan',
          ja: 'トールダンが${dir}で',
          ko: '토르당 ${dir}',
        },
      },
    }, {
      id: 'DSR Skyward Leap',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker(),
      condition: (data, matches) => data.phase === 'thordan' && data.me === matches.target,
      alertText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id === headmarkers.skywardLeap)
          return output.leapOnYou();
      },
      outputStrings: {
        leapOnYou: {
          en: 'Leap on YOU',
          de: 'Sprung auf DIR',
          fr: 'Saut sur VOUS',
          ko: '광역 대상자',
        },
      },
    }, {
      id: 'DSR Skyward Leap for party',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker(),
      condition: (data, matches) => data.phase === 'thordan',
      run: (data, matches) => {
        if (Array.isArray(data.leapTargets)) {
          data.leapTargets = [];
        }
        data.leapTargets.push(data.party.jobName(matches.target));
        if (data.leapTargets.length === 3) {
          if (!data.thordanDir) {
            console.error(`Thordan Dir Not Found.`);
            return;
          }
          const leapPrio = {
            'AST': 0,
            'WHM': 1,
            'SGE': 2,
            'SCH': 3,
            'SAM': 4,
            'RPR': 5,
            'NIN': 6,
            'DNC': 7,
            'RDM': 8,
            'SMN': 9
          };
          data.leapTargets.sort((a, b) => {
            return leapPrio[a] < leapPrio[b];
          });
          sendCommands(
            '/p  <se.3>',
            concat('/p ', data.leapTargets[0], 'go to', dirToWaymark[(data.thordanDir + 2) % 8]),
            concat('/p ', data.leapTargets[1], 'go to', dirToWaymark[(data.thordanDir + 4) % 8]),
            concat('/p ', data.leapTargets[2], 'go to', dirToWaymark[(data.thordanDir + 6) % 8]));
        }
      }
    }, {
      id: 'DSR Ancient Quaga',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({
        id: '63C6',
        source: 'King Thordan',
        capture: false
      }),
      netRegexDe: NetRegexes.startsUsing({
        id: '63C6',
        source: 'Thordan',
        capture: false
      }),
      netRegexFr: NetRegexes.startsUsing({
        id: '63C6',
        source: 'Roi Thordan',
        capture: false
      }),
      netRegexJa: NetRegexes.startsUsing({
        id: '63C6',
        source: '騎神トールダン',
        capture: false
      }),
      netRegexCn: NetRegexes.startsUsing({
        id: '63C6',
        source: '骑神托尔丹',
        capture: false
      }),
      netRegexKo: NetRegexes.startsUsing({
        id: '63C6',
        source: '기사신 토르당',
        capture: false
      }),
      run: (data) => {
        delete data.thordanDir;
        delete data.leapTargets;
      },
      response: Responses.aoe(),
    }, {
      id: 'DSR Sanctity of the Ward Direction',
      type: 'Ability',
      netRegex: NetRegexes.ability({
        id: '63E1',
        source: 'King Thordan',
        capture: false
      }),
      netRegexDe: NetRegexes.ability({
        id: '63E1',
        source: 'Thordan',
        capture: false
      }),
      netRegexFr: NetRegexes.ability({
        id: '63E1',
        source: 'Roi Thordan',
        capture: false
      }),
      netRegexJa: NetRegexes.ability({
        id: '63E1',
        source: '騎神トールダン',
        capture: false
      }),
      netRegexCn: NetRegexes.ability({
        id: '63E1',
        source: '骑神托尔丹',
        capture: false
      }),
      netRegexKo: NetRegexes.ability({
        id: '63E1',
        source: '기사신 토르당',
        capture: false
      }),
      condition: (data) => data.phase === 'thordan',
      delaySeconds: 4.7,
      promise: async(data, _matches, output) => {
        // The two gladiators spawn in one of two positions: West (95, 100) or East (105, 100).
        // This triggers uses east/west location of the white knight, Ser Janlennoux (3635) to
        // determine where both knights will dash as they each only look in two directions.
        // Ser Janlenoux only looks towards the north (northeast or northwest).
        // Ser Adelphel only looks towards the south (southwest or southeast).
        // Thus we can just use one knight and get whether it is east or west for location.
        // Callout assumes starting from DRK position, but for east/west (two-movement strategy)
        // you can reverse the cw/ccw callout.
        const janlenouxLocaleNames = {
          en: 'Ser Janlenoux',
          de: 'Janlenoux',
          fr: 'sire Janlenoux',
          ja: '聖騎士ジャンルヌ',
          cn: '圣骑士让勒努',
          ko: '성기사 장르누',
        };
        // Select Ser Janlenoux
        let combatantNameJanlenoux = null;
        combatantNameJanlenoux = janlenouxLocaleNames[data.parserLang];
        let combatantDataJanlenoux = null;
        if (combatantNameJanlenoux) {
          combatantDataJanlenoux = await callOverlayHandler({
            call: 'getCombatants',
            names: [combatantNameJanlenoux],
          });
        }
        // if we could not retrieve combatant data, the
        // trigger will not work, so just resume promise here
        if (combatantDataJanlenoux === null) {
          console.error(`Ser Janlenoux: null data`);
          return;
        }
        if (!combatantDataJanlenoux.combatants) {
          console.error(`Ser Janlenoux: null combatants`);
          return;
        }
        const combatantDataJanlenouxLength = combatantDataJanlenoux.combatants.length;
        if (combatantDataJanlenouxLength <= 1) {
          console.error(`Ser Janlenoux: expected at least 1 combatants got ${combatantDataJanlenouxLength}`);
          return;
        }
        // Sort to retreive last combatant in list
        const sortCombatants = (a, b) => (a.ID ?? 0) - (b.ID ?? 0);
        const combatantJanlenoux = combatantDataJanlenoux.combatants.sort(sortCombatants).shift();
        if (!combatantJanlenoux)
          throw new UnreachableCode();
        // West (95, 100) or East (105, 100).
        if (combatantJanlenoux.PosX < 100)
          data.sanctityWardDir = output.clockwise();
        if (combatantJanlenoux.PosX > 100)
          data.sanctityWardDir = output.counterclock();
      },
      infoText: (data, _matches, output) => {
        return data.sanctityWardDir ?? output.unknown();
      },
      run: (data) => delete data.sanctityWardDir,
      outputStrings: {
        clockwise: {
          en: 'Clockwise',
          de: 'Im Uhrzeigersinn',
          ja: '時計回り',
          ko: '시계방향',
        },
        counterclock: {
          en: 'Counterclockwise',
          de: 'Gegen den Uhrzeigersinn',
          ja: '反時計回り',
          ko: '반시계방향',
        },
        unknown: Outputs.unknown,
      },
    }, {
      id: 'DSR Sanctity of the Ward Swords',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker(),
      condition: (data, matches) => data.phase === 'thordan' && data.me === matches.target,
      alarmText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id === headmarkers.sword1)
          return output.sword1();
        if (id === headmarkers.sword2)
          return output.sword2();
      },
      outputStrings: {
        sword1: {
          en: '1',
          de: '1',
          ja: '1',
          ko: '1',
        },
        sword2: {
          en: '2',
          de: '2',
          ja: '2',
          ko: '2',
        },
      },
    }, {
      id: 'DSR Sanctity of the Ward Swords for Party',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker(),
      condition: (data, matches) => data.phase === 'thordan',
      alarmText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id === headmarkers.sword1)
          return output.sword1();
        if (id === headmarkers.sword2)
          return output.sword2();
      },
      run: (data, matches) => {
        if (!Array.isArray(data.sanctitySwordTargets)) {
          data.sanctitySwordTargets = [];
        }
        data.sanctitySwordTargets.push(data.party.jobName(matches.target));
        if (data.sanctitySwordTargets.length === 2) {
          const swordGroup = {
            'WAR': 0,
            'AST': 0,
            'WHM': 0,
            'RPR': 0,
            'NIN': 0,
            'DNC': 0,
            'DRK': 1,
            'SGE': 1,
            'SCH': 1,
            'SAM': 1,
            'RDM': 1,
            'SMN': 1,
          };
          if (swordGroup[data.sanctitySwordTargets[0]] == swordGroup[data.sanctitySwordTargets[1]]) {
            if (swordGroup[data.sanctitySwordTargets[0]] == 0) {
              sendCommands('/p <se.3> RDM Flex');
            } else {
              sendCommands('/p <se.3> DNC Flex');
            }
          } else {
            sendCommands('/p <se.3> No Flex');
          }
        }
      },
      outputStrings: {
        sword1: {
          en: '1',
          de: '1',
          ja: '1',
          ko: '1',
        },
        sword2: {
          en: '2',
          de: '2',
          ja: '2',
          ko: '2',
        },
      },
    }, {
      id: 'DSR Dragon\'s Gaze',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({
        id: '63D0',
        source: 'King Thordan',
        capture: false
      }),
      netRegexDe: NetRegexes.startsUsing({
        id: '63D0',
        source: 'Thordan',
        capture: false
      }),
      netRegexFr: NetRegexes.startsUsing({
        id: '63D0',
        source: 'Roi Thordan',
        capture: false
      }),
      netRegexJa: NetRegexes.startsUsing({
        id: '63D0',
        source: '騎神トールダン',
        capture: false
      }),
      netRegexCn: NetRegexes.startsUsing({
        id: '63D0',
        source: '骑神托尔丹',
        capture: false
      }),
      netRegexKo: NetRegexes.startsUsing({
        id: '63D0',
        source: '기사신 토르당',
        capture: false
      }),
      durationSeconds: 5,
      run: (data) => delete data.sanctitySwordTargets,
      response: Responses.lookAway('alert'),
    }, {
      id: 'DSR Sanctity of the Ward Meteor Role',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker(),
      condition: (data) => data.phase === 'thordan',
      suppressSeconds: 1,
      infoText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id !== headmarkers.meteor)
          return;
        if (data.party.isDPS(matches.target))
          return output.dpsMeteors();
        return output.tankHealerMeteors();
      },
      outputStrings: {
        tankHealerMeteors: {
          en: 'Tank/Healer Meteors',
          de: 'Tank/Heiler Meteore',
          fr: 'Météores Tank/Healer',
          ja: 'タンヒラ 隕石',
          ko: '탱/힐 메테오',
        },
        dpsMeteors: {
          en: 'DPS Meteors',
          de: 'DDs Meteore',
          fr: 'Météores DPS',
          ja: 'DPS 隕石',
          ko: '딜러 메테오',
        },
      },
    }, {
      id: 'DSR Sanctity of the Ward Meteor You',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker(),
      condition: (data, matches) => data.phase === 'thordan' && data.me === matches.target,
      alertText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id === headmarkers.meteor)
          return output.meteorOnYou();
      },
      outputStrings: {
        meteorOnYou: Outputs.meteorOnYou,
      },
    },
  ],
});

Options.Triggers.push({
  zoneId: ZoneId.TheNavelExtreme,
  //timelineFile: 'titan-ex.txt',
  timelineTriggers: [{
      id: 'TitanEx Mountain Buster',
      regex: /Mountain Buster/,
      beforeSeconds: 7,
      condition: (data) => data.role === 'healer' || data.role === 'tank',
      response: Responses.tankBuster(),
    }, {
      id: 'TitanEx Mountain Buster Avoid Test',
      regex: /Mountain Buster/,
      beforeSeconds: 0,
      condition: (data) => data.role !== 'healer' && data.role !== 'tank',
      response: Responses.tankCleave(),
      run: (data) => {
        sendCommands(['/e <se.3>']);
      },
    }, {
      id: 'TitanEx Tumult',
      regex: /Tumult/,
      beforeSeconds: 5,
      response: Responses.aoe(),
    },
  ]
})
