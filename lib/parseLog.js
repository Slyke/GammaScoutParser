(function(m) {

  m.exports = {};

  let Parser = function(settings, gammaScoutVersion = "", gammaScoutCalibration = "") {

    let retr = {};
    let debug = 0;
    let gVersion = gammaScoutVersion;
    let gCalibration = gammaScoutCalibration;

    retr.init = (settings) => {
      // Set default settings if they are not injected.
      if (typeof(settings) != "undefined") {
        debug = (typeof(settings.debug) != "undefined" ? settings.debug : 0);
      } else {
        debug = 0;
      }

      if (debug & 1 === 0) {
        console.log(Math.round(new Date().getTime() / 1000).toString(), " | Parse::init() [settings]: ", JSON.stringify(settings, null, 2));
      }

      if (debug & 2 === 0) {
        console.log(Math.round(new Date().getTime() / 1000).toString(), " | Parse::init() [gammaScoutVersion]: ", gammaScoutVersion);
      }
      
      if (debug & 4 === 0) {
        console.log(Math.round(new Date().getTime() / 1000).toString(), " | Parse::init() [gammaScoutCalibration]: ", gammaScoutCalibration);
      }
    };

    retr.parseLog = (logData, streamLength, gsCalibration) => {
      let v702 = require("./protocol_versions/" + gammaScoutVersion)();
      return v702.parseLog(logData, streamLength, gsCalibration);
    };

    retr.calibrationToArray = (gsCalibration) => {
      let v702 = require("./protocol_versions/" + gammaScoutVersion)();
      return v702.calibrationToArray(gsCalibration);
    };

    retr.getCalibrationIndex = (pulseCounts, calibrationVars) => {
      let v702 = require("./protocol_versions/" + gammaScoutVersion)();
      return v702.getCalibrationIndex(pulseCounts, calibrationVars);
    };

    retr.init(settings);

    return retr;
  };

  m.exports = Parser;

})(module);
