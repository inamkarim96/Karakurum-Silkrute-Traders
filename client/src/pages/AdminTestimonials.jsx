import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, AlertCircle, Star, Quote, CheckCircle2, XCircle } from 'lucide-react';
import { Button, Modal, Input, Badge } from '../components/ui';
import * as siteApi from '../api/site';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = {
  name: '',
  role: '',
  quote: '',
  rating: 5,
  sort_order: 0,
  is_active: true
};

const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      // includeInactive=true so admin can view and toggle hidden items
      const res = await siteApi.getTestimonials(true);
      if (res.success) {
        setTestimonials(res.data?.testimonials || []);
      }
    } catch (err) {
      console.error('Failed to fetch testimonials:', err);
      toast.error('Unable to load testimonials. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      role: item.role || '',
      quote: item.quote || '',
      rating: item.rating || 5,
      sort_order: item.sort_order || 0,
      is_active: item.is_active
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData(EMPTY_FORM);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Client or business name is required');
      return;
    }
    if (!formData.quote.trim()) {
      toast.error('Testimonial quote text is required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        role: formData.role.trim() || 'Verified Customer',
        quote: formData.quote.trim(),
        rating: Number(formData.rating) || 5,
        sort_order: Number(formData.sort_order) || 0,
        is_active: formData.is_active
      };

      let res;
      if (editingItem) {
        res = await siteApi.updateTestimonial(editingItem.id, payload);
        toast.success('Testimonial updated successfully');
      } else {
        res = await siteApi.createTestimonial(payload);
        toast.success('Testimonial created successfully');
      }

      if (res.success) {
        handleCloseModal();
        fetchTestimonials();
      }
    } catch (err) {
      console.error('Error saving testimonial:', err);
      toast.error(err.response?.data?.message || 'Failed to save testimonial');
    } finally {
      setSaving(false);
    }
  };

  const toggleActiveStatus = async (item) => {
    try {
      const res = await siteApi.updateTestimonial(item.id, { is_active: !item.is_active });
      if (res.success) {
        toast.success(`Testimonial ${!item.is_active ? 'activated' : 'hidden'}`);
        setTestimonials((prev) =>
          prev.map((t) => (t.id === item.id ? { ...t, is_active: !t.is_active } : t))
        );
      }
    } catch (err) {
      toast.error('Failed to change status');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setSaving(true);
      const res = await siteApi.deleteTestimonial(deleteConfirm.id);
      if (res.success) {
        toast.success('Testimonial deleted successfully');
        setDeleteConfirm(null);
        fetchTestimonials();
      }
    } catch (err) {
      console.error('Error deleting testimonial:', err);
      toast.error('Failed to delete testimonial');
    } finally {
      setSaving(false);
    }
  };

  const filteredTestimonials = testimonials.filter((t) => {
    const q = searchTerm.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.role?.toLowerCase().includes(q) ||
      t.quote?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Testimonials Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage the &ldquo;Trusted by Retailers &amp; Homes&rdquo; feedback section on the Landing page.
          </p>
        </div>
        <Button variant="primary" onClick={openAddModal} icon={Plus}>
          Add Testimonial
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Search by client name, role, or quote..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Total: <span className="text-slate-900 font-bold">{filteredTestimonials.length}</span>
        </div>
      </div>

      {/* Testimonials List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading testimonials...</div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Quote className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-base font-semibold">No testimonials found.</p>
            <p className="text-xs text-slate-400">
              {searchTerm ? 'No items match your search.' : 'Add your first customer or retailer testimonial.'}
            </p>
            {!searchTerm && (
              <Button variant="primary" size="sm" onClick={openAddModal}>
                Create Testimonial
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-xs uppercase font-bold text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4">Client / Store</th>
                  <th className="py-3.5 px-4">Role / Location</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4 min-w-[240px]">Quote</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Order</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTestimonials.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {item.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                      {item.role || 'Verified Customer'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center text-amber-400">
                        {[...Array(item.rating || 5)].map((_, i) => (
                          <Star key={i} size={14} fill="currentColor" />
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs leading-relaxed max-w-sm line-clamp-2">
                      &ldquo;{item.quote}&rdquo;
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => toggleActiveStatus(item)}
                        title="Click to toggle visibility"
                        className="inline-flex items-center gap-1 cursor-pointer focus:outline-none"
                      >
                        {item.is_active ? (
                          <Badge variant="success" className="text-[11px] font-semibold cursor-pointer">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-[11px] font-semibold text-slate-400 bg-slate-100 cursor-pointer">
                            Hidden
                          </Badge>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-500 text-xs font-mono">
                      {item.sort_order ?? 0}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
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
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingItem ? 'Edit Testimonial' : 'Add New Testimonial'}
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Client or Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g. Tariq Mehmood, Al-Noor Fabrics"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Role, Store or City Location
            </label>
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              placeholder="e.g. Textile Retailer, Lahore OR Hotel Manager, Hunza"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Star Rating (1 - 5)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setFormData((prev) => ({ ...prev, rating: s }))}
                  className="p-1 text-amber-400 hover:scale-110 transition-transform"
                >
                  <Star size={22} fill={s <= formData.rating ? 'currentColor' : 'none'} />
                </button>
              ))}
              <span className="text-xs font-bold text-slate-600 ml-2">{formData.rating} Stars</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Testimonial Quote <span className="text-red-500">*</span>
            </label>
            <textarea
              name="quote"
              rows={4}
              value={formData.quote}
              onChange={handleInputChange}
              placeholder="Write the customer's exact feedback regarding product quality, shipping, wholesale rates, or customs handling..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Display Order
              </label>
              <input
                type="number"
                name="sort_order"
                value={formData.sort_order}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-sm font-semibold text-slate-700">Show on Landing Page</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="admin-outline" type="button" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Testimonial'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Testimonial"
      >
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
            <p>
              Are you sure you want to delete the testimonial from &ldquo;<strong>{deleteConfirm?.name}</strong>&rdquo;? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="admin-outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminTestimonials;
