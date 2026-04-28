import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Settings,
  Users,
  Search,
  RefreshCw,
  Trash2,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Briefcase
} from "lucide-react";

export default function AdminControls() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Search
  const [search, setSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Toast
  const [toast, setToast] = useState(null);

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin')  // Exclude admin users
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Failed to fetch users', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateUserStatus = async (userId, newStatus) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ payment_status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(u =>
        u.id === userId ? { ...u, payment_status: newStatus } : u
      ));
      showToast('User status updated', 'success');
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(u =>
        u.id === userId ? { ...u, role: newRole } : u
      ));
      showToast('User role updated', 'success');
    } catch (error) {
      console.error('Error updating role:', error);
      showToast('Failed to update role', 'error');
    }
  };

  const deleteUser = async () => {
    // Note: Deleting from auth.users requires Service Role Key from backend
    // For now we can only delete from profiles if RLS allows, 
    // but ideally we should call a backend function.
    // We'll try to delete from profiles.

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.id);

      if (error) throw error;

      setUsers(users.filter((u) => u.id !== selectedUser.id));
      setShowDeleteModal(false);
      showToast("User profile deleted", "success");
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast("Failed to delete user", "error");
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Filter users
  const filtered = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(search.toLowerCase())
  );

  const pageStart = (currentPage - 1) * rowsPerPage;
  const paginatedUsers = filtered.slice(pageStart, pageStart + rowsPerPage);

  const paidCount = users.filter(u => u.payment_status === 'completed' || u.has_paid === true).length;
  const unpaidCount = users.length - paidCount;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Users</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{users.length}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Paid Users</p>
            <h3 className="text-3xl font-bold text-green-600 mt-1">{paidCount}</h3>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Pending Users</p>
            <h3 className="text-3xl font-bold text-orange-600 mt-1">{unpaidCount}</h3>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <Briefcase className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">User Management</h2>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                placeholder="Search by email or name..."
                onChange={(e) => setSearch(e.target.value)}
                value={search}
              />
            </div>
            <button
              onClick={fetchUsers}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loadingUsers ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-600 font-medium border-b">
              <tr>
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Payment Status</th>
                <th className="px-6 py-4 text-right">Joined</th>
                <th className="px-6 py-4 text-right">End Date</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loadingUsers ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading users...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const joinedDate = new Date(u.created_at);
                  const endDate = new Date(joinedDate);
                  endDate.setMonth(endDate.getMonth() + 1);

                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {u.first_name} {u.last_name}
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5">{u.email}</div>
                        {u.mobile_number && (
                          <div className="text-gray-400 text-xs mt-0.5">
                            {u.country_code} {u.mobile_number}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full ${u.payment_status === 'completed' || u.has_paid
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                            }`}
                        >
                          {u.payment_status === 'completed' || u.has_paid ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500 whitespace-nowrap">
                        {joinedDate.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500 whitespace-nowrap">
                        {endDate.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
            <span className="text-sm text-gray-600">
              Showing {pageStart + 1} to {Math.min(pageStart + rowsPerPage, filtered.length)} of {filtered.length} users
            </span>
            <div className="flex gap-2">
              <button
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === Math.ceil(filtered.length / rowsPerPage)}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete User?</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to delete <strong>{selectedUser?.email}</strong>? This action cannot be undone.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteUser}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 text-white text-sm font-medium animate-in slide-in-from-bottom-5 z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
