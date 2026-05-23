import { create } from "zustand";

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
  dirty: boolean;
  lastSavedAt: Date | null;
  isSaving: boolean;

  setForm: (formVersion: EditorFormVersion, fields: EditorField[]) => void;
  addField: (field: EditorField) => void;
  updateField: (id: string, patch: Partial<Omit<EditorField, "id">>) => void;
  removeField: (id: string) => void;
  reorderFields: (orderedIds: string[]) => void;
  selectField: (id: string | null) => void;
  markSaved: () => void;
  setIsSaving: (isSaving: boolean) => void;
}

export const useFormEditorStore = create<FormEditorState>((set) => ({
  formVersion: null,
  fields: [],
  selectedFieldId: null,
  dirty: false,
  lastSavedAt: null,
  isSaving: false,

  setForm: (formVersion, fields) =>
    set({ formVersion, fields, dirty: false, selectedFieldId: null }),

  addField: (field) =>
    set((s) => ({ fields: [...s.fields, field], selectedFieldId: field.id, dirty: true })),

  updateField: (id, patch) =>
    set((s) => ({
      fields: s.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      dirty: true,
    })),

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

  markSaved: () => set({ dirty: false, lastSavedAt: new Date(), isSaving: false }),

  setIsSaving: (isSaving) => set({ isSaving }),
}));
