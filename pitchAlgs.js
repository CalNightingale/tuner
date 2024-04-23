export function detectYIN(buffer) {
    const threshold = 0.15; // Typical threshold value for YIN
    const sampleRate = 44100; // Assuming a common sample rate
    const bufferSize = buffer.length;
    const halfBufferSize = Math.floor(bufferSize / 2);
    let cumulativeSum = 0;
    let difference = new Float32Array(halfBufferSize);
    let result = -1;
    let tau;

    // Step 1: Difference function
    for (let t = 0; t < halfBufferSize; t++) {
        difference[t] = 0;
        for (let i = 0; i < halfBufferSize; i++) {
            const delta = buffer[i] - buffer[i + t];
            difference[t] += delta * delta;
        }
    }

    // Step 2: Cumulative mean normalized difference function
    let d = new Float32Array(halfBufferSize);
    d[0] = 1;
    for (tau = 1; tau < halfBufferSize; tau++) {
        cumulativeSum += difference[tau];
        if (cumulativeSum == 0) {
            d[tau] = 1;
        } else {
            d[tau] = difference[tau] * tau / cumulativeSum;
        }
    }

    // Step 3: Absolute threshold
    for (tau = 2; tau < halfBufferSize; tau++) {
        if (d[tau] < threshold && d[tau] < d[tau - 1] && d[tau] < d[tau + 1]) {
            result = tau;
            break;
        }
    }

    // Step 4: Parabolic interpolation
    if (result !== -1) {
        const betterTau = parabolicInterpolation(d, result);
        return sampleRate / betterTau;
    } else {
        return -1; // Unable to detect pitch
    }
}

function parabolicInterpolation(d, tau) {
    const s0 = d[tau - 1];
    const s1 = d[tau];
    const s2 = d[tau + 1];
    const adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0));
    return tau + adjustment;
}
