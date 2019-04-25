(function(m) {

  m.exports = {};

  let Utils = (settings) => {

    let retr = {};
    let debug = 0;

    retr.init = (settings) => {
      // Set default settings if they are not injected.
      if (typeof(settings) != "undefined") {
        debug = (typeof(settings.debug) != "undefined" ? settings.debug : 0);
      } else {
        debug = 0;
      }

      if (debug & 1 === 0) {
        console.log(Math.round(new Date().getTime() / 1000).toString(), " | Utils::init() [settings]: ", JSON.stringify(settings, null, 2));
      }
    };

    retr.calcChecksum = (inputString) => {
      var sum = 0;

      if (debug & 2 === 0) {
        console.log(Math.round(new Date().getTime() / 1000).toString(), " | Utils::calcChecksum(): ", inputString);
      }

      if (inputString.length % 2 !== 0) {
        console.error("Input string is not correct length.");
        return -1;
      }
      try {
        for (var i = 0; i < inputString.length; i += 2) {
          sum = (sum + parseInt(inputString[i] + inputString[i + 1], 16)) % 256;
        }
      } catch (err) {
        console.error("Couldn't parse input number.");
        return -2;
      }
    
      var chars = sum.toString(16).toLocaleLowerCase();
      return retr.pad(chars, 2);
    }

    retr.pad = (str, size, withChar = "0", side = "left") => {
      var s = str + "";
      if (side === "left") {
        while (s.length < size) {
          s = withChar + s;
        }
      } else {
        while (s.length < size) {
          s = s + withChar;
        }
      }
      
      if (debug & 4 === 0) {
        console.log(Math.round(new Date().getTime() / 1000).toString(), " | Utils::pad(): ", str, size, withChar, side);
      }

      return s;
    };

    retr.hexToArr = (hexString) => {

      const upperLoop = 32;

      let lineHex = new Uint8ClampedArray(upperLoop);
      let loopCount = 0;
      let lineStringCopy = hexString.split('');

      while (lineStringCopy.length > 0) {
        try {
          const hexByte = lineStringCopy.splice(0, 2).join('')
          lineHex[loopCount] = parseInt(hexByte, 16);
        } catch (err) {
          console.error(Math.round(new Date().getTime() / 1000).toString(), " | Utils::parseLog() Error at line", i, " Error:", err);
        }

        if (loopCount > upperLoop) {
          console.error(Math.round(new Date().getTime() / 1000).toString(), " | Utils::parseLog() Log Parse Line exceeded loop limit at log line: ", i);
          break;
        }
        loopCount++;
      }

      return lineHex;
    };
    
    retr.pulseHexToInt = (pulseBytes) => {
      return Math.pow(2, (pulseBytes >> 11)) * (pulseBytes & 0b0000011111111111);
    };

    retr.littleEndianHex = (hexNum) => {
      if (!hexNum) {
        console.error(Math.round(new Date().getTime() / 1000).toString(), " | Utils::littleEndianHex() No hex number provided.");
        return -1;
      }
      return parseInt('0x' + hexNum.match(/../g).reverse().join(''), 16);
    };

    retr.pulseTo_uSv = (pulseCount, intervalTime, gsCalibration, calibrationIndex) => {
      if (!pulseCount || !gsCalibration || !intervalTime || !gsCalibration.calibrations || gsCalibration.calibrations.length === 0 || calibrationIndex === null || calibrationIndex === undefined) {
        console.error(Math.round(new Date().getTime() / 1000).toString(), " | Utils::pulseTo_uSv() Either no pulses:", pulseCount, " or calibration data: ", calibrationIndex, gsCalibration);
        return null;
      }

      let pulseRate = (pulseCount / intervalTime) * 0x200;

      if (!gsCalibration.calibrations[calibrationIndex]) {
        console.error(Math.round(new Date().getTime() / 1000).toString(), " | Utils::pulseTo_uSv() No coefficientLinear for index", calibrationIndex, " Pulses:", pulseCount, " Time(Seconds):", intervalTime, " Calibration Data: ", gsCalibration);
      }

      let ret_uSvHr = gsCalibration.calibrations[calibrationIndex].coefficientLinear * pulseRate;
      ret_uSvHr /= gsCalibration.calibrations[calibrationIndex].c2 - (gsCalibration.calibrations[calibrationIndex].c1 * pulseRate);

      return ret_uSvHr;
    };

    retr.init(settings);
    return retr;
  };

  m.exports = Utils;

})(module);
