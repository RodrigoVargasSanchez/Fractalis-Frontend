import { Edge, MarkerType } from "reactflow";
import { RELATION_COLORS } from "@/app/espacios/grafo/[id]/constants";

export const getEdgeColor = (type: string): string => {
  const key = type.toLowerCase();
  if (key === "contradicts" || key === "antagonismo") return RELATION_COLORS.antagonismo;
  if (key === "complementary_to" || key === "sinergia") return RELATION_COLORS.sinergia;
  return RELATION_COLORS[key] || "#ffffff";
};

export const shouldVisibleEdge = (
  edge: any, 
  visibleNodeIds: Set<string>, 
  filter: string
): boolean => {
  const isVisible = visibleNodeIds.has(edge.source.toString()) && 
                    visibleNodeIds.has(edge.target.toString());
  if (!isVisible) return false;

  const typeKey = (edge.label || edge.type || "").toLowerCase();
  const isPolaridad = ["sinergia", "antagonismo", "contradicts", "complementary_to"].includes(typeKey);

  if (filter === "polaridad") return isPolaridad;
  if (filter === "otros") return !isPolaridad;
  return true;
};