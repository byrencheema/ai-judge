import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Play, Zap, Save, AlertCircle } from "lucide-react";

import { apiClient } from "../api/client";
import { Judge, Question } from "../types";
import QuestionNode from "../components/nodes/QuestionNode";
import JudgeNode from "../components/nodes/JudgeNode";
import OutputReportNode from "../components/nodes/OutputReportNode";
import Sidebar from "../components/Sidebar";

const nodeTypes = {
  question: QuestionNode,
  judge: JudgeNode,
  output: OutputReportNode,
};

interface EvaluationResult {
  planned: number;
  completed: number;
  failed: number;
  evaluations: Array<{
    verdict: "pass" | "fail" | "inconclusive" | null;
  }>;
}

const WorkflowPage = () => {
  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<EvaluationResult | null>(null);

  // Fetch judges and questions
  const { data: judges = [], isLoading: judgesLoading } = useQuery<Judge[]>({
    queryKey: ["judges"],
    queryFn: () => apiClient.get<Judge[]>("/api/judges"),
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["questions"],
    queryFn: () => apiClient.get<Question[]>("/api/questions"),
  });

  // Run evaluation mutation
  const runEvaluation = useMutation({
    mutationFn: async () => {
      // Extract connections from edges
      const connections = edges
        .filter((edge) => edge.source.startsWith("judge-") && edge.target.startsWith("question-"))
        .map((edge) => ({
          judgeId: parseInt(edge.source.replace("judge-", "")),
          questionId: edge.target.replace("question-", ""),
        }));

      // Update backend assignments
      await apiClient.post("/api/assignments/bulk", { assignments: connections });

      // Trigger evaluation
      return apiClient.post<EvaluationResult>("/api/evaluate");
    },
    onSuccess: (results) => {
      setExecutionResults(results);
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
    },
  });

  // Initialize nodes when data loads
  useEffect(() => {
    if (judgesLoading || questionsLoading) return;

    const newNodes: Node[] = [];
    const spacing = { x: 450, y: 180 };

    // Create judge nodes (left side)
    judges.forEach((judge, idx) => {
      newNodes.push({
        id: `judge-${judge.id}`,
        type: "judge",
        position: { x: 50, y: 100 + idx * spacing.y },
        data: { judge, isExecuting: false },
      });
    });

    // Create question nodes (center)
    questions.forEach((question, idx) => {
      newNodes.push({
        id: `question-${question.id}`,
        type: "question",
        position: { x: 500, y: 100 + idx * spacing.y },
        data: { question },
      });
    });

    // Create output report node (right side)
    newNodes.push({
      id: "output-report",
      type: "output",
      position: { x: 950, y: 100 + Math.floor(questions.length / 2) * spacing.y },
      data: {
        totalEvaluations: executionResults?.completed || 0,
        passed:
          executionResults?.evaluations.filter((e) => e.verdict === "pass").length || 0,
        failed:
          executionResults?.evaluations.filter((e) => e.verdict === "fail").length || 0,
        inconclusive:
          executionResults?.evaluations.filter((e) => e.verdict === "inconclusive" || e.verdict === null)
            .length || 0,
        isGenerating: isExecuting,
      },
    });

    setNodes(newNodes);
  }, [judges, questions, judgesLoading, questionsLoading, executionResults, isExecuting, setNodes]);

  // Update output node when execution results change
  useEffect(() => {
    if (!executionResults) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === "output-report") {
          return {
            ...node,
            data: {
              ...node.data,
              totalEvaluations: executionResults.completed,
              passed: executionResults.evaluations.filter((e) => e.verdict === "pass").length,
              failed: executionResults.evaluations.filter((e) => e.verdict === "fail").length,
              inconclusive: executionResults.evaluations.filter(
                (e) => e.verdict === "inconclusive" || e.verdict === null
              ).length,
              isGenerating: false,
            },
          };
        }
        return node;
      })
    );
  }, [executionResults, setNodes]);

  // Handle connections
  const onConnect = useCallback(
    (connection: Connection) => {
      // Only allow judge -> question connections
      if (
        connection.source?.startsWith("judge-") &&
        connection.target?.startsWith("question-")
      ) {
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              animated: true,
              style: { stroke: "#3B82F6", strokeWidth: 3, strokeDasharray: "5,5" },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#3B82F6" },
            },
            eds
          )
        );
      }
      // Auto-connect questions to output
      else if (
        connection.source?.startsWith("question-") &&
        connection.target === "output-report"
      ) {
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              animated: false,
              style: { stroke: "#9333EA", strokeWidth: 3 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#9333EA" },
            },
            eds
          )
        );
      }
    },
    [setEdges]
  );

  // Auto-connect all questions to output report
  useEffect(() => {
    if (questions.length === 0) return;

    const outputEdges: Edge[] = questions.map((question) => ({
      id: `question-${question.id}-output`,
      source: `question-${question.id}`,
      target: "output-report",
      animated: false,
      style: { stroke: "#9333EA", strokeWidth: 3, opacity: 0.3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#9333EA" },
    }));

    setEdges((eds) => {
      // Remove existing output edges and add new ones
      const filtered = eds.filter((e) => e.target !== "output-report");
      return [...filtered, ...outputEdges];
    });
  }, [questions, setEdges]);

  // Handle execution
  const handleRun = async () => {
    setIsExecuting(true);

    // Animate judge nodes
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === "judge") {
          return {
            ...node,
            data: { ...node.data, isExecuting: true },
          };
        }
        if (node.id === "output-report") {
          return {
            ...node,
            data: { ...node.data, isGenerating: true },
          };
        }
        return node;
      })
    );

    // Animate edges
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        animated: true,
      }))
    );

    try {
      await runEvaluation.mutateAsync();
    } catch (error) {
      console.error("Evaluation failed:", error);
    } finally {
      setIsExecuting(false);

      // Reset animations
      setNodes((nds) =>
        nds.map((node) => {
          if (node.type === "judge") {
            return {
              ...node,
              data: { ...node.data, isExecuting: false },
            };
          }
          return node;
        })
      );

      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          animated: edge.source.startsWith("judge-"),
        }))
      );
    }
  };

  const hasConnections = edges.some((e) => e.source.startsWith("judge-"));

  // Auto-assign all judges to all questions
  const handleAutoAssign = () => {
    const newEdges: Edge[] = [];

    judges.forEach((judge) => {
      questions.forEach((question) => {
        newEdges.push({
          id: `judge-${judge.id}-question-${question.id}`,
          source: `judge-${judge.id}`,
          target: `question-${question.id}`,
          animated: true,
          style: { stroke: "#3B82F6", strokeWidth: 3, strokeDasharray: "5,5" },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#3B82F6" },
        });
      });
    });

    // Add the new judge->question edges while keeping question->output edges
    setEdges((eds) => {
      const outputEdges = eds.filter((e) => e.target === "output-report");
      return [...newEdges, ...outputEdges];
    });
  };

  return (
    <div className="h-screen w-full flex bg-background text-zinc-100">
      <Sidebar />
      <div className="flex-1 relative">
      {/* Top Control Bar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
        {/* Status indicator */}
        {isExecuting && (
          <div className="flex items-center gap-2 px-4 py-2 bg-panel border border-yellow-500/50 rounded-none">
            <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span className="text-xs font-mono text-yellow-400 uppercase tracking-wider">Executing Workflow</span>
          </div>
        )}

        {/* Connection count */}
        {hasConnections && !isExecuting && (
          <div className="px-3 py-2 bg-panel border border-slate/60 rounded-none">
            <span className="text-xs font-mono text-zinc-400">
              {edges.filter((e) => e.source.startsWith("judge-")).length} CONNECTIONS
            </span>
          </div>
        )}

        {/* Auto-assign button */}
        {!isExecuting && judges.length > 0 && questions.length > 0 && (
          <button
            onClick={handleAutoAssign}
            className="px-4 py-2 bg-slate/60 hover:bg-slate/80 text-zinc-300 rounded-none font-mono text-xs uppercase tracking-wider transition-all border border-slate/60"
          >
            Auto-Assign All
          </button>
        )}

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={isExecuting || !hasConnections}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-none font-mono uppercase tracking-wider
            transition-all duration-200 border-2
            ${
              isExecuting || !hasConnections
                ? "bg-slate/40 text-zinc-600 cursor-not-allowed border-slate/60"
                : "bg-accent hover:bg-accent/80 text-black border-accent"
            }
          `}
        >
          <Play className="w-4 h-4" fill="currentColor" />
          <span>RUN</span>
        </button>
      </div>

      {/* Instructions */}
      {!hasConnections && !isExecuting && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-panel border border-accent/50 rounded-none">
            <AlertCircle className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono text-zinc-300 uppercase tracking-wider">
              Connect judges to questions to begin
            </span>
          </div>
        </div>
      )}

      {/* ReactFlow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-background"
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: "#00AEEF", strokeWidth: 2 },
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#2E3238"
          className="bg-background"
        />
        <Controls
          className="bg-panel border border-slate/60 rounded-none overflow-hidden"
          showInteractive={false}
        />
        <MiniMap
          className="bg-panel/40 border border-slate/40 rounded-none overflow-hidden opacity-30 hover:opacity-60 transition-opacity"
          nodeColor={(node) => {
            if (node.type === "judge") return "#15803D";
            if (node.type === "question") return "#1E40AF";
            return "#6B21A8";
          }}
          maskColor="rgba(11, 12, 14, 0.95)"
        />
      </ReactFlow>
      </div>
    </div>
  );
};

export default WorkflowPage;
