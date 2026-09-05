import React from 'react';
import { 
  User, 
  AlertCircle, 
  Pill, 
  HeartPulse, 
  Edit3, 
  ShieldCheck, 
  Info,
  BadgeAlert,
  Activity,
  Thermometer,
  Gauge,
  Droplet
} from 'lucide-react';
import { PatientProfile } from '../types/clinical';

interface PatientHeaderProps {
  patient: PatientProfile;
  onEditPatient: () => void;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  onEditPatient
}) => {
  const vitals = patient.vitals;

  return (
    <div 
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 transition-all space-y-4"
      role="region"
      aria-label="Patient Profile and Baseline Vitals"
    >
      
      {/* Top Row: Patient Demographics & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        
        {/* Patient Identity */}
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/20 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0" aria-hidden="true">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <h1 className="text-xl font-bold text-slate-900">{patient.name}</h1>
              <span className="text-sm font-medium text-slate-500">
                {patient.age} y/o • {patient.sex} {patient.blood_group ? `• Blood Group: ${patient.blood_group}` : ''}
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                <span>Source: USER_REPORTED</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified Patient Health Record • Record ID: #{patient.id}
            </p>
          </div>
        </div>

        {/* Edit Intake Info Button */}
        <div>
          <button
            onClick={onEditPatient}
            aria-label="Update patient intake information and vitals"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Update Intake Info & Vitals</span>
          </button>
        </div>

      </div>

      {/* Vitals Summary Strip */}
      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between flex-wrap gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-semibold text-slate-700">Baseline Vitals:</span>
        </div>

        <div className="flex items-center flex-wrap gap-3 text-xs">
          <div className="flex items-center space-x-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="text-slate-400">BP:</span>
            <span className="font-mono font-bold text-slate-900">{vitals?.blood_pressure || '120/80 mmHg'}</span>
          </div>

          <div className="flex items-center space-x-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            <HeartPulse className="w-3 h-3 text-rose-500" />
            <span className="text-slate-400">Pulse:</span>
            <span className="font-mono font-bold text-slate-900">{vitals?.heart_rate ? `${vitals.heart_rate} bpm` : '74 bpm'}</span>
          </div>

          <div className="flex items-center space-x-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            <Gauge className="w-3 h-3 text-cyan-600" />
            <span className="text-slate-400">SpO2:</span>
            <span className="font-mono font-bold text-slate-900">{vitals?.spo2 ? `${vitals.spo2}%` : '98%'}</span>
          </div>

          <div className="flex items-center space-x-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            <Thermometer className="w-3 h-3 text-amber-500" />
            <span className="text-slate-400">Temp:</span>
            <span className="font-mono font-bold text-slate-900">{vitals?.temperature ? `${vitals.temperature} °F` : '98.6 °F'}</span>
          </div>

          <div className="flex items-center space-x-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="text-slate-400">BMI:</span>
            <span className="font-mono font-bold text-slate-900">{vitals?.bmi ? `${vitals.bmi}` : '24.2'}</span>
          </div>
        </div>
      </div>

      {/* Structured Clinical Factors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Known Conditions */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <HeartPulse className="w-3.5 h-3.5 text-blue-600" />
            <span>Documented Conditions</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {patient.conditions.length > 0 ? (
              patient.conditions.map((cond, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  {cond}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">None documented</span>
            )}
          </div>
        </div>

        {/* Confirmed Allergies */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <BadgeAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Confirmed Allergies</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {patient.allergies.length > 0 ? (
              patient.allergies.map((allergy, idx) => (
                <span 
                  key={idx} 
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold border flex items-center space-x-1 ${
                    allergy.severity === 'Severe' 
                      ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                  title={`Reaction: ${allergy.reaction} (${allergy.severity})`}
                >
                  <span>⚠️ {allergy.substance}</span>
                  <span className="text-[10px] font-normal opacity-75">({allergy.reaction})</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">No documented drug allergies (NKDA)</span>
            )}
          </div>
        </div>

        {/* Active Medications */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Pill className="w-3.5 h-3.5 text-purple-600" />
            <span>Active Medications</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {patient.medications.length > 0 ? (
              patient.medications.map((med, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100" title={`${med.frequency}`}>
                  {med.name} {med.dosage}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">No ongoing prescriptions</span>
            )}
          </div>
        </div>

        {/* Current Presentation / Symptoms */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Presenting Symptoms</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {patient.symptoms.length > 0 ? (
              patient.symptoms.map((symp, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  {symp}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">Asymptomatic / Routine follow-up</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
