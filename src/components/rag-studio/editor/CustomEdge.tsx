import { memo } from 'react'
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow'

function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  label,
  markerEnd,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      {/* Invisible wider path for easier selection */}
      <path
        id={`${id}-hitbox`}
        d={edgePath}
        className="react-flow__edge-path"
        style={{
          strokeWidth: 20,
          stroke: 'transparent',
          fill: 'none',
        }}
      />
      
      {/* Main edge path */}
      <path
        id={id}
        style={style}
        className={`react-flow__edge-path ${
          selected 
            ? 'stroke-[3px] stroke-primary dark:stroke-primary' 
            : 'stroke-2 stroke-primary/60 dark:stroke-primary/80'
        } transition-all`}
        d={edgePath}
        markerEnd={markerEnd}
      />
      
      {/* Edge label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className={`border-2 rounded-full px-3 py-1 text-xs font-medium shadow-lg ${
              selected
                ? 'bg-primary text-white border-primary'
                : 'bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300 border-primary/30 dark:border-primary/50'
            }`}>
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default memo(CustomEdge)
