GammaScout Geiger Counter Log Parser

Will update this readme more later.

There are some slight differences between how the GammaScout and this module calculates floating point numbers, as such, some uSv/hr readings will differ. This module will always predict slightly higher uSv/Hr than the software for the GammaScout. The differences are less than 4% for radiation levels below around 2uSv/h. Run `npm run test_calib` to see the exact differences. This module will be more accurate than any other pulse count to uSv/Hr algorithms you will find online, since it uses the calibration settings specific to the GammaScout that generated the logs.

This currently only supports Protocol `v7.02Lb07`. I will add more as I have access to more GammaScouts with different protocols.

Shout out to `johndoe31415` (https://github.com/johndoe31415/gammascoututil) for helping figure the calibration calculations out!

Usage:
```
let gsParse = require("GammaScout-Parser");

// This data is the raw data from the GammaScout's memory. Can be retrieved by following this guide:
// https://www.reddit.com/r/GammaScout/comments/b1p790/decoding_the_geiger_counter_serial_data/
let gsLogData = `
v
Version 7.02Lb07 1020 123456 001e 15.03.19 21:38:54
c
GAMMA-SCOUT SoftCal gueltig
b0 00 07 7e 00
cd0900001a05f6da2d00
9a210000c1e1acb12d00
9a7d00002f0995c63c00
00a0020002009af24b00
9a46080004001cc23c00
c47d130085010e9e2d00
15dd4400990210b32d00
b
GAMMA-SCOUT Protokoll
f5ed452821150319f5060001000100020003000400050006000700080009000ad4`;

parser = gsParse.Parser({}, gsParse.Utils().getVersion(gsLogData))

console.log(parser.parseLog(
  gsParse.Utils().getLogs(gsLogData),
  "0x" + gsParse.Utils().getMemoryPointer(gsLogData),
  gsParse.Utils().getCalibration(gsLogData)));
```

Will produce something like:

```
[ { event: 'pulseLog',
    pulses: 1,
    logBeginTime: '2019-03-15T21:28:45.000Z',
    eventTime: '2019-03-15T21:28:45.000Z',
    interval: 3600,
    logIndex: 1,
    uSvPerHr: 0.00011417562214287485 },
  { event: 'pulseLog',
    pulses: 1,
    logBeginTime: '2019-03-15T21:28:45.000Z',
    eventTime: '2019-03-15T22:28:45.000Z',
    interval: 3600,
    logIndex: 2,
    uSvPerHr: 0.00011417562214287485 },
  { event: 'pulseLog',
    pulses: 2,
    logBeginTime: '2019-03-15T21:28:45.000Z',
    eventTime: '2019-03-15T23:28:45.000Z',
    interval: 3600,
    logIndex: 3,
    uSvPerHr: 0.0002283512558316426 },
  { event: 'pulseLog',
    pulses: 3,
    logBeginTime: '2019-03-15T21:28:45.000Z',
    eventTime: '2019-03-16T00:28:45.000Z',
    interval: 3600,
    logIndex: 4,
    uSvPerHr: 0.00034252690106630496 },
  { event: 'pulseLog',
    pulses: 4,
    logBeginTime: '2019-03-15T21:28:45.000Z',
    eventTime: '2019-03-16T01:28:45.000Z',
    interval: 3600,
    logIndex: 5,
    uSvPerHr: 0.00045670255784686367 },
  { event: 'pulseLog',
    pulses: 5,
    logBeginTime: '2019-03-15T21:28:45.000Z',
    eventTime: '2019-03-16T02:28:45.000Z',
    interval: 3600,
    logIndex: 6,
    uSvPerHr: 0.0005708782261733204 },
  { event: 'pulseLog',
    pulses: 6,
    logBeginTime: '2019-03-15T21:28:45.000Z',
    eventTime: '2019-03-16T03:28:45.000Z',
    interval: 3600,
    logIndex: 7,
    uSvPerHr: 0.0006850539060456773 },
  { event: 'pulseLog',
    pulses: 7,
    logBeginTime: '2019-03-15T21:28:45.000Z',
    eventTime: '2019-03-16T04:28:45.000Z',
    interval: 3600,
    logIndex: 8,
    uSvPerHr: 0.0007992295974639356 },
  { event: 'pulseLog',
    pulses: 8,
    logBeginTime: '2019-03-15T21:28:45.000Z',
    eventTime: '2019-03-16T05:28:45.000Z',
    interval: 3600,
    logIndex: 9,
    uSvPerHr: 0.0009134053004280975 },
  { event: 'pulseLog',
    pulses: 9,
    logBeginTime: '2019-03-15T21:28:45.000Z',
    eventTime: '2019-03-16T06:28:45.000Z',
    interval: 3600,
    logIndex: 10,
    uSvPerHr: 0.0010275810149381643 } ]
```