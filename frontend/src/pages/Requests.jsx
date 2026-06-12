import React, { useState } from 'react';
import { mockRequests } from '../services/mockData';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const statusColors = {
  open: 'bg-orange-100 text-orange-800',
  filled: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const RequestsPage = () => {
  const [requests, setRequests] = useState(mockRequests);
  const [filterStatus, setFilterStatus] = useState('');

  const filteredRequests = filterStatus
    ? requests.filter((r) => r.status === filterStatus)
    : requests;

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this request?')) {
      setRequests(requests.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Recruitment Requests</h1>
          <p className="text-gray-600 mt-1">Total: {filteredRequests.length} requests</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={20} />
          New Request
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="filled">Filled</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow-sm p-6 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Request #
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Position</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Department
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Factory</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Quantity</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Required Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredRequests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {request.requestNumber}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{request.position}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{request.department}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{request.factory}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{request.quantity}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[request.status]}`}
                  >
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {request.requiredDate
                    ? new Date(request.requiredDate).toLocaleDateString('vi-VN')
                    : '-'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="p-1.5 hover:bg-blue-100 rounded text-blue-600">
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(request.id)}
                      className="p-1.5 hover:bg-red-100 rounded text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};