import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Scale, Zap } from "lucide-react";
import { Judge } from "../../types";

export interface JudgeNodeData {
  judge: Judge;
  isExecuting?: boolean;
}

const JudgeNode = ({ data, selected }: NodeProps<JudgeNodeData>) => {
  const { judge, isExecuting } = data;

  return (
    <div
      className={`
        bg-panel border-2 rounded-sm p-5 min-w-[320px] max-w-[360px]
        shadow-2xl transition-all duration-200 relative
        ${selected ? "border-green-400 shadow-green-400/50" : "border-slate/60"}
        ${isExecuting ? "animate-pulse" : ""}
        hover:border-green-400/50
      `}
    >
      {/* Output Handle - connects to questions */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white/20 !rounded-none"
        style={{ boxShadow: '0 0 8px rgba(34, 197, 94, 0.5)' }}
      />

      {/* Execution indicator */}
      {isExecuting && (
        <div className="absolute -top-1 -right-1 z-10">
          <div className="relative">
            <Zap className="w-5 h-5 text-yellow-400 animate-bounce" fill="currentColor" />
            <div className="absolute inset-0 bg-yellow-400/20 blur-md rounded-full" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-green-500/20 rounded-none border border-green-500/30">
          <Scale className="w-4 h-4 text-green-400" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            AI Judge
          </div>
          <div className="text-sm font-semibold text-zinc-100">{judge.name}</div>
        </div>
        <div
          className={`
            px-2 py-0.5 rounded-none text-xs font-mono border
            ${judge.active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-zinc-700/50 text-zinc-500 border-zinc-600"}
          `}
        >
          {judge.active ? "ACTIVE" : "OFF"}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="text-xs text-zinc-400">
          <span className="text-zinc-500 font-mono">Model:</span>{" "}
          <span className="text-accent font-mono">{judge.model}</span>
        </div>
        <div className="bg-background/60 border border-slate/40 rounded-none p-2">
          <div className="text-xs text-zinc-500 font-mono mb-1">RUBRIC:</div>
          <div className="text-xs text-zinc-300 line-clamp-3 leading-relaxed">
            {judge.prompt}
          </div>
        </div>
      </div>

      {/* Status bar at bottom */}
      <div className="mt-3 pt-2 border-t border-slate/40 flex items-center justify-between text-xs">
        <span className="text-zinc-500 font-mono">ID: {judge.id}</span>
        {isExecuting && (
          <span className="text-yellow-400 font-mono animate-pulse">EXECUTING...</span>
        )}
      </div>

      {/* Glow effect when selected */}
      {selected && (
        <div className="absolute inset-0 -z-10 bg-accent/5 blur-xl rounded-lg" />
      )}

      {/* Execution glow */}
      {isExecuting && (
        <div className="absolute inset-0 -z-10 bg-yellow-400/10 blur-xl rounded-lg animate-pulse" />
      )}
    </div>
  );
};

export default memo(JudgeNode);
