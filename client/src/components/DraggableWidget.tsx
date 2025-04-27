import { ReactNode } from 'react';
import { Draggable } from 'react-beautiful-dnd';

export interface DraggableWidgetProps {
  id: string;
  index: number;
  children: ReactNode;
  className?: string;
}

export function DraggableWidget({ id, index, children, className = '' }: DraggableWidgetProps) {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`draggable-widget ${snapshot.isDragging ? 'dragging' : ''} ${className}`}
          style={{
            ...provided.draggableProps.style,
          }}
        >
          <div className="relative group">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex gap-1">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    className="text-primary"
                  >
                    <path d="M9 18v-6H5l7-7 7 7h-4v6H9z"></path>
                  </svg>
                </div>
              </div>
            </div>
            {children}
          </div>
        </div>
      )}
    </Draggable>
  );
}