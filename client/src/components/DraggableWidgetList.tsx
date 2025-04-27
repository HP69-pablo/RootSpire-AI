import { useState, ReactNode } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { DraggableWidget } from './DraggableWidget';

export interface Widget {
  id: string;
  content: ReactNode;
  type: string;
}

interface DraggableWidgetListProps {
  widgets: Widget[];
  onReorder?: (widgets: Widget[]) => void;
  className?: string;
}

export function DraggableWidgetList({ widgets: initialWidgets, onReorder, className = '' }: DraggableWidgetListProps) {
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setWidgets(items);
    onReorder?.(items);
    
    // Could save the new order to localStorage here
    localStorage.setItem('dashboardWidgets', JSON.stringify(items.map(w => ({ id: w.id, type: w.type }))));
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="dashboard-widgets">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`widget-container ${className}`}
          >
            {widgets.map((widget, index) => (
              <DraggableWidget 
                key={widget.id} 
                id={widget.id}
                index={index}
              >
                {widget.content}
              </DraggableWidget>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}