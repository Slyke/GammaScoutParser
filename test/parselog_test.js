let testParse = require("../");

let testData = `
v
Version 7.02Lb07 1020 123456 003e 15.03.19 21:38:54
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
f5ed452821150319f5060001000100020003000400050006000700080009000ad4
000b000c000d000e000f0010001100120013001400150016001700180019001a28
`;

parser = testParse.Parser({}, testParse.Utils().getVersion(testData))

console.log(parser.parseLog(
  testParse.Utils().getLogs(testData),
  "0x" + testParse.Utils().getMemoryPointer(testData),
  testParse.Utils().getCalibration(testData)));
  