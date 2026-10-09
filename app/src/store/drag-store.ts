import { create } from 'zustand';

interface DragState {
  draggingId: string | null;
  draggingType: string | null;
  setDragging: (id: string | null, type?: string | null) => void;
}

export const useDragStore = create<DragState>((set) => ({
  draggingId: null,
  draggingType: null,
  setDragging: (id, type = null) => set({ draggingId: id, draggingType: type }),
}));
