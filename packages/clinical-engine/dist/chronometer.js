/**
 * Aggregates current and historical readings to compute longitudinal deltas and sparklines.
 */
export function calculateLongitudinalTrends(currentReadings, historicalReadings = []) {
    const allReadings = [...historicalReadings, ...currentReadings];
    const grouped = {};
    for (const r of allReadings) {
        // Only include numeric, confidence-verified readings in trend math
        if (typeof r.value === 'number' && !r.needs_review) {
            const key = r.test_name.trim().toLowerCase();
            if (!grouped[key])
                grouped[key] = [];
            grouped[key].push(r);
        }
    }
    const trends = [];
    for (const [, list] of Object.entries(grouped)) {
        if (list.length < 2)
            continue;
        // Sort chronologically by date
        list.sort((a, b) => new Date(a.date_collected).getTime() - new Date(b.date_collected).getTime());
        const prev = list[list.length - 2];
        const curr = list[list.length - 1];
        const prevVal = Number(prev.value);
        const currVal = Number(curr.value);
        if (isNaN(prevVal) || isNaN(currVal) || prevVal === 0)
            continue;
        const deltaAbs = currVal - prevVal;
        const deltaPct = (deltaAbs / prevVal) * 100;
        // Determine clinical directionality
        let clinical_trend = 'stable';
        const nameLower = curr.test_name.toLowerCase();
        const isTypicallyHarmfulWhenHigh = nameLower.includes('glucose') ||
            nameLower.includes('hba1c') ||
            nameLower.includes('ldl') ||
            (nameLower.includes('cholesterol') && !nameLower.includes('hdl')) ||
            nameLower.includes('triglyceride') ||
            nameLower.includes('creatinine') ||
            nameLower.includes('wbc');
        const isTypicallyHarmfulWhenLow = nameLower.includes('hemoglobin') ||
            nameLower.includes('platelet') ||
            nameLower.includes('hdl') ||
            nameLower.includes('egfr') ||
            nameLower.includes('rbc');
        if (Math.abs(deltaPct) < 2) {
            clinical_trend = 'stable';
        }
        else if (isTypicallyHarmfulWhenHigh) {
            clinical_trend = deltaPct < 0 ? 'improving' : 'worsening';
        }
        else if (isTypicallyHarmfulWhenLow) {
            clinical_trend = deltaPct > 0 ? 'improving' : 'worsening';
        }
        else {
            clinical_trend = 'stable';
        }
        // Generate simple SVG path for sparkline
        const points = list.map(item => ({ date: item.date_collected, value: Number(item.value) }));
        const values = points.map(p => p.value);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const range = maxVal - minVal || 1;
        const width = 80;
        const height = 24;
        const pathCoords = points.map((p, idx) => {
            const x = (idx / (points.length - 1)) * width;
            const y = height - ((p.value - minVal) / range) * (height - 6) - 3;
            return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        }).join(' ');
        const sign = deltaPct > 0 ? '+' : '';
        trends.push({
            test_name: curr.test_name,
            unit: curr.unit,
            points,
            previous_value: prevVal,
            current_value: currVal,
            delta_abs: Number(deltaAbs.toFixed(2)),
            delta_pct: Number(deltaPct.toFixed(1)),
            clinical_trend,
            summary_text: `${curr.test_name}: changed by ${sign}${deltaPct.toFixed(1)}% (${prevVal} → ${currVal} ${curr.unit})`,
            sparkline_svg_path: pathCoords
        });
    }
    return trends;
}
