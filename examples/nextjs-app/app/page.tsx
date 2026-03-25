import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Prisma-REST Next.js Example
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Auto-generated REST APIs with React hooks and components
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">API Endpoints</h2>
            <p className="text-gray-600 mb-4">
              All CRUD operations are automatically available via the API routes.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• GET /api/departments - List departments</li>
              <li>• POST /api/departments - Create department</li>
              <li>• GET /api/departments/:id - Get by ID</li>
              <li>• PUT /api/departments/:id - Update</li>
              <li>• DELETE /api/departments/:id - Delete</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">React Components</h2>
            <p className="text-gray-600 mb-4">
              Drop-in components for instant CRUD UIs.
            </p>
            <Link
              href="/masters/departments"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              View Departments Demo
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-semibold">Auto-Generated</h3>
              <p className="text-sm text-gray-600">REST APIs from Prisma schema</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="font-semibold">Type-Safe</h3>
              <p className="text-sm text-gray-600">Zod validation included</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold">React Hooks</h3>
              <p className="text-sm text-gray-600">useMaster for data fetching</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}