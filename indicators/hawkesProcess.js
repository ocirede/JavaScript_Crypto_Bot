export function hawkesProcess(events, decay = 0.1, lambda = 0.1, alpha = 0.7) {
  let intensity = [];

  // Iterate over events
  for (let i = 0; i < events.length; i++) {
    let sum = 0;

    // Loop over previous events to calculate intensity contribution
    for (let j = 0; j < i; j++) {
      const timeDiff = (events[i].timestamp - events[j].timestamp) / 1000; 
      if (timeDiff > 0) {
        sum += Math.exp(-decay * timeDiff); 
      }
    }

    // Add base intensity and intensity from past events
    intensity.push(lambda + alpha * sum);
  }

  return intensity;
}
