import React, { useState } from 'react';
import { User, X, Plus, Trash2, ShieldCheck, Check, Activity, HeartPulse, BadgeAlert, Pill, Info } from 'lucide-react';
import { PatientProfile, PatientVitals } from '../types/clinical';

interface PatientIntakeModalProps {
  patient: PatientProfile;
  onSave: (updated: PatientProfile) => void;
  onClose: () => void;
}

export const PatientIntakeModal: React.FC<PatientIntakeModalProps> = ({
  patient,
  onSave,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'DEMO' | 'VITALS' | 'MEDS' | 'ALLERGIES' | 'CONDITIONS'>('DEMO');

  // Demographics
  const [name, setName] = useState(patient.name);
  const [age, setAge] = useState(patient.age);
  const [sex, setSex] = useState(patient.sex);
  const [bloodGroup, setBloodGroup] = useState(patient.blood_group || 'O+');
  const [symptoms, setSymptoms] = useState<string[]>(patient.symptoms);
  const [newSymptom, setNewSymptom] = useState('');

  // Vitals
  const [bp, setBp] = useState(patient.vitals?.blood_pressure || '120/80 mmHg');
  const [hr, setHr] = useState(patient.vitals?.heart_rate || 74);
  const [spo2, setSpo2] = useState(patient.vitals?.spo2 || 98);
  const [temp, setTemp] = useState(patient.vitals?.temperature || 98.6);
  const [bmi, setBmi] = useState(patient.vitals?.bmi || 24.2);

  // Conditions
  const [conditions, setConditions] = useState<string[]>(patient.conditions);
  const [newCondition, setNewCondition] = useState('');
  
  // Allergies
  const [allergies, setAllergies] = useState(patient.allergies);
  const [newAllergySubstance, setNewAllergySubstance] = useState('');
  const [newAllergyReaction, setNewAllergyReaction] = useState('');
  const [newAllergySeverity, setNewAllergySeverity] = useState<'Mild' | 'Moderate' | 'Severe'>('Moderate');

  // Medications
  const [medications, setMedications] = useState(patient.medications);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('');

  const handleAddSymptom = () => {
    if (newSymptom.trim()) {
      setSymptoms([...symptoms, newSymptom.trim()]);
      setNewSymptom('');
    }
  };

  const handleRemoveSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const handleAddCondition = () => {
    if (newCondition.trim()) {
      setConditions([...conditions, newCondition.trim()]);
      setNewCondition('');
    }
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleAddAllergy = () => {
    if (newAllergySubstance.trim()) {
      setAllergies([
        ...allergies,
        {
          substance: newAllergySubstance.trim(),
          reaction: newAllergyReaction.trim() || 'Allergic reaction',
          severity: newAllergySeverity
        }
      ]);
      setNewAllergySubstance('');
      setNewAllergyReaction('');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const handleAddMed = () => {
    if (newMedName.trim()) {
      setMedications([
        ...medications,
        {
          name: newMedName.trim(),
          dosage: newMedDose.trim() || 'Standard dose',
          frequency: newMedFreq.trim() || 'Daily'
        }
      ]);
      setNewMedName('');
      setNewMedDose('');
      setNewMedFreq('');
    }
  };

  const handleRemoveMed = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const vitalsObj: PatientVitals = {
      blood_pressure: bp,
      heart_rate: Number(hr) || 74,
      spo2: Number(spo2) || 98,
      temperature: Number(temp) || 98.6,
      bmi: Number(bmi) || 24.2
    };

    const updated: PatientProfile = {
      ...patient,
      name,
      age: Number(age) || patient.age,
      sex,
      blood_group: bloodGroup,
      vitals: vitalsObj,
      symptoms,
      conditions,
      allergies,
      medications,
      provenance: 'USER_REPORTED'
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Patient Clinical Intake & Baseline Record
              </h2>
              <p className="text-xs text-slate-500">
                Provenance: Tagged explicitly as USER_REPORTED
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center space-x-1 border-b border-slate-200 text-xs font-semibold overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('DEMO')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'DEMO' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Demographics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('VITALS')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'VITALS' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Vitals
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MEDS')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'MEDS' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Medications ({medications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ALLERGIES')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'ALLERGIES' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Allergies ({allergies.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CONDITIONS')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'CONDITIONS' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Conditions & Symptoms
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
          
          {/* TAB 1: Demographics */}
          {activeTab === 'DEMO' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Biological Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full sm:w-1/3 px-3 py-2 border rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="O+">O Positive (O+)</option>
                  <option value="O-">O Negative (O-)</option>
                  <option value="A+">A Positive (A+)</option>
                  <option value="A-">A Negative (A-)</option>
                  <option value="B+">B Positive (B+)</option>
                  <option value="B-">B Negative (B-)</option>
                  <option value="AB+">AB Positive (AB+)</option>
                  <option value="AB-">AB Negative (AB-)</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 2: Vitals */}
          {activeTab === 'VITALS' && (
            <div className="space-y-3">
              <p className="text-slate-500">
                Record latest outpatient clinic or self-monitored vital signs:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Blood Pressure</label>
                  <input
                    type="text"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    placeholder="e.g. 128/82 mmHg"
                    className="w-full px-3 py-2 border rounded-xl text-slate-900 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    value={hr}
                    onChange={(e) => setHr(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl text-slate-900 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Oxygen Saturation SpO2 (%)</label>
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl text-slate-900 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Temperature (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl text-slate-900 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Body Mass Index (BMI)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bmi}
                    onChange={(e) => setBmi(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl text-slate-900 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Active Medications */}
          {activeTab === 'MEDS' && (
            <div className="space-y-3">
              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2">
                <span className="font-semibold text-purple-900 block">Add Active Medication:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Medication name (e.g. Metformin)"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    className="px-3 py-1.5 bg-white border rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Dosage (e.g. 500 mg)"
                    value={newMedDose}
                    onChange={(e) => setNewMedDose(e.target.value)}
                    className="px-3 py-1.5 bg-white border rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Frequency (e.g. Twice daily)"
                    value={newMedFreq}
                    onChange={(e) => setNewMedFreq(e.target.value)}
                    className="px-3 py-1.5 bg-white border rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddMed}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Regimen</span>
                </button>
              </div>

              {/* Medication List */}
              <div className="space-y-2">
                {medications.map((med, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-xl">
                    <div>
                      <span className="font-bold text-slate-800">{med.name}</span>
                      <span className="text-slate-500 ml-2">{med.dosage} • {med.frequency}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMed(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Allergies */}
          {activeTab === 'ALLERGIES' && (
            <div className="space-y-3">
              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 space-y-2">
                <span className="font-semibold text-rose-900 block">Add Drug / Environmental Allergy:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Allergen (e.g. Penicillin, Sulfa)"
                    value={newAllergySubstance}
                    onChange={(e) => setNewAllergySubstance(e.target.value)}
                    className="px-3 py-1.5 bg-white border rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Reaction (e.g. Anaphylaxis, Hives)"
                    value={newAllergyReaction}
                    onChange={(e) => setNewAllergyReaction(e.target.value)}
                    className="px-3 py-1.5 bg-white border rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <select
                    value={newAllergySeverity}
                    onChange={(e) => setNewAllergySeverity(e.target.value as any)}
                    className="px-3 py-1.5 bg-white border rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe (Anaphylaxis)</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAddAllergy}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Document Allergy</span>
                </button>
              </div>

              {/* Allergy List */}
              <div className="space-y-2">
                {allergies.map((a, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-xl">
                    <div>
                      <span className="font-bold text-rose-800">⚠️ {a.substance}</span>
                      <span className="text-slate-600 ml-2">({a.reaction}) • Severity: {a.severity}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAllergy(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Conditions & Symptoms */}
          {activeTab === 'CONDITIONS' && (
            <div className="space-y-4">
              {/* Conditions */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-800 block">Documented Chronic Conditions:</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    className="flex-1 px-3 py-1.5 border rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCondition}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {conditions.map((c, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center space-x-1.5">
                      <span>{c}</span>
                      <button type="button" onClick={() => handleRemoveCondition(idx)} className="text-blue-400 hover:text-blue-700">✕</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Presenting Symptoms */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-800 block">Current Presentation / Symptoms:</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="e.g. Fatigue, Productive cough, Thirst"
                    value={newSymptom}
                    onChange={(e) => setNewSymptom(e.target.value)}
                    className="flex-1 px-3 py-1.5 border rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSymptom}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-xl font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {symptoms.map((s, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center space-x-1.5">
                      <span>{s}</span>
                      <button type="button" onClick={() => handleRemoveSymptom(idx)} className="text-slate-400 hover:text-slate-700">✕</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="pt-3 flex items-center justify-between border-t border-slate-100">
          <div className="flex items-center space-x-1 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Updates are immediately integrated into clinical radar cross-checks</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Patient Record</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
