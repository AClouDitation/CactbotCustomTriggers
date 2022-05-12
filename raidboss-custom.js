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
      preRun: function (data) {
        data.pokes = (data.pokes || 0) + 1;
      },
      infoText: (data, _matches, output) => {
        return output.test();
      },
      run: () => {
        // sendCommands(['/e <se.3>', '/e <se.6>']);
      },
      outputStrings: {
        test: {
          en: 'Test',
        },
      },
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
      faithUnmovingCnt: 0,
    };
  },
  timelineTriggers: [{
      id: 'Playstation Waymark',
      regex: /Faith Unmoving/,
      beforeSeconds: 15,
      run: (data) => {
        data.faithUnmovingCnt = data.faithUnmovingCnt + 1;
        if (data.faithUnmovingCnt === 2) {
          sendCommands([
              '/p <se.3>',
              '/p ○△X',
              '/p □   □',
              '/p X△○']);
        }
      },
    },
  ],
  triggers: [{
      id: 'DSR Dragon\'s Rage Thordan Dir Collector',
      // 63C4 Is Thordan's --middle-- action, thordan jumps again and becomes untargetable, shortly after the 2nd 6C34 action
      type: 'Ability',
      netRegex: NetRegexes.ability({
        id: '63C4',
        source: 'King Thordan'
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
    }, {
      id: 'DSR Skyward Leap Targets Collector',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker(),
      condition: (data, matches) => data.phase === 'thordan',
      run: (data, matches) => {
        const id = getHeadmarkerId(data, matches);
        if (id !== headmarkers.skywardLeap)
          return;
        if (!Array.isArray(data.leapTargets))
          data.leapTargets = [];
        data.leapTargets.push(matches.target);
      },
    }, {
      id: 'DSR Skyward Leap Targets Strategy',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker(),
      condition: (data, matches) => data.phase !== 'thordan'
       && getHeadmarkerId(data, matches) === headmarkers.skywardLeap
       && !!data.thordanDir
       && !!data.leapTargets
       && data.leapTargets.length === 3,
      infoText: (data, _matches, output) => {
        if (leapTargets.some((target) => data.party.isTank(target)))
          return output.tankGotLeap();
        const leapPrio = {}
        leapPrio[output.prio0()] = 0;
        leapPrio[ouptut.prio1()] = 1;
        leapPrio[output.prio2()] = 2;
        leapPrio[output.prio3()] = 3;
        leapPrio[output.prio4()] = 4;
        leapPrio[output.prio5()] = 5;
        leapTargets.sort((a, b) => leapPrio[a] - leapPrio[b]);

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
        return output.safespot({
          player1: data.ShortName(leapTargets[0]),
          dir1: dirs[(data.thordandir + 2) % 8],
          player2: data.ShortName(leapTargets[1]),
          dir2: dirs[(data.thordandir + 4) % 8],
          player3: data.ShortName(leapTargets[2]),
          dir3: dirs[(data.thordandir + 6) % 8]
        });
      },
      run: (data, matches) => {
        delete data.thordanDir;
        delete data.leapTargets;
      },
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
        prio0: 'AST',
        prio1: 'SGE',
        prio2: 'SAM',
        prio3: 'RPR',
        prio4: 'DNC',
        prio5: 'RDM',
        safespot: {
          en: '${player1} ${dir1} / ${player2} ${dir2} / ${player3} ${dir3}'
        },
        tankGotLeap: {
          en: 'You fucked up.'
        }
      },
    }, {
      id: 'DSR Sanctity of the Ward Swords for Party',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker(),
      condition: (data, matches) => data.phase === 'thordan',
      alarmText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id !== headmarkers.sword1 || id != headmarkers.sword2)
          return;
        if (!Array.isArray(data.sanctitySwordTargets))
          data.sanctitySwordTargets = [];
        data.sanctitySwordTargets.push(matches.target);
        return output.swordOnTarget({
          sword: id === headmarkers.sword1 ? output.sword1() : output.sword2,
          player: matches.target
        });
      },
      outputStrings: {
        sword1: {
          en: '1',
        },
        sword2: {
          en: '2',
        },
        swordOnTarget: {
          en: '${sword} on ${player}'
        }
      },
    }, {
      id: 'DSR Sanctity of the Ward Swords Flex',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker(),
      condition: (data, matches) => data.phase === 'thordan'
       && !!data.sanctitySwordTargets
       && data.sanctitySwordTargets.length === 2,
      infoText: (data, matches) => {
        const job = data.party.jobName(matches.target);
        data.sanctitySwordTargets.push(job);
        const group = {}
        group[output.group1player1()] = 0;
        group[output.group1player2()] = 0;
        group[output.group1player3()] = 0;
        group[output.group1player4()] = 0;
        group[output.group2player1()] = 1;
        group[output.group2player2()] = 1;
        group[output.group2player3()] = 1;
        group[output.group2player4()] = 1;

        const sword1 = data.party.jobName(sanctitySwordTargets[0]);
        const sword2 = data.party.jobName(sanctitySwordTargets[1]);

        if (group[sword1] === group[sword2]) {
          if (group[sword1] === 0) {
            // Two swords on group 1.
            return output.group2flex();
          } else {
            return output.group1flex();
          }
        } else {
          return output.noflex();
        }

      },
      outputStrings: {
        group1player1: 'WAR',
        group1player2: 'AST',
        group1player3: 'RPR',
        group1player4: 'DNC',
        group2player1: 'DRK',
        group2player2: 'SGE',
        group2player3: 'SAM',
        group2player4: 'RDM',
        group1flex: {
          en: 'DNC Flex',
        },
        group2flex: {
          en: 'RDM Flex',
        },
        noflex: {
          en: 'No Flex',
        },
      }
    }, {
      id: 'DSR Sanctity of the Ward Meteor for Party',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker(),
      condition: (data) => data.phase === 'thordan',
      run: (data, matches) => {
        if (id !== headmarkers.meteor)
          return;
        // TODO: implement this.
        if (!Array.isArray(data.meteorTargets))
          data.meteorTargets = [];
        const job = data.party.jobName(matches.target);
        data.meteorTargets.push(job);
        if (data.meteorTargets.length === 2) {
          const jobToGroup = {
            // G1 North
            'WAR': 0,
            'SAM': 0,
            // G2 East
            'RPR': 1,
            'NIN': 1,
            'DRK': 1,
            // G3 South
            'AST': 2,
            'WHM': 2,
            'DNC': 2,
            // G4 West
            'SGE': 3,
            'SCH': 3,
            'RDM': 3,
            'SMN': 3,
          };
          const dpsGroupToJob = ['SAM', 'RPR', 'DNC', 'RDM'];
          const thGroupToJob = ['WAR', 'DRK', 'AST', 'SGE'];
          if ((jobToGroup(data.meteorTargets[0]) + jobToGroup(data.meteorTargets[1])) % 2 === 0) {
            sendCommands(['/p <se.3> No Swap']);
          } else {
            const swapTargetIndex = jobToGroup(data.meteorTargets[0]) % 2 === 1 ? 0 : 1;
            const swapGroup = (jobToGroup[data.meteorTargets[(swapTargetIndex + 1) % 2]] + 2) % 4;
            const job = data.meteorTargets[swapTargetIndex];
            sendCommands(['/p <se.3> ' + job + ' ' +
                (Util.isDpsJob(data.meteorTargets[0]) ?
                  dpsGroupToJob[swapGroup] : thGroupToJob[swapGroup]) + 'SWAP']);
          }
          delete data.MeteorTargets;
        }
      },
    },
  ],
});
