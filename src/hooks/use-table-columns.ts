"use client";

import { useEffect, useState } from "react";

export type HubSpotFieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "multiselect"
  | "radio"
  | "select"
  | "richtext"
  | "phone"
  | "date"
  | "datetime"
  | "file"
  | "url"
  | "email"
  | "user";

export type ColumnDef = {
  id: string;
  label: string;
  defaultVisible?: boolean;
  isCustom?: boolean;
  isPermanent?: boolean;
  fieldType?: HubSpotFieldType;
  options?: string[];
  category?: string;
};

export function useTableColumns(
  tableKey: string,
  initialColumns: ColumnDef[]
) {
  const [columns, setColumns] = useState<ColumnDef[]>(initialColumns);
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(() =>
    initialColumns.filter((c) => c.defaultVisible !== false).map((c) => c.id)
  );

  const storageKey = `crm_table_cols_${tableKey}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.columns && Array.isArray(parsed.columns)) {
          // Merge saved columns with any new initialColumns
          const savedIds = new Set(parsed.columns.map((c: ColumnDef) => c.id));
          const missingCols = initialColumns.filter((c) => !savedIds.has(c.id));
          const mergedCols = [...parsed.columns, ...missingCols];
          setColumns(mergedCols);
        }
        if (parsed.visibleColumnIds && Array.isArray(parsed.visibleColumnIds)) {
          // Ensure permanent columns are always included in visibleColumnIds
          const permIds = initialColumns.filter((c) => c.isPermanent || c.id === "userId").map((c) => c.id);
          const combinedVisible = Array.from(new Set([...permIds, ...parsed.visibleColumnIds]));
          setVisibleColumnIds(combinedVisible);
        }
      }
    } catch {
      // Fallback to default
    }
  }, [storageKey]);

  const saveState = (newCols: ColumnDef[], newVisible: string[]) => {
    setColumns(newCols);
    setVisibleColumnIds(newVisible);
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ columns: newCols, visibleColumnIds: newVisible })
      );
    } catch {
      // Ignore storage errors
    }
  };

  const toggleColumn = (columnId: string) => {
    const targetCol = columns.find((c) => c.id === columnId);
    if (targetCol?.isPermanent || columnId === "userId") {
      // Permanent column cannot be hidden
      return;
    }
    const nextVisible = visibleColumnIds.includes(columnId)
      ? visibleColumnIds.filter((id) => id !== columnId)
      : [...visibleColumnIds, columnId];
    saveState(columns, nextVisible);
  };

  const addCustomColumn = (
    label: string,
    fieldType: HubSpotFieldType = "text",
    options?: string[]
  ) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const id = `custom_${trimmed.toLowerCase().replace(/\s+/g, "_")}`;

    const existingIdx = columns.findIndex((c) => c.id === id);
    const newCol: ColumnDef = {
      id,
      label: trimmed,
      defaultVisible: true,
      isCustom: true,
      fieldType,
      options: options || [],
      category: "Custom Fields",
    };

    let nextCols: ColumnDef[];
    if (existingIdx >= 0) {
      nextCols = [...columns];
      nextCols[existingIdx] = newCol;
    } else {
      nextCols = [...columns, newCol];
    }

    const nextVisible = visibleColumnIds.includes(id)
      ? visibleColumnIds
      : [...visibleColumnIds, id];

    saveState(nextCols, nextVisible);
  };

  const removeCustomColumn = (columnId: string) => {
    const nextCols = columns.filter((c) => c.id !== columnId);
    const nextVisible = visibleColumnIds.filter((id) => id !== columnId);
    saveState(nextCols, nextVisible);
  };

  const updateCustomColumn = (
    columnId: string,
    updates: {
      label?: string;
      fieldType?: HubSpotFieldType;
      options?: string[];
    }
  ) => {
    const nextCols = columns.map((c) => {
      if (c.id !== columnId) return c;
      return {
        ...c,
        label: updates.label !== undefined ? updates.label.trim() : c.label,
        fieldType: updates.fieldType !== undefined ? updates.fieldType : c.fieldType,
        options: updates.options !== undefined ? updates.options : c.options,
      };
    });
    saveState(nextCols, visibleColumnIds);
  };

  const resetColumns = () => {
    const defaultVisible = initialColumns
      .filter((c) => c.defaultVisible !== false)
      .map((c) => c.id);
    saveState(initialColumns, defaultVisible);
  };

  const isColumnVisible = (id: string) => visibleColumnIds.includes(id);

  return {
    columns,
    visibleColumnIds,
    toggleColumn,
    addCustomColumn,
    updateCustomColumn,
    removeCustomColumn,
    resetColumns,
    isColumnVisible,
  };
}

export function useCustomCellData(tableKey: string) {
  const storageKey = `crm_custom_cell_data_${tableKey}`;
  const [data, setData] = useState<Record<string, Record<string, string>>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const updateCell = (rowId: string, columnId: string, value: string) => {
    setData((prev) => {
      const next = {
        ...prev,
        [rowId]: {
          ...(prev[rowId] || {}),
          [columnId]: value,
        },
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const getCellValue = (rowId: string, columnId: string) => {
    return data[rowId]?.[columnId] || "";
  };

  return { getCellValue, updateCell };
}
