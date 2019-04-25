module.exports = (inc) => {

  let Utils = require("../lib/utils")();
  const testData = require('./data/precalculated_sets/' + inc + '.json');
  
  let testParse = require("..");
  
  parser = testParse.Parser()
  let gsCalibration = "";
  gsCalibration += testData.calibration.header.join(' ') + "\n";
  gsCalibration += testData.calibration.gsCalibration.join("\n");
  
  let calibrationData = parser.calibrationToArray(gsCalibration);
  
  let biggestDiff = {
    diff: -1,
    recorded_uSvHr: 0,
    calculated_uSvHr: 0,
    pulses: -1,
    intervalSeconds: -1,
    index: -1
  };
  
  let matchedCount = 0;
  let diff10 = 0;
  let diff20 = 0;
  let diff30 = 0;
  
  testData.testData.map((record, index) => {
    let res = Utils.pulseTo_uSv(record.pulses, record.seconds, calibrationData, parser.getCalibrationIndex(record.pulses, calibrationData)).toFixed(6);
  
    if (res !== record.uSvHr) {
      let diffPerc = (Math.abs(100 - (record.uSvHr / res) * 100)).toFixed(6);
  
      console.log(`Pulses: ${record.pulses}, Interval: ${record.seconds}, Diff: ${diffPerc}%,   Recorded uSv/h: ${record.uSvHr}, Calculated uSv/h: ${res}`);
      if (diffPerc > parseInt(biggestDiff.diff)) {
        biggestDiff.diff = diffPerc;
        biggestDiff.recorded_uSvHr = record.uSvHr;
        biggestDiff.calculated_uSvHr = res
        biggestDiff.pulses = record.pulses;
        biggestDiff.intervalSeconds = record.seconds
        biggestDiff.index = index;
      }
  
      if (diffPerc > 10) {
        diff10++;
        if (diffPerc > 20) {
          diff20++;
          if (diffPerc > 30) {
            diff30++;
          }
        }
      }
    } else {
      matchedCount++;
      console.log(`Pulses: ${record.pulses},  Match!`);
    }
  });
  
  biggestDiff.diff += "%";
  
  let res = `
************
First time interval: ${testData.testData[0].seconds}
Biggest difference: ${JSON.stringify(biggestDiff, null, 2)}

Results matched: ${matchedCount}
Results larger than 10% difference: ${diff10}
Results larger than 20% difference: ${diff20}
Results larger than 30% difference: ${diff30}
************
`;
// Calibration Vars:
// ${JSON.stringify(calibrationData, null, 2)}

// Raw Calibration Data:
// ${gsCalibration}
// ************
// `;

  return res;
};
