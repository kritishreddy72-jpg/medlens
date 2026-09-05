import jsPDF from 'jspdf';
import { BiomarkerReading, PatientProfile, ClinicalConflict } from '../types/clinical';
import { SbarReport } from '../engine/sbarGenerator';

export function generateClinicalSummaryPdf(
  patient: PatientProfile,
  readings: BiomarkerReading[],
  conflicts: ClinicalConflict[],
  documentTitle: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 16;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MEDLENS — CLINICAL INFORMATION INTELLIGENCE RECORD', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Structured Medical Summary & Source Provenance Record • Non-Diagnostic Pre-Consultation Brief', 14, 17);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 45, 17);

  y = 32;

  // Patient Demographics Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(patient.name, 18, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`${patient.age} y/o • ${patient.sex} ${patient.blood_group ? `• Blood Group: ${patient.blood_group}` : ''} • Record ID: #${patient.id}`, 18, y + 13);
  
  if (patient.vitals?.blood_pressure) {
    doc.text(`Vitals: BP ${patient.vitals.blood_pressure} | HR ${patient.vitals.heart_rate || '--'} bpm | SpO2 ${patient.vitals.spo2 || '--'}% | Temp ${patient.vitals.temperature || '--'} F`, 18, y + 19);
  } else {
    doc.text(`Presenting Symptoms: ${patient.symptoms.length > 0 ? patient.symptoms.join(', ') : 'Routine Follow-up'}`, 18, y + 19);
  }

  y += 32;

  // Conditions, Allergies, Medications summary line
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Active Medications:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const medsStr = patient.medications.length > 0 
    ? patient.medications.map(m => `${m.name} ${m.dosage}`).join(', ')
    : 'None reported';
  doc.text(medsStr, 48, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Confirmed Allergies:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(185, 28, 28); // rose-700
  const allergyStr = patient.allergies.length > 0
    ? patient.allergies.map(a => `${a.substance} (${a.reaction})`).join(', ')
    : 'No known drug allergies (NKDA)';
  doc.text(allergyStr, 48, y);

  y += 8;

  // Active Critical Clinical Conflicts Banner (if any)
  if (conflicts.length > 0) {
    const criticalConflicts = conflicts.filter(c => c.severity === 'CRITICAL');
    if (criticalConflicts.length > 0) {
      doc.setFillColor(254, 242, 242); // rose-50
      doc.setDrawColor(254, 202, 202); // rose-200
      doc.roundedRect(14, y, pageWidth - 28, 14, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(153, 27, 27); // rose-800
      doc.text(`CLINICAL RADAR ALERT: ${criticalConflicts[0].title}`, 18, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(doc.splitTextToSize(criticalConflicts[0].description, pageWidth - 36), 18, y + 9);
      y += 18;
    }
  }

  // Section Header: Laboratory Biomarkers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Structured Laboratory Biomarkers (Source: ${documentTitle})`, 14, y);
  y += 4;

  // Table Header
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.rect(14, y, pageWidth - 28, 7, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Biomarker / Test Name', 16, y + 4.8);
  doc.text('Result', 75, y + 4.8);
  doc.text('Source Reference Range', 105, y + 4.8);
  doc.text('Status', 150, y + 4.8);
  doc.text('Verification', 175, y + 4.8);

  y += 7;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  for (let i = 0; i < readings.length; i++) {
    const r = readings[i];

    // Page overflow check
    if (y > 265) {
      doc.addPage();
      y = 16;
    }

    const rowBg = i % 2 === 0 ? 255 : 248;
    doc.setFillColor(rowBg, rowBg, rowBg);
    doc.rect(14, y, pageWidth - 28, 6.5, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.line(14, y + 6.5, pageWidth - 14, y + 6.5);

    // Test name
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(doc.splitTextToSize(r.test_name, 56)[0], 16, y + 4.3);

    // Value + Unit
    doc.setFont('helvetica', 'normal');
    doc.text(`${r.value} ${r.unit}`, 75, y + 4.3);

    // Reference Range (Strict from source)
    const rangeText = r.reference_range.is_present ? r.reference_range.text_range : 'Unspecified';
    doc.setTextColor(71, 85, 105);
    doc.text(rangeText, 105, y + 4.3);

    // Status
    if (r.status === 'HIGH' || r.status === 'CRITICAL') {
      doc.setTextColor(180, 83, 9); // amber-700
      doc.setFont('helvetica', 'bold');
      doc.text(r.status === 'CRITICAL' ? 'CRITICAL HIGH' : 'HIGH', 150, y + 4.3);
    } else if (r.status === 'LOW') {
      doc.setTextColor(29, 78, 216); // blue-700
      doc.setFont('helvetica', 'bold');
      doc.text('LOW', 150, y + 4.3);
    } else if (r.status === 'NORMAL') {
      doc.setTextColor(22, 101, 52); // emerald-700
      doc.setFont('helvetica', 'normal');
      doc.text('Normal', 150, y + 4.3);
    } else {
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'italic');
      doc.text('Unspecified', 150, y + 4.3);
    }

    // Provenance
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(r.provenance === 'EXTRACTED_VERIFIED' ? 'Verified' : 'AI Extracted', 175, y + 4.3);

    y += 6.5;
  }

  y += 6;

  // Footer Disclaimer
  if (y > 260) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('RESPONSIBLE CLINICAL AI SAFETY NOTICE & ZERO-HALLUCINATION POLICY', 18, y + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const disclaimer = 'This document organizes and tracks objective medical findings and does not constitute a medical diagnosis or treatment plan. Reference ranges are strictly reproduced from source documents and are never artificially generated. Always review findings with your licensed healthcare provider.';
  doc.text(doc.splitTextToSize(disclaimer, pageWidth - 36), 18, y + 9);

  // Save the PDF
  doc.save(`MedLens-Summary-${patient.name.replace(/\s+/g, '_')}-${Date.now()}.pdf`);
}
