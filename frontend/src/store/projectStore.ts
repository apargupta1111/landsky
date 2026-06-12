import { create } from "zustand";

export interface Project {
  id: string;
  name: string;
  gatewayCount: number;
  lightCount: number;
  onlineLights: number;
  faults: number;
  status: "Active" | "At Risk";
}

interface ProjectState {
  projects: Project[];

  setProjects: (projects: Project[]) => void;

  addProject: (project: Project) => void;

  removeProject: (id: string) => void;

  fetchProjects: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],

  setProjects: (projects) =>
    set({
      projects,
    }),

  addProject: (project) => {
    const exists = get().projects.find(
      (p) => p.id === project.id
    );

    if (!exists) {
      set((state) => ({
        projects: [...state.projects, project],
      }));
    }
  },

  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter(
        (project) => project.id !== id
      ),
    })),

  fetchProjects: async () => {
    try {
      const response = await fetch("/api/projects");

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();

      set({
        projects: data,
      });
    } catch (error) {
      console.error(error);
    }
  },
}));