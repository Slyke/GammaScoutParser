res = [];

res.push(require('./calibration_benchmark')('calibration_benchmark_120s'));
res.push(require('./calibration_benchmark')('calibration_benchmark_600s'));
res.push(require('./calibration_benchmark')('calibration_benchmark_3600s'));

res.map((result) => {
  console.log(result);
});
