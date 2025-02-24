export function calculateADX(highs, lows, closes, period) {
    // Check if there is enough data to calculate ADX
    if (highs.length < period || lows.length < period || closes.length < period) {
        console.error("Not enough data to calculate ADX");
        return { adx: new Array(highs.length).fill(null) };
    }

    let plusDM = new Array(highs.length).fill(0);
    let minusDM = new Array(lows.length).fill(0);
    let tr = new Array(highs.length).fill(0);
    let smoothedPlusDM = [];
    let smoothedMinusDM = [];
    let smoothedTR = [];
    let plusDI = [];
    let minusDI = [];
    let dx = [];
    let adx = new Array(highs.length).fill(null); 

    // Calculate True Range and Directional Movements
    for (let i = 1; i < highs.length; i++) {
        let upMove = highs[i] - highs[i - 1];
        let downMove = lows[i - 1] - lows[i];

        plusDM[i] = upMove > downMove && upMove > 0 ? upMove : 0;
        minusDM[i] = downMove > upMove && downMove > 0 ? downMove : 0;

        let highLow = highs[i] - lows[i];
        let highClose = Math.abs(highs[i] - closes[i - 1]);
        let lowClose = Math.abs(lows[i] - closes[i - 1]);

        tr[i] = Math.max(highLow, highClose, lowClose);
    }

    // Calculate initial smoothed values
    let sumTR = tr.slice(0, period).reduce((a, b) => a + b, 0);
    let sumPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
    let sumMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0);

    smoothedTR.push(sumTR);
    smoothedPlusDM.push(sumPlusDM);
    smoothedMinusDM.push(sumMinusDM);

    // Smooth the True Range and Directional Movements
    for (let i = period; i < tr.length; i++) {
        let smoothedTRValue = (smoothedTR[i - period] * (period - 1) + tr[i]) / period;
        let smoothedPlusDMValue = (smoothedPlusDM[i - period] * (period - 1) + plusDM[i]) / period;
        let smoothedMinusDMValue = (smoothedMinusDM[i - period] * (period - 1) + minusDM[i]) / period;

        smoothedTR.push(smoothedTRValue);
        smoothedPlusDM.push(smoothedPlusDMValue);
        smoothedMinusDM.push(smoothedMinusDMValue);
    }

    // Calculate the Directional Indicators and DX
    for (let i = 0; i < smoothedTR.length; i++) {
        let plusDIValue = (smoothedPlusDM[i] / smoothedTR[i]) * 100;
        let minusDIValue = (smoothedMinusDM[i] / smoothedTR[i]) * 100;

        plusDI.push(plusDIValue);
        minusDI.push(minusDIValue);

        if (plusDIValue + minusDIValue !== 0) {
            let dxValue = (Math.abs(plusDIValue - minusDIValue) / (plusDIValue + minusDIValue)) * 100;
            dx.push(dxValue);
        } else {
            dx.push(0); 
        }
    }

    // Calculate the initial ADX value
    if (dx.length >= period) {
        let sumDX = dx.slice(0, period).reduce((a, b) => a + b, 0) / period;
        adx[period - 1] = sumDX; // Set the first ADX value after the initial period

        // Calculate subsequent ADX values
        for (let i = period; i < dx.length; i++) {
            let adxValue = (adx[i - 1] * (period - 1) + dx[i]) / period;
            adx[i + period - 1] = adxValue; 
        }
    }

    return { adx }; 
}
