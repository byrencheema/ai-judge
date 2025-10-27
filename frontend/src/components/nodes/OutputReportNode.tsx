import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { FileText, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react";

export interface OutputReportNodeData {
  totalEvaluations?: number;
  passed?: number;
  failed?: number;
  inconclusive?: number;
  isGenerating?: boolean;
  reportId?: number;
}

const OutputReportNode = ({ data, selected }: NodeProps<OutputReportNodeData>) => {
  const {
    totalEvaluations = 0,
    passed = 0,
    failed = 0,
    inconclusive = 0,
    isGenerating,
    reportId,
  } = data;

  const hasData = totalEvaluations > 0;
  const passRate = hasData ? ((passed / totalEvaluations) * 100).toFixed(1) : "0.0";

  return (
    <div
      className={`
        bg-panel border-2 rounded-sm p-5 min-w-[340px] max-w-[380px]
        shadow-2xl transition-all duration-200 relative
        ${selected ? "border-purple-400 shadow-purple-400/50" : "border-slate/60"}
        ${isGenerating ? "animate-pulse" : ""}
        hover:border-purple-400/50
      `}
    >
      {/* Input Handle - receives from questions */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white/20 !rounded-none"
        style={{ boxShadow: '0 0 8px rgba(147, 51, 234, 0.5)' }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-purple-500/20 rounded-none border border-purple-500/30">
          <FileText className="w-4 h-4 text-purple-400" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            Output Report
          </div>
          <div className="text-sm font-semibold text-zinc-100">Evaluation Results</div>
        </div>
        {reportId && (
          <button
            className="p-1.5 bg-accent/20 hover:bg-accent/30 rounded transition-colors"
            title="Download Report"
          >
            <Download className="w-3.5 h-3.5 text-accent" />
          </button>
        )}
      </div>

      {/* Stats */}
      {hasData ? (
        <div className="space-y-3">
          {/* Pass rate indicator - redesigned without box */}
          <div className="pb-3 border-b border-slate/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500 font-mono tracking-wider">PASS RATE</span>
              <span
                className={`text-2xl font-bold font-mono tabular-nums ${
                  parseFloat(passRate) >= 80
                    ? "text-green-400"
                    : parseFloat(passRate) >= 50
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {passRate}%
              </span>
            </div>
            <div className="w-full bg-slate/40 rounded-none h-1 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  parseFloat(passRate) >= 80
                    ? "bg-green-500"
                    : parseFloat(passRate) >= 50
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${passRate}%` }}
              />
            </div>
          </div>

          {/* Verdict breakdown */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-500/10 border border-green-500/30 rounded-none p-2">
              <div className="flex items-center gap-1 mb-1">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400 font-mono">PASS</span>
              </div>
              <div className="text-lg font-bold text-green-400 font-mono">{passed}</div>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-none p-2">
              <div className="flex items-center gap-1 mb-1">
                <XCircle className="w-3 h-3 text-red-400" />
                <span className="text-xs text-red-400 font-mono">FAIL</span>
              </div>
              <div className="text-lg font-bold text-red-400 font-mono">{failed}</div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-none p-2">
              <div className="flex items-center gap-1 mb-1">
                <AlertCircle className="w-3 h-3 text-yellow-400" />
                <span className="text-xs text-yellow-400 font-mono">N/A</span>
              </div>
              <div className="text-lg font-bold text-yellow-400 font-mono">{inconclusive}</div>
            </div>
          </div>

          {/* Total */}
          <div className="pt-2 border-t border-slate/40 text-center">
            <span className="text-xs text-zinc-500 font-mono">
              TOTAL EVALUATIONS: <span className="text-zinc-300">{totalEvaluations}</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-2" />
          <div className="text-sm text-zinc-500 font-mono">
            {isGenerating ? "GENERATING REPORT..." : "NO DATA"}
          </div>
          <div className="text-xs text-zinc-600 mt-1">
            {isGenerating ? "Please wait" : "Connect and run workflow"}
          </div>
        </div>
      )}

      {/* Status */}
      {reportId && (
        <div className="mt-3 pt-2 border-t border-slate/40">
          <span className="text-xs text-zinc-500 font-mono">REPORT ID: {reportId}</span>
        </div>
      )}

      {/* Glow effect when selected */}
      {selected && (
        <div className="absolute inset-0 -z-10 bg-accent/5 blur-xl rounded-lg" />
      )}

      {/* Generation glow */}
      {isGenerating && (
        <div className="absolute inset-0 -z-10 bg-purple-400/10 blur-xl rounded-lg animate-pulse" />
      )}
    </div>
  );
};

export default memo(OutputReportNode);
