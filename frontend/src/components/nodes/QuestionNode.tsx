import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { HelpCircle } from "lucide-react";
import { Question } from "../../types";

export interface QuestionNodeData {
  question: Question;
}

const QuestionNode = ({ data, selected }: NodeProps<QuestionNodeData>) => {
  const { question } = data;

  return (
    <div
      className={`
        bg-panel border-2 rounded-sm p-5 min-w-[300px] max-w-[340px]
        shadow-2xl transition-all duration-200
        ${selected ? "border-blue-400 shadow-blue-400/50" : "border-slate/60"}
        hover:border-blue-400/50
      `}
    >
      {/* Input Handle - receives data from judges */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white/20 !rounded-none"
        style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)' }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-blue-500/20 rounded-none border border-blue-500/30">
          <HelpCircle className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            Question
          </div>
          <div className="text-xs text-zinc-500 font-mono">{question.questionType}</div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="text-sm text-zinc-200 line-clamp-3 leading-relaxed">
          {question.questionText}
        </div>
        <div className="text-xs text-zinc-500 font-mono pt-2 border-t border-slate/40">
          ID: {question.id.slice(0, 8)}...
        </div>
      </div>

      {/* Output Handle - connects to output report */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white/20 !rounded-none"
        style={{ boxShadow: '0 0 8px rgba(147, 51, 234, 0.5)' }}
      />

      {/* Glow effect when selected */}
      {selected && (
        <div className="absolute inset-0 -z-10 bg-accent/5 blur-xl rounded-lg" />
      )}
    </div>
  );
};

export default memo(QuestionNode);
