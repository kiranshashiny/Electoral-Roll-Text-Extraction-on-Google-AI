import React from 'react';
import { Cpu, CheckCircle2, Clock, Activity, FileCheck, AlertCircle, Loader2 } from 'lucide-react';

interface ProgressTrackerProps {
  isRunning: boolean;
  progressPercent: number;
  currentPhase: string;
  statusMessage: string;
  recordsCount: number;
  currentPage?: number;
  totalPages?: number;
  outputFileName: string;
  durationMs?: number;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  isRunning,
  progressPercent,
  currentPhase,
  statusMessage,
  recordsCount,
  currentPage,
  totalPages,
  outputFileName,
  durationMs = 0
}) => {
  // Define compilation and execution checkpoints
  const steps = [
    {
      label: 'Compile Engine',
      desc: 'Checking TypeScript AST, grammar & tokenizers',
      done: progressPercent >= 25,
      active: progressPercent > 0 && progressPercent < 25
    },
    {
      label: 'Matrix Calibration',
      desc: 'Validating 3-column x 10-row elector card grid',
      done: progressPercent >= 50,
      active: progressPercent >= 25 && progressPercent < 50
    },
    {
      label: 'OCR & Regex Tokenizer',
      desc: 'Extracting Voter ID, Name, Relation, House No, Age, Gender',
      done: progressPercent >= 90,
      active: progressPercent >= 50 && progressPercent < 90
    },
    {
      label: 'CSV Compilation',
      desc: `Generating outputs/${outputFileName}`,
      done: progressPercent === 100,
      active: progressPercent >= 90 && progressPercent < 100
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isRunning 
              ? 'bg-amber-100 text-amber-700 animate-pulse'
              : progressPercent === 100 
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-600'
          }`}>
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : progressPercent === 100 ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Cpu className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Compiler & Execution Status
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                isRunning
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : progressPercent === 100
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                {isRunning ? 'Running Parser' : progressPercent === 100 ? 'Compilation Complete' : 'Idle / Ready'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {statusMessage || 'Engine initialized and waiting for dataset execution.'}
            </p>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="flex items-center space-x-4 text-xs text-slate-600 self-start sm:self-auto bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          <div>
            <span className="text-slate-400">Electors:</span>{' '}
            <strong className="text-slate-900 font-mono">{recordsCount}</strong>
          </div>
          {totalPages && (
            <div>
              <span className="text-slate-400">Pages:</span>{' '}
              <strong className="text-slate-900 font-mono">{currentPage || 0}/{totalPages}</strong>
            </div>
          )}
          <div>
            <span className="text-slate-400">Duration:</span>{' '}
            <strong className="text-slate-900 font-mono">{(durationMs / 1000).toFixed(2)}s</strong>
          </div>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-medium text-slate-700">
            Progress ({progressPercent}%)
          </span>
          <span className="font-mono text-slate-500 text-[11px]">
            Target: outputs/{outputFileName}
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              progressPercent === 100
                ? 'bg-emerald-500'
                : 'bg-indigo-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step Checkpoints */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              step.done
                ? 'bg-emerald-50/50 border-emerald-200 text-slate-900'
                : step.active
                  ? 'bg-indigo-50/50 border-indigo-300 text-indigo-900 ring-1 ring-indigo-500/20'
                  : 'bg-slate-50/50 border-slate-200 text-slate-500 opacity-70'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold">{step.label}</span>
              {step.done ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : step.active ? (
                <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              ) : (
                <span className="text-[10px] text-slate-400 font-mono">0{idx + 1}</span>
              )}
            </div>
            <p className="text-[11px] leading-tight text-slate-600 line-clamp-2">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
