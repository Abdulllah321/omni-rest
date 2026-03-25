import React, { useState } from "react";
import { useMaster } from "../hooks/useMaster";

interface MasterTableProps {
  model: string;
  fields: string[];
  title?: string;
}

export function MasterTable({ model, fields, title }: MasterTableProps) {
  const { data, loading, error, meta, create, update, remove, refetch } = useMaster({ model });
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleCreate = async () => {
    try {
      await create(formData);
      setFormData({});
      setIsCreating(false);
    } catch (err) {
      alert("Create failed");
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      await update(id, formData);
      setEditingId(null);
      setFormData({});
    } catch (err) {
      alert("Update failed");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure?")) {
      try {
        await remove(id);
      } catch (err) {
        alert("Delete failed");
      }
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{title || `${model} Management`}</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              {fields.map(field => (
                <th key={field} className="px-4 py-2 border-b text-left">
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </th>
              ))}
              <th className="px-4 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isCreating && (
              <tr className="bg-blue-50">
                {fields.map(field => (
                  <td key={field} className="px-4 py-2 border-b">
                    <input
                      type="text"
                      placeholder={field}
                      value={formData[field] || ""}
                      onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                ))}
                <td className="px-4 py-2 border-b">
                  <button
                    onClick={handleCreate}
                    className="bg-green-600 text-white px-2 py-1 rounded text-sm mr-2"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setFormData({});
                    }}
                    className="bg-gray-600 text-white px-2 py-1 rounded text-sm"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            )}
            {data.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50">
                {fields.map(field => (
                  <td key={field} className="px-4 py-2 border-b">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={formData[field] || item[field] || ""}
                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                        className="w-full p-1 border rounded"
                      />
                    ) : (
                      String(item[field] || "")
                    )}
                  </td>
                ))}
                <td className="px-4 py-2 border-b">
                  {editingId === item.id ? (
                    <>
                      <button
                        onClick={() => handleUpdate(item.id)}
                        className="bg-green-600 text-white px-2 py-1 rounded text-sm mr-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setFormData({});
                        }}
                        className="bg-gray-600 text-white px-2 py-1 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(item.id);
                          setFormData({ ...item });
                        }}
                        className="bg-yellow-600 text-white px-2 py-1 rounded text-sm mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-600 text-white px-2 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Showing {data.length} of {meta.total} items (Page {meta.page} of {meta.totalPages})
      </div>
    </div>
  );
}