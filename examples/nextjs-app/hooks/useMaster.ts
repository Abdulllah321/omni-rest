import { useState, useEffect } from "react";

interface UseMasterOptions {
  model: string;
  page?: number;
  limit?: number;
  sort?: string;
  include?: string;
  select?: string;
}

interface UseMasterReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  create: (item: Partial<T>) => Promise<T>;
  update: (id: string | number, item: Partial<T>) => Promise<T>;
  remove: (id: string | number) => Promise<void>;
  refetch: () => void;
}

export function useMaster<T = any>(options: UseMasterOptions): UseMasterReturn<T> {
  const { model, page = 1, limit = 20, sort, include, select } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const buildUrl = (params?: Record<string, any>) => {
    const url = new URL(`/api/${model}`, window.location.origin);
    const allParams = { page, limit, sort, include, select, ...params };
    Object.entries(allParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
    return url;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(buildUrl());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setData(result.data);
      setMeta(result.meta);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const create = async (item: Partial<T>): Promise<T> => {
    const response = await fetch(buildUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    setData(prev => [...prev, result]);
    setMeta(prev => ({ ...prev, total: prev.total + 1 }));
    return result;
  };

  const update = async (id: string | number, item: Partial<T>): Promise<T> => {
    const response = await fetch(buildUrl({ id }), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    setData(prev => prev.map(d => (d.id === id ? result : d)));
    return result;
  };

  const remove = async (id: string | number): Promise<void> => {
    const response = await fetch(buildUrl({ id }), { method: "DELETE" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    setData(prev => prev.filter(d => d.id !== id));
    setMeta(prev => ({ ...prev, total: prev.total - 1 }));
  };

  const refetch = () => fetchData();

  useEffect(() => {
    fetchData();
  }, [model, page, limit, sort, include, select]);

  return { data, loading, error, meta, create, update, remove, refetch };
}