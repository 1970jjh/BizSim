import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  aiPanelOpen: boolean
  isLoading: boolean
  loadingMessage: string
}

interface UIActions {
  toggleSidebar: () => void
  setAiPanelOpen: (open: boolean) => void
  toggleAiPanel: () => void
  setLoading: (loading: boolean, message?: string) => void
}

export const useUiStore = create<UIState & UIActions>()((set) => ({
  sidebarOpen: true,
  aiPanelOpen: false,
  isLoading: false,
  loadingMessage: '',

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setAiPanelOpen: (aiPanelOpen) =>
    set({ aiPanelOpen }),

  toggleAiPanel: () =>
    set((state) => ({ aiPanelOpen: !state.aiPanelOpen })),

  setLoading: (isLoading, loadingMessage = '') =>
    set({ isLoading, loadingMessage }),
}))
