import { createContext } from "react";

export type SelectedChildContextValue = {
  selectedChildId: string | null;
  setSelectedChildId: (id: string | null) => void;
};

export const SelectedChildContext = createContext<SelectedChildContextValue>({
  selectedChildId: null,
  setSelectedChildId: () => {},
});
