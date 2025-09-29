import { getNodesBounds, getViewportForBounds } from '@xyflow/react';
import { toPng } from 'html-to-image';

export const exportToPng = async (
  reactFlowInstance: any,
  filename: string = 'pafta-module-tree'
) => {
  try {
    const nodesBounds = getNodesBounds(reactFlowInstance.getNodes());
    const transform = getViewportForBounds(
      nodesBounds,
      1920, // max width
      1080, // max height
      0.5,  // min zoom
      2,    // max zoom
      0.1   // padding
    );

    const viewport = reactFlowInstance.getViewport();
    
    // Temporarily set the viewport for export
    reactFlowInstance.setViewport({
      x: transform[0],
      y: transform[1],
      zoom: transform[2],
    });

    // Wait for the viewport to update
    await new Promise(resolve => setTimeout(resolve, 100));

    const reactFlowElement = document.querySelector('.react-flow') as HTMLElement;
    
    if (!reactFlowElement) {
      throw new Error('ReactFlow element not found');
    }

    // Generate the image
    const dataUrl = await toPng(reactFlowElement, {
      backgroundColor: '#ffffff',
      width: nodesBounds.width * transform[2] + 100,
      height: nodesBounds.height * transform[2] + 100,
      style: {
        width: String(nodesBounds.width * transform[2] + 100),
        height: String(nodesBounds.height * transform[2] + 100),
        transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
      }
    });

    // Restore original viewport
    reactFlowInstance.setViewport(viewport);

    // Download the image
    const link = document.createElement('a');
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = dataUrl;
    link.click();

    return true;
  } catch (error) {
    console.error('Error exporting to PNG:', error);
    throw error;
  }
};