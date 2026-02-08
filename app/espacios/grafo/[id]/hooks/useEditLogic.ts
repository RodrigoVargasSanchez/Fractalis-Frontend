import { useState, useEffect } from "react";
import { grafoService } from "@/services/grafoService";
import { RELATIONS_CONFIG } from "@/app/nuevo/subir-archivo/constants";

export function useEditLogic(id: string, masterData: any, refreshGraph: () => Promise<void>) {
  const [tempNodes, setTempNodes] = useState<any[]>([]);
  const [tempEdges, setTempEdges] = useState<any[]>([]);
  const [deletedEdgeIds, setDeletedEdgeIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const sorted = [...masterData.nodes].sort((a, b) => Number(a.id) - Number(b.id));
    setTempNodes(sorted);

    const validTypes = RELATIONS_CONFIG.map(r => r.id.toUpperCase());
    const filteredEdges = masterData.edges.filter((edge: any) => 
      validTypes.includes(edge.label.toUpperCase())
    );
    setTempEdges(filteredEdges);
    setDeletedEdgeIds([]);
  }, [masterData]);

  const handleSaveConcepts = async (callback: () => void) => {
    setIsSaving(true);
    try {
      const nodeUpdates = tempNodes
        .map(node => {
          const originalNode = masterData.nodes.find((n: any) => n.id === node.id);
          const oldName = originalNode?.data?.label || originalNode?.data?.name;
          const newName = node.data.label;
          if (oldName && newName && oldName !== newName) return { oldName, newName };
          return null;
        })
        .filter(Boolean) as { oldName: string, newName: string }[];

      if (nodeUpdates.length > 0) {
        await grafoService.updateConcepts(id, nodeUpdates);
        await refreshGraph();
      }
      callback();
    } catch (error) {
      alert("Error al guardar conceptos.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRelationships = async (callback: () => void) => {
    setIsSaving(true);
    try {
      const edgeUpdates = tempEdges
        .map(edge => {
          const original = masterData.edges.find((e: any) => e.id === edge.id);
          if (original && original.label.toUpperCase() !== edge.label.toUpperCase()) {
            return { id: edge.id, newType: edge.label.toUpperCase() };
          }
          return null;
        })
        .filter(Boolean);

      if (edgeUpdates.length > 0 || deletedEdgeIds.length > 0) {
        await grafoService.updateEdges(id, edgeUpdates, deletedEdgeIds);
        await refreshGraph();
      }
      callback();
    } catch (error) {
      alert("Error al guardar relaciones.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    tempNodes, setTempNodes,
    tempEdges, setTempEdges,
    deletedEdgeIds, setDeletedEdgeIds,
    isSaving,
    handleSaveConcepts,
    handleSaveRelationships
  };
}