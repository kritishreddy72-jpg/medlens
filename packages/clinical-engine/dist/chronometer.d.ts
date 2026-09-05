import { BiomarkerReading } from './types/clinical';
export interface TrendAnalysis {
    test_name: string;
    unit: string;
    points: {
        date: string;
        value: number;
    }[];
    previous_value: number;
    current_value: number;
    delta_abs: number;
    delta_pct: number;
    clinical_trend: 'improving' | 'worsening' | 'stable';
    summary_text: string;
    sparkline_svg_path: string;
}
export type BiomarkerTrend = TrendAnalysis;
/**
 * Aggregates current and historical readings to compute longitudinal deltas and sparklines.
 */
export declare function calculateLongitudinalTrends(currentReadings: BiomarkerReading[], historicalReadings?: BiomarkerReading[]): TrendAnalysis[];
