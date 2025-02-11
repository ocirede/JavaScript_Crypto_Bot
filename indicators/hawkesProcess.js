export function hawkesProcess(events, decay = 0.1) {
  let intensity = [];
  let lambda = 0.01; // Baseline intensity
  let alpha = 0.5; // Excitation factor

  for (let i = 0; i < events.length; i++) {
    let sum = 0;
    for (let j = 0; j < i; j++) {
      sum += Math.exp(-decay * (events[i] - events[j])); // Exponential decay
    }
    intensity.push(lambda + alpha * sum);
  }

  return intensity;
}
