import { useState, ReactNode, useEffect } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { DraggableWidget } from './DraggableWidget';

export interface Widget {
  id: string;
  content: ReactNode;
  type: string;
  size?: 'small' | 'medium' | 'large';
}

interface DraggableWidgetListProps {
  widgets: Widget[];
  onReorder?: (widgets: Widget[]) => void;
  onRemoveWidget?: (widgetId: string) => void;
  className?: string;
}

export function DraggableWidgetList({ 
  widgets: initialWidgets, 
  onReorder, 
  onRemoveWidget,
  className = '' 
}: DraggableWidgetListProps) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  
  // Update local state when props change
  useEffect(() => {
    setWidgets(initialWidgets);
  }, [initialWidgets]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setWidgets(items);
    if (onReorder) {
      onReorder(items);
    }
    
    // Save the new order to localStorage
    localStorage.setItem('dashboardWidgets', JSON.stringify(items.map(w => ({ 
      id: w.id, 
      type: w.type,
      size: w.size
    }))));
  };
  
  const handleRemoveWidget = (widgetId: string) => {
    const updatedWidgets = widgets.filter(widget => widget.id !== widgetId);
    setWidgets(updatedWidgets);
    
    if (onReorder) {
      onReorder(updatedWidgets);
    }
    
    if (onRemoveWidget) {
      onRemoveWidget(widgetId);
    }
    
    // Update localStorage
    localStorage.setItem('dashboardWidgets', JSON.stringify(updatedWidgets.map(w => ({ 
      id: w.id, 
      type: w.type,
      size: w.size
    }))));
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="dashboard-widgets">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`widget-grid ${className}`}
          >
            {widgets.map((widget, index) => (
              <DraggableWidget 
                key={widget.id} 
                id={widget.id}
                index={index}
                size={widget.size}
                onRemove={handleRemoveWidget}
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