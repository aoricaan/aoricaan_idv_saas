import React, { useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import Toolbox, { TOOLBOX_ITEMS } from './Toolbox';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';

// Generate a random ID
const generateId = (prefix = 'field') => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;

export default function FormBuilder({ initialConfig, onConfigChange }) {
    const [fields, setFields] = useState(initialConfig?.fields || []);
    const [actions, setActions] = useState(initialConfig?.actions || [{ type: 'submit', label: 'Continue', conditions: [] }]);
    const [selectedFieldId, setSelectedFieldId] = useState(null);
    const [activeDragItem, setActiveDragItem] = useState(null); // For DragOverlay
    const [editingActions, setEditingActions] = useState(false);

    // Sync state when initialConfig changes (e.g. loading a different template)
    React.useEffect(() => {
        if (initialConfig) {
            setFields(initialConfig.fields || []);
            setActions(initialConfig.actions || [{ type: 'submit', label: 'Continue', conditions: [] }]);
        }
    }, [initialConfig]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Notify parent onChange whenever fields/actions change
    const updateConfig = (newFields, newActions) => {
        onConfigChange({
            fields: newFields,
            actions: newActions
        });
    };

    const handleDragStart = (event) => {
        const { active } = event;
        // Check if dragging from toolbox
        if (active.data.current?.isToolboxItem) {
            const item = TOOLBOX_ITEMS.find(i => i.type === active.data.current.type);
            setActiveDragItem(item);
        } else {
            // Dragging sortable item within canvas
            const field = fields.find(f => f.id === active.id);
            setActiveDragItem(field);
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;

        // 1. Drop from Toolbox to Canvas
        if (active.data.current?.isToolboxItem) {
            const type = active.data.current.type;
            const itemDef = TOOLBOX_ITEMS.find(i => i.type === type);

            const newField = {
                id: generateId(type),
                type: type,
                label: itemDef.label || 'New Field',
                required: false,
                placeholder: '',
            };

            const newFields = [...fields, newField];
            setFields(newFields);
            updateConfig(newFields, actions);
            setSelectedFieldId(newField.id); // Auto-select new item
            return;
        }

        // 2. Reorder within Canvas
        if (active.id !== over.id) {
            const oldIndex = fields.findIndex((f) => f.id === active.id);
            const newIndex = fields.findIndex((f) => f.id === over.id);

            const newFields = arrayMove(fields, oldIndex, newIndex);
            setFields(newFields);
            updateConfig(newFields, actions);
        }
    };

    const handleSelectField = (field) => {
        setSelectedFieldId(field.id);
        setEditingActions(false);
    };

    const handleDeleteField = (id) => {
        const newFields = fields.filter(f => f.id !== id);
        setFields(newFields);
        updateConfig(newFields, actions);
        if (selectedFieldId === id) setSelectedFieldId(null);
    };

    const handleUpdateField = (updatedField) => {
        if (!updatedField) {
            setSelectedFieldId(null);
            return;
        }

        const newFields = fields.map(f => f.id === selectedFieldId ? updatedField : f);
        setFields(newFields);
        updateConfig(newFields, actions);
    };

    // Actions Management
    const handleUpdateActions = (val) => {
        if (val === 'select') {
            setEditingActions(true);
            setSelectedFieldId(null);
        } else if (val === 'close') {
            setEditingActions(false);
        } else {
            // val is new actions array
            setActions(val);
            updateConfig(fields, val);
        }
    };

    const selectedField = fields.find(f => f.id === selectedFieldId);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-[600px] border border-gray-200 rounded-lg overflow-hidden bg-white">
                <Toolbox />

                <Canvas
                    fields={fields}
                    selectedFieldId={selectedFieldId}
                    onSelectField={handleSelectField}
                    onDeleteField={handleDeleteField}
                />

                <PropertiesPanel
                    selectedField={selectedField}
                    onUpdateField={handleUpdateField}

                    formActions={editingActions ? actions : null} // only pass if editing actions
                    onUpdateActions={handleUpdateActions} // Generic handler

                    allFields={fields} // For conditions
                />
            </div>

            <DragOverlay>
                {activeDragItem ? (
                    <div className="bg-white p-3 border border-indigo-500 rounded shadow-xl opacity-90 w-48">
                        {activeDragItem.label}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
