import { create } from "zustand";
import type { FormTheme } from "@repo/forms/theme";

export interface EditorField {
  id: string;
  order: number;
  type: string;
  label: string;
  required: boolean;
  config: Record<string, unknown>;
}

export interface EditorFormVersion {
  id: string;
  formId: string;
  versionNumber: number;
  status: string;
  title: string;
  description: string | null;
  publishedAt: Date | null;
  createdAt: Date;
}

interface FormEditorState {
  formVersion: EditorFormVersion | null;
  fields: EditorField[];
  selectedFieldId: string | null;
  theme: FormTheme | null;
  dirty: boolean;
  lastSavedAt: Date | null;
  isSaving: boolean;
  fieldErrors: Record<string, string>;

  setForm: (formVersion: EditorFormVersion, fields: EditorField[], theme?: FormTheme | null) => void;
  addField: (field: EditorField) => void;
  updateField: (id: string, patch: Partial<Omit<EditorField, "id">>) => void;
  removeField: (id: string) => void;
  reorderFields: (orderedIds: string[]) => void;
  selectField: (id: string | null) => void;
  setTheme: (theme: FormTheme | null) => void;
  markSaved: () => void;
  setIsSaving: (isSaving: boolean) => void;
  setFieldErrors: (errors: Record<string, string>) => void;
  clearFieldErrors: () => void;
}

export const useFormEditorStore = create<FormEditorState>((set) => ({
  formVersion: null,
  fields: [],
  selectedFieldId: null,
  theme: null,
  dirty: false,
  lastSavedAt: null,
  isSaving: false,
  fieldErrors: {},

  setForm: (formVersion, fields, theme) =>
    set({ formVersion, fields, theme: theme ?? null, dirty: false, selectedFieldId: null }),

  addField: (field) =>
    set((s) => ({ fields: [...s.fields, field], selectedFieldId: field.id, dirty: true })),

  updateField: (id, patch) =>
    set((s) => {
      const { [id]: _removed, ...remainingErrors } = s.fieldErrors;
      return {
        fields: s.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
        dirty: true,
        fieldErrors: remainingErrors,
      };
    }),

  removeField: (id) =>
    set((s) => ({
      fields: s.fields.filter((f) => f.id !== id),
      selectedFieldId: s.selectedFieldId === id ? null : s.selectedFieldId,
      dirty: true,
    })),

  reorderFields: (orderedIds) =>
    set((s) => ({
      fields: orderedIds
        .map((id, index) => {
          const field = s.fields.find((f) => f.id === id);
          return field ? { ...field, order: index } : null;
        })
        .filter(Boolean) as EditorField[],
      dirty: true,
    })),

  selectField: (id) => set({ selectedFieldId: id }),

  setTheme: (theme) => set({ theme, dirty: true }),

  markSaved: () => set({ dirty: false, lastSavedAt: new Date(), isSaving: false }),

  setIsSaving: (isSaving) => set({ isSaving }),

  setFieldErrors: (errors) => set({ fieldErrors: errors }),

  clearFieldErrors: () => set({ fieldErrors: {} }),
}));
