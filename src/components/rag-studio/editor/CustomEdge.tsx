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
      {/* Main edge path */}
      <path
        id={id}
        style={style}
        className="react-flow__edge-path stroke-2 stroke-primary/60 dark:stroke-primary/80"
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
            <div className="bg-white dark:bg-dark-card border-2 border-primary/30 dark:border-primary/50 rounded-full px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-lg">
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default memo(CustomEdge)
