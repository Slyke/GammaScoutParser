(function(m) {

  m.exports = {};

  let v7_02 = function(settings) {

    let retr = {};
    let debug = 0;
    let Utils = require("../utils")();
    
    retr.init = (settings) => {
      // Set default settings if they are not injected.
      if (typeof(settings) != "undefined") {
        debug = (typeof(settings.debug) != "undefined" ? settings.debug : 0);
      } else {
        debug = 0;
      }

      if (debug & 1 === 0) {
        console.log(Math.round(new Date().getTime() / 1000).toString(), " | v1.7_Parser::init() [settings]: ", JSON.stringify(settings, null, 2));
      }
    };

    retr.intervalToSeconds = (intervalTime) => {
      switch (intervalTime) {
        case 0x00:
          return 0; // Disabled

        case 0x01:
          return 3600 * 24 * 7; // Week

        case 0x02:
          return 3600 * 24 * 3; // 3 days

        case 0x03:
          return 3600 * 24; // 1 day

        case 0x04:
          return 3600 * 12; // 12 hours

        case 0x05:
          return 3600 * 2; // 2 hours

        case 0x06:
          return 3600; // 1 hour

        case 0x07:
          return 1800; // 30 minutes

        case 0x08:
          return 600; // 10 minutes

        case 0x09:
          return 300; // 5 minutes

        case 0x0a:
          return 120; // 2 minutes

        case 0x0b:
          return 60; // 1 minute

        case 0x0c:
          return 30; // 30 seconds

        case 0x0d:
          return 10; // 10 seconds

        default:
          return 0;
      }
    };

    retr.linesToHex = (lineArr) => {
      let ret = [];

      lineArr.map((lineBuffer, i) => {
        const lineData = lineBuffer.substr(0, lineBuffer.length - 2);

        let lineChecksum = lineBuffer.substr(-2);
        let calcedChecksum = Utils.calcChecksum(lineData);
  
        if (lineChecksum !== calcedChecksum) {
          console.error(Math.round(new Date().getTime() / 1000).toString(), " | v1.7_Parser::linesToHex(): Line:", i, "Checksum failed.  Got:", lineChecksum, " Expected:", calcedChecksum, " Line Data:", lineArr[i]);
        }
  
        Utils.hexToArr(lineData).map((hex) => {
          ret.push(hex);
        });
      })

      return ret;

    };

    retr.parseLog = (logData, streamLength, gsCalibration) => {
      let calibrationData = retr.calibrationToArray(gsCalibration);
      let logArr = logData.split('\n');

      let ret = [];

      let currentCommand = null;
      let currentCommandParam = null;
      let currentTimeStamp = "";
      let currentIndexFromLastTimeStamp = 0;

      let loadRet = [];
      let charIndex = 0;

      loadRet = retr.linesToHex(logArr).splice(0, streamLength);

      let processingBuffer = Array.from(loadRet);

      while (processingBuffer.length > 0) {
        if (charIndex > 0xffff) {
          console.error(Math.round(new Date().getTime() / 1000).toString(), " | v1.7_Parser::parseLog(): Input stream line exceeded 32 bytes.");
          break;
        }
        charIndex++

        let op = processingBuffer.splice(0, 1)[0];

        let intervalSeconds = retr.intervalToSeconds(currentCommandParam);
        let logTime = new Date(currentTimeStamp);
        logTime.setTime(logTime.getTime() + (intervalSeconds * 1000 * currentIndexFromLastTimeStamp));

        switch (op) {
          case 0xf5: { // Command Code
            currentCommand = op;
            currentCommandParam = null;
            break;
          }

          case 0xf8: { // Skip bytes
            let skipBytes = processingBuffer.splice(0, 1);

            for (let i = 0; i < skipBytes - 1; i++) {
              processingBuffer.splice(0, 1); // Remove bytes from buffer stream.
            }
          }

          case 0xed: { // 6 bit DateTime Code
            if (currentCommand === 0xf5) {
              currentCommandParam = op;
              currentTimeStamp = "";
              currentIndexFromLastTimeStamp = 0;
              break;
            }
          }

          case 0xef: { // 5 bit DateTime Code
            if (currentCommand === 0xf5) {
              currentCommandParam = op;
              currentTimeStamp = "00";
              currentIndexFromLastTimeStamp = 0;
              break;
            }
          }
          case 0xee: { // Out of band time record
            if (currentCommand === 0xf5 && currentCommandParam < 0x0d) {
              let logMinutes = processingBuffer.splice(0, 2);
              let pulseCounts = Utils.pulseHexToInt(processingBuffer.splice(0, 2));

              ret.push({
                event: 'pulseLog',
                meta: 'Out of band',
                pulses: pulseCounts,
                logBeginTime: currentTimeStamp,
                eventTime: logTime.setTime(logTime.getTime() + (logMinutes * 1000 * currentIndexFromLastTimeStamp)).toISOString(),
                interval: logMinutes,
                logIndex: currentIndexFromLastTimeStamp,
                uSvPerHr: Utils.pulseTo_uSv(pulseCounts, (logMinutes * 60), calibrationData, retr.getCalibrationIndex(pulseCounts, calibrationData))
              });
              break;
            }
          }

          case 0xf9: { // Dose rate overflowed
            if (currentCommand === 0xf5 && currentCommandParam < 0x0d) {
              currentIndexFromLastTimeStamp++;
              ret.push({
                event: 'alertLog',
                alert: 'Dose rate overflowed',
                logBeginTime: currentTimeStamp,
                eventTime: logTime.toISOString(),
                interval: intervalSeconds,
                logIndex: currentIndexFromLastTimeStamp
              });
              break;
            }
          }

          case 0xfa: { // Dose alarm fired
            if (currentCommand === 0xf5 && currentCommandParam < 0x0d) {
              currentIndexFromLastTimeStamp++;
              ret.push({
                event: 'alertLog',
                alert: 'Dose alarm fired',
                logBeginTime: currentTimeStamp,
                eventTime: logTime.toISOString(),
                interval: intervalSeconds,
                logIndex: currentIndexFromLastTimeStamp
              });
              break;
            }
          }

          case 0xfb: { // Dose alarm fired + Dose rate overflowed
            if (currentCommand === 0xf5 && currentCommandParam < 0x0d) {
              currentIndexFromLastTimeStamp++;
              ret.push({
                event: 'alertLog',
                alert: 'Dose alarm fired, Dose rate overflowed',
                logBeginTime: currentTimeStamp,
                eventTime: logTime.toISOString(),
                interval: intervalSeconds,
                logIndex: currentIndexFromLastTimeStamp
              });
              break;
            }
          }

          case 0xfc: { // Dose rate alarm fired
            if (currentCommand === 0xf5 && currentCommandParam < 0x0d) {
              currentIndexFromLastTimeStamp++;
              ret.push({
                event: 'alertLog',
                alert: 'Dose rate alarm fired',
                logBeginTime: currentTimeStamp,
                eventTime: logTime.toISOString(),
                interval: intervalSeconds,
                logIndex: currentIndexFromLastTimeStamp
              });
              break;
            }
          }

          case 0xfd: { // Dose rate alarm fired + Dose rate overflowed
            if (currentCommand === 0xf5 && currentCommandParam < 0x0d) {
              currentIndexFromLastTimeStamp++;
              ret.push({
                event: 'alertLog',
                alert: 'Dose rate alarm fired, Dose rate overflowed',
                logBeginTime: currentTimeStamp,
                eventTime: logTime.toISOString(),
                interval: intervalSeconds,
                logIndex: currentIndexFromLastTimeStamp
              });
              break;
            }
          }

          case 0xfe: { // Dose rate alarm fired + Dose alarm fired
            if (currentCommand === 0xf5 && currentCommandParam < 0x0d) {
              currentIndexFromLastTimeStamp++;
              ret.push({
                event: 'alertLog',
                alert: 'Dose rate alarm fired, Dose alarm fired',
                logBeginTime: currentTimeStamp,
                eventTime: logTime.toISOString(),
                interval: intervalSeconds,
                logIndex: currentIndexFromLastTimeStamp
              });
              break;
            }
          }

          case 0xff: { // Dose rate alarm fired + Dose alarm fired + Dose rate overflowed
            if (currentCommand === 0xf5 && currentCommandParam < 0x0d) {
              currentIndexFromLastTimeStamp++;
              ret.push({
                event: 'alertLog',
                alert: 'Dose rate alarm fired, Dose alarm fired, Dose rate overflowed',
                logBeginTime: currentTimeStamp,
                eventTime: logTime.toISOString(),
                interval: intervalSeconds,
                logIndex: currentIndexFromLastTimeStamp
              });
              break;
            }
          }

          case 0x00: case 0x01: case 0x02: case 0x03: case 0x04: case 0x05: case 0x06:
          case 0x07: case 0x08: case 0x09: case 0x0a: case 0x0b: case 0x0c: case 0x0d: { // Entry log interval begin
            if (currentCommand === 0xf5 && currentCommandParam === null) {
              currentCommandParam = op;
              currentIndexFromLastTimeStamp = 0;
              break;
            }
          }

          default: {
            if (currentCommand === 0xf5 && currentCommandParam === 0xed) {
              const timeDec = op.toString(16);
              if (currentTimeStamp.length === 0) {
                currentTimeStamp = timeDec;
              } else if (currentTimeStamp.length < 6) {
                currentTimeStamp = `${Utils.pad(timeDec, 2)}:${currentTimeStamp}`;
              } else if (currentTimeStamp.length === 8) {
                currentTimeStamp = `${Utils.pad(timeDec, 2)}T${currentTimeStamp}`;
              } else if (currentTimeStamp.length > 8) {
                currentTimeStamp = `${Utils.pad(timeDec, 2)}-${currentTimeStamp}`;
              }

              if (currentTimeStamp.length === 17) {
                currentTimeStamp = `20${currentTimeStamp}.000Z`; // Going to assume that the protocol will support 8 byte timestamps by year 2100. If I'm still alive I promise to fix it!
              }
            }
            
            if (currentCommand === 0xf5 && currentCommandParam === 0xef) {
              const timeDec = op.toString(16);
              if (currentTimeStamp.length < 6) {
                currentTimeStamp = `${Utils.pad(timeDec, 2)}:${currentTimeStamp}`;
              } else if (currentTimeStamp.length === 8) {
                currentTimeStamp = `${Utils.pad(timeDec, 2)}T${currentTimeStamp}`;
              } else if (currentTimeStamp.length > 8) {
                currentTimeStamp = `${Utils.pad(timeDec, 2)}-${currentTimeStamp}`;
              }

              if (currentTimeStamp.length === 17) {
                currentTimeStamp = `20${currentTimeStamp}.000Z`; // Going to assume that the protocol will support 8 byte timestamps by year 2100. If I'm still alive I promise to fix it!
              }
            }

            if (currentCommand === 0xf5 && currentCommandParam !== null && currentCommandParam < 0x0d) {
              currentIndexFromLastTimeStamp++;
              let pulseCounts = Utils.pulseHexToInt(op + processingBuffer.splice(0, 1));

              ret.push({
                event: 'pulseLog',
                pulses: pulseCounts,
                logBeginTime: currentTimeStamp,
                eventTime: logTime.toISOString(),
                interval: intervalSeconds,
                logIndex: currentIndexFromLastTimeStamp,
                uSvPerHr: Utils.pulseTo_uSv(pulseCounts, intervalSeconds, calibrationData, retr.getCalibrationIndex(pulseCounts, calibrationData))
              });
            }
          }
        }
      };

      return ret;
    };

    retr.calibrationToArray = (gsCalibration) => {
      // Thanks to johndoe31415 (https://github.com/johndoe31415/gammascoututil) for figuring this out!

      let retCal = {
        header: [],
        calibrations: []
      };
      
      let gsCal = gsCalibration.split("\n");
      let calibrationHeader = gsCal.splice(0, 1)[0].split(' ');

      retCal.header = calibrationHeader;
      
      gsCal.map((calibLine, i) => {
        calibLine = calibLine.replace(/ /g, '');
        try {

          let c1 = Utils.littleEndianHex(calibLine.substr(8, 4)) / 0x100;

          if (retCal.header[2] & (1 << i)) {
            c1 /= 256;
          }

          let calibrationObject = {
            xOffset: Utils.littleEndianHex(calibLine.substr(0, 8)),
            c1: c1,
            c2: Utils.littleEndianHex(calibLine.substr(12, 4)),
            coefficientLinear: Utils.littleEndianHex(calibLine.substr(16, 4))
          }

          retCal.calibrations.push(calibrationObject);
        } catch (err) {
          console.error(Math.round(new Date().getTime() / 1000).toString(), " | v1.7_Parser::calibrationToArray(): Couldn't parse calibration data: ", calibLine, "Line:", i, " Error:", err);
        }
      });
      
      return retCal;
    };

    retr.getCalibrationIndex = (pulseCounts, calibrationVars) => {
      if (pulseCounts < calibrationVars.calibrations[0].xOffset) {
        return 0;
      }

      for (let i = 1; i < calibrationVars.calibrations.length; i++) {
        if (calibrationVars.calibrations[i - 1].xOffset <= pulseCounts && pulseCounts < calibrationVars.calibrations[i].xOffset) {
          return i;
        }
      }

      console.error(Math.round(new Date().getTime() / 1000).toString(), " | v1.7_Parser::getCalibrationIndex(): No calibration index found. pulseCounts:", pulseCounts, " CalibrationVars: ", calibrationVars.calibrations);
      return -1;
    };
    
    retr.init(settings);

    return retr;
  };

  m.exports = v7_02;

})(module);
