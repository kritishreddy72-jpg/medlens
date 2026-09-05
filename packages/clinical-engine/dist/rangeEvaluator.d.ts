import { BiomarkerReading, BiomarkerStatus, ReferenceRange } from './types/clinical.js';
export declare const CONFIDENCE_THRESHOLD = 0.7;
export interface ParsedRange {
    low?: number;
    high?: number;
    operator?: '<' | '>' | '<=' | '>=' | 'range' | 'qualitative';
    is_present: boolean;
    raw: string;
}
/**
 * Deterministically parses a reference range string into numeric bounds.
 * NEVER infers or invents values if not specified by the lab.
 */
export declare function parseReferenceRangeString(rangeStr?: string): ParsedRange;
/**
 * Deterministically evaluates a test value against its explicit reference range.
 * Returns LOW, NORMAL, HIGH, CRITICAL, or UNSPECIFIED.
 */
export declare function evaluateBiomarkerStatus(testName: string, rawVal: number | string, range: ReferenceRange): BiomarkerStatus;
/**
 * Checks whether an extracted biomarker reading should be gated / locked for human review.
 */
export declare function isGatedForReview(reading: BiomarkerReading): boolean;
