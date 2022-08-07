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
Options.PlayerNicks = {
};

console.log('===============================');
console.log('Raid boss custom trigger loaded');
console.log('===============================');
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
  zoneId: ZoneId.MatchAll,
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
    }, {
      id: 'Test Flex',
      netRegex: NetRegexes.gameNameLog({
        line: 'You flex your muscles for the striking dummy.*?',
        capture: false,
      }),
      infoText: (data, _matches, output) => {
        return output.flex();
      },
      outputStrings: {
        flex: {
          en: 'Flex',
        }
      },
    }
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
  timelineTriggers: [{
      id: 'Playstation Waymark',
      regex: /Faith Unmoving/,
      beforeSeconds: 15,
      run: (data) => {
        data.faithUnmovingCnt = (data.faithUnmovingCnt ?? 0) + 1;
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
        console.log('meteor targets: ', data.leapTargets);
      },
    }, {
      id: 'DSR Skyward Leap Targets Move',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker(),
      condition: (data, matches) => data.phase === 'thordan'
        && getHeadmarkerId(data, matches) === headmarkers.skywardLeap
        && Array.isArray(data.leapTargets)
        && data.leapTargets.length === 3,
      delaySeconds: 1.5,
      infoText: (data, _matches, output) => {
        if (data.leapTargets.some((target) => data.party.isTank(target)))
          return output.tankGotLeap();
        const leapPrio = {}
        leapPrio[output.prio0()] = 0;
        leapPrio[output.prio1()] = 1;
        leapPrio[output.prio2()] = 2;
        leapPrio[output.prio3()] = 3;
        leapPrio[output.prio4()] = 4;
        leapPrio[output.prio5()] = 5;
        data.leapTargets.sort((a, b) => {
            return leapPrio[data.party.jobName(a)] - leapPrio[data.party.jobName(b)];
          });
        return output.safespot({
          player1: data.ShortName(data.leapTargets[0]),
          player2: data.ShortName(data.leapTargets[1]),
          player3: data.ShortName(data.leapTargets[2]),
        });
      },
      run: (data, matches) => delete data.leapTargets,
      outputStrings: {
        prio0: 'AST',
        prio1: 'SGE',
        prio2: 'SAM',
        prio3: 'NIN',
        prio4: 'DNC',
        prio5: 'RDM',
        safespot: {
          en: '${player1}, ${player2}, ${player3}'
        },
        tankGotLeap: {
          en: 'You fucked up.'
        }
      },
    }, {
      id: 'DSR Sanctity of the Ward Swords Collector',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker(),
      condition: (data, matches) => data.phase === 'thordan',
      run: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id !== headmarkers.sword1 && id !== headmarkers.sword2)
          return;
        if (!Array.isArray(data.sanctitySwordTargets))
          data.sanctitySwordTargets = [];
        data.sanctitySwordTargets.push(matches.target);
      },
    }, {
      id: 'DSR Sanctity of the Ward Swords Flex',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker(),
      condition: (data, matches) => data.phase === 'thordan'
       && Array.isArray(data.sanctitySwordTargets)
       && data.sanctitySwordTargets.length === 2,
      infoText: (data, matches, output) => {
        const group = {}
        group[output.group1player1()] = 0;
        group[output.group1player2()] = 0;
        group[output.group1player3()] = 0;
        group[output.group1player4()] = 0;
        group[output.group2player1()] = 1;
        group[output.group2player2()] = 1;
        group[output.group2player3()] = 1;
        group[output.group2player4()] = 1;

        const sword1 = data.party.jobName(data.sanctitySwordTargets[0]);
        const sword2 = data.party.jobName(data.sanctitySwordTargets[1]);

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
      run: (data) => delete data.sanctitySwordTargets,
      outputStrings: {
        group1player1: 'WAR',
        group1player2: 'AST',
        group1player3: 'NIN',
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
      id: 'DSR Sanctity of the Ward Meteor Targets Collector',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker(),
      condition: (data, matches) => data.phase === 'thordan'
       && getHeadmarkerId(data, matches) === headmarkers.meteor,
      run: (data, matches) => {
        if (!Array.isArray(data.meteorTargets)) {
          data.meteorTargets = [];
        }
        data.meteorTargets.push(matches.target);
        console.log('meteor targets: ', data.meteorTargets);
      }
    }, {
      id: 'DSR Sanctity of the Ward Meteor Move',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker(),
      condition: (data, matches) => data.phase === 'thordan'
       && getHeadmarkerId(data, matches) === headmarkers.meteor
       && Array.isArray(data.meteorTargets)
       && data.meteorTargets.length === 2,
      delaySeconds: 0.5,
      infoText: (data, matches, output) => {
        const jobToGroup = {};
        jobToGroup[output.groupNPlayerDPS()] = 0;
        jobToGroup[output.groupEPlayerDPS()] = 1;
        jobToGroup[output.groupSPlayerDPS()] = 2;
        jobToGroup[output.groupWPlayerDPS()] = 3;
        jobToGroup[output.groupNPlayerTH()] = 0;
        jobToGroup[output.groupEPlayerTH()] = 1;
        jobToGroup[output.groupSPlayerTH()] = 2;
        jobToGroup[output.groupWPlayerTH()] = 3;
        const groupDir = [
          output.north(),
          output.east(),
          output.south(),
          output.west(),
          output.unknown(),
        ];
        const targetsJob = [
          data.party.jobName(data.meteorTargets[0]),
          data.party.jobName(data.meteorTargets[1])];
        if (jobToGroup[targetsJob[0]] + jobToGroup[targetsJob[1]] === 2) {
          return output.noSwap();
        }
        if (jobToGroup[targetsJob[0]] + jobToGroup[targetsJob[1]] === 4) {
          return output.allSwap({
            role: data.party.isDps(matches.target) ? 
              output.dps() : 
              output.tankhealer()});
        }          
        else {
          const noSwapTargetIndex = jobToGroup[targetsJob[0]]%2 === 0 ? 0 : 1;
          const swapTargetIndex = (noSwapTargetIndex + 1) % 2;
          console.log("noswap:", targetsJob[noSwapTargetIndex], 
            "swap:", targetsJob[swapTargetIndex]);
          console.log("noswap:", jobToGroup[targetsJob[noSwapTargetIndex]], 
            "swap:", jobToGroup[targetsJob[swapTargetIndex]]);
          const swapFromGroup = jobToGroup[targetsJob[swapTargetIndex]];
          const swapToGroup = (jobToGroup[targetsJob[noSwapTargetIndex]] + 2) % 4;
          return output.swap({
            dir1: groupDir[swapFromGroup],
            dir2: groupDir[swapToGroup],
            role: data.party.isDPS(matches.target) ?
            output.dps() : output.tankhealer(),
          });
        }
      },
      run: (data) => delete data.meteorTargets,
      outputStrings: {
        north: Outputs.north,
        east: Outputs.east,
        south: Outputs.south,
        west: Outputs.west,
        unknown: Outputs.unknown,
        groupNPlayerTH: 'WAR',
        groupNPlayerDPS: 'SAM',
        groupEPlayerTH: 'DRK',
        groupEPlayerDPS: 'NIN',
        groupSPlayerTH: 'AST',
        groupSPlayerDPS: 'DNC',
        groupWPlayerTH: 'SGE',
        groupWPlayerDPS: 'RDM',
        dps: {
          en: 'DPS',
        },
        tankhealer: {
          en: 'Tank Healer',
        },
        noSwap: {
          en: 'No Swap',
        },
        allSwap: {
          en: 'All ${role} Clockwise'
        },
        swap: {
          en: '${dir1}, ${dir2}, ${role} Swap',
        }
      },
    }
  ],
});
