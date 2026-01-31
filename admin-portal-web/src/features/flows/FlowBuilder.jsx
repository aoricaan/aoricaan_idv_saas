
import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    reconnectEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import Sidebar from './Sidebar';
import StepNode from './nodes/StepNode';
import StepPreviewModal from './StepPreviewModal';

// Map custom node types
const nodeTypes = {
    stepNode: StepNode,
};

let id = 0;
const getId = () => `dndnode_${id++}`;

function FlowBuilderContent({ initialConfig, onConfigChange }) {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [previewStep, setPreviewStep] = useState(null);

    const onPreview = useCallback((nodeData) => {
        setPreviewStep(nodeData);
    }, []);

    // Initial Load: Convert array config to nodes/edges
    useEffect(() => {
        if (initialConfig && Array.isArray(initialConfig) && initialConfig.length > 0) {
            const initialNodes = [];
            const initialEdges = [];
            let yPos = 50;

            initialConfig.forEach((step, index) => {
                const nodeId = step.step_id || `step_${index}`;
                initialNodes.push({
                    id: nodeId,
                    type: 'stepNode',
                    position: { x: 250, y: yPos },
                    data: {
                        label: step.type === 'document_scan' ? 'Document Scan' : step.type,
                        type: step.type,
                        config: step.config,
                        onPreview: onPreview
                    }
                });

                if (index > 0) {
                    const prevNodeId = initialConfig[index - 1].step_id || `step_${index - 1}`;
                    initialEdges.push({
                        id: `e${prevNodeId}-${nodeId}`,
                        source: prevNodeId,
                        target: nodeId,
                        animated: true,
                    });
                }
                yPos += 150;
            });

            setNodes(initialNodes);
            setEdges(initialEdges);
        }
    }, []); // Run once on mount

    const onConnect = useCallback(
        (params) => {
            // Enforce single output connection limit
            // Check if there is already an edge with the same source and sourceHandle
            const existingEdge = edges.find((e) => e.source === params.source && e.sourceHandle === params.sourceHandle);

            if (existingEdge) {
                // Determine behavior: Replace existing edge or Prevent.
                // "Conditioning that each element can only connect to one element and not several"
                // Replacing is a better UX than silently failing or requiring manual delete.
                setEdges((eds) => addEdge(params, eds.filter((e) => e.id !== existingEdge.id)));
            } else {
                setEdges((eds) => addEdge(params, eds));
            }
        },
        [edges, setEdges]
    );

    const onReconnect = useCallback(
        (oldEdge, newConnection) => {
            setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
        },
        [setEdges]
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            const label = event.dataTransfer.getData('application/label');

            // check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode = {
                id: getId(),
                type,
                position,
                data: {
                    label: label,
                    type: label.toLowerCase().replace(' ', '_'),
                    onPreview: onPreview
                },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance],
    );

    // Serialization: Nodes/Edges -> JSON Config
    useEffect(() => {
        if (!nodes.length) {
            onConfigChange([]);
            return;
        }

        // Simple linear serialization for now (Top to Bottom based on connections or Y position)
        // For accurate flow, we should traverse from a "Start" node. 
        // Here we just sort by Y position for simplicity in this MVP version to maintain order visually.
        const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y);

        const steps = sortedNodes.map(node => ({
            step_id: node.id,
            type: node.data.type,
            config: node.data.config || {}
        }));

        onConfigChange(steps);
    }, [nodes, edges, onConfigChange]);

    return (
        <div className="flex h-[600px] border border-gray-200 rounded-lg overflow-hidden relative">
            <ReactFlowProvider>
                <div className="flex-grow h-full" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onReconnect={onReconnect}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        nodeTypes={nodeTypes}
                        deleteKeyCode={['Backspace', 'Delete']}
                        fitView
                    >
                        <Controls />
                        <Background color="#aaa" gap={16} />
                    </ReactFlow>
                </div>
                <Sidebar />
            </ReactFlowProvider>

            {previewStep && (
                <StepPreviewModal
                    stepType={previewStep.type}
                    config={previewStep.config}
                    onClose={() => setPreviewStep(null)}
                />
            )}
        </div>
    );
}

export default function FlowBuilder(props) {
    return (
        <ReactFlowProvider>
            <FlowBuilderContent {...props} />
        </ReactFlowProvider>
    );
}
