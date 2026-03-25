"use client";

import { MasterTable } from "../../components/MasterTable";

export default function DepartmentsPage() {
  return (
    <div>
      <h1>Departments</h1>
      <MasterTable
        model="departments"
        fields={["name", "description", "createdAt"]}
        title="Department Management"
      />
    </div>
  );
}