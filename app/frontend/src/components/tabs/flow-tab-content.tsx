import { Flow } from '@/components/Flow';
import { useFlowContext } from '@/contexts/flow-context';
import { useTabsContext } from '@/contexts/tabs-context';
import { setNodeInternalState, setCurrentFlowId as setNodeStateFlowId } from '@/hooks/use-node-state';
import { cn } from '@/lib/utils';
import { flowService } from '@/services/flow-service';
import { Flow as FlowType } from '@/types/flow';
import { useEffect } from 'react';

// Import the flow connection manager to check if flow is actively running

interface FlowTabContentProps {
  flow: FlowType;
  className?: string;
}

export function FlowTabContent({ flow, className }: FlowTabContentProps) {
  const { loadFlow } = useFlowContext();
  const { activeTabId, openTab, closeTab } = useTabsContext();

  // Enhanced load function that restores both use-node-state and node context data
  const loadFlowWithCompleteState = async (flowToLoad: FlowType) => {
    try {
      const flowId = flowToLoad.id.toString();
      
      // First, set the flow ID for node state isolation
      setNodeStateFlowId(flowId);
      
      // DO NOT clear configuration state when switching tabs - useNodeState handles flow isolation automatically
      // DO NOT reset runtime data when switching tabs - preserve all runtime state
      // Runtime data should only be reset when explicitly starting a new run via the Play button
      console.log(`[FlowTabContent] Loading flow ${flowId}, preserving all state (configuration + runtime)`);

      // Load the flow using the basic context function (handles React Flow state)
      await loadFlow(flowToLoad);

      // Then restore internal states for each node (use-node-state data)
      if (flowToLoad.nodes) {
        flowToLoad.nodes.forEach((node: { id: string; data?: { internal_state?: unknown } }) => {
          if (node.data?.internal_state) {
            setNodeInternalState(node.id, node.data.internal_state);
          }
        });
      }
      
      // NOTE: We intentionally do NOT restore nodeContextData here
      // Runtime execution data (messages, analysis, agent status) should start fresh
      // Only configuration data (tickers, model selections) is restored above
    } catch (error) {
      console.error('Failed to load flow with complete state:', error);
      throw error;
    }
  };

  // Fetch the latest flow state when this tab becomes active
  useEffect(() => {
    const isThisTabActive = activeTabId === `flow-${flow.id}`;
    
    if (isThisTabActive) {
      const fetchAndLoadFlow = async () => {
        try {
          // Fetch the latest flow data from the backend
          const latestFlow = await flowService.getFlow(flow.id);
          // Load the fresh flow data with complete state restoration
          await loadFlowWithCompleteState(latestFlow);
        } catch (error) {
          console.error('Failed to fetch latest flow state:', error);

          const status = (error as { status?: number } | undefined)?.status;
          if (status === 404) {
            try {
              console.warn(`[FlowTabContent] Flow ${flow.id} is missing on the server; recreating it from cached tab state.`);
              const recreatedFlow = await flowService.createFlow({
                name: flow.name,
                description: flow.description,
                nodes: flow.nodes,
                edges: flow.edges,
                viewport: flow.viewport,
                data: {
                  ...(flow.data || {}),
                  recovered_from_missing_flow_id: flow.id,
                },
                is_template: flow.is_template,
                tags: flow.tags,
              });

              await loadFlowWithCompleteState(recreatedFlow);
              openTab({
                type: 'flow',
                title: recreatedFlow.name,
                flow: recreatedFlow,
                content: <FlowTabContent flow={recreatedFlow} />,
              });
              closeTab(`flow-${flow.id}`);
              window.localStorage.setItem('lastSelectedFlowId', recreatedFlow.id.toString());
              return;
            } catch (recoveryError) {
              console.error('Failed to recreate missing flow from cached tab state:', recoveryError);
            }
          }

          // Fallback to loading the cached flow data with complete state restoration
          await loadFlowWithCompleteState(flow);
        }
      };

      fetchAndLoadFlow();
    }
    // loadFlowWithCompleteState is intentionally kept local to this effect path:
    // adding it as a dependency would reload/recover the same flow repeatedly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId, flow.id, flow, loadFlow, openTab, closeTab]);

  return (
    <div className={cn("h-full w-full", className)}>
      <Flow />
    </div>
  );
} 