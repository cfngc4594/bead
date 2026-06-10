"use client";

import { Background, BackgroundVariant, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export default function Page() {
  return (
    <div className="h-screen w-screen">
      <ReactFlow
        defaultNodes={[]}
        defaultEdges={[]}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Lines} gap={24} lineWidth={1} />
      </ReactFlow>
    </div>
  );
}
