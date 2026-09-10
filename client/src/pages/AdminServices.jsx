import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Button, Modal, Input, Badge } from '../components/ui';
import * as siteApi from '../api/site';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = {
  title: '',
  description: '',
  icon: '',
  sort_order: 0,
  is_active: true
};

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      // includeInactive=true so admin can see and re-enable hidden services
      const res = await siteApi.getServices(true);
      if (res.success) {
        setServices(res.data?.services || []);
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
      toast.error('Unable to load services. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openAddModal = () => {
    setEditingService(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description || '',
      icon: service.icon || '',
      sort_order: service.sort_order || 0,
      is_active: service.is_active
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
    setFormData(EMPTY_FORM);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Service title is required');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        icon: formData.icon.trim() || null,
        sort_order: Number(formData.sort_order) || 0,
        is_active: formData.is_active
      };

      let res;
      if (editingService) {
        res = await siteApi.updateService(editingService.id, payload);
        toast.success('Service updated successfully');
      } else {
        res = await siteApi.createService(payload);
        toast.success('Service created successfully');
      }

      if (res.success) {
        handleCloseModal();
        fetchServices();
      }
    } catch (err) {
      console.error('Failed to save service:', err);
      toast.error(err?.response?.data?.error?.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await siteApi.deleteService(id);
      if (res.success) {
        toast.success('Service deleted successfully');
        fetchServices();
      }
    } catch (err) {
      console.error('Failed to delete service:', err);
      toast.error(err?.response?.data?.error?.message || 'Failed to delete service');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filteredServices = services.filter((s) =>
    s.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-users">
      <div className="page-header">
        <div>
          <h1>Business Services</h1>
          <p>Manage services displayed on your Services page (e.g., bulk trading, sourcing, logistics).</p>
        </div>
        <Button variant="admin-primary" icon={Plus} onClick={openAddModal}>
          Add Service
        </Button>
      </div>

      <div className="admin-toolbar">
        <Input
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={Search}
          containerClassName="mb-0 flex-1"
        />
      </div>

      <div className="table-container">
        {loading ? (
          <p className="state-msg">Loading services...</p>
        ) : filteredServices.length === 0 ? (
          <p className="state-msg">
            {searchTerm ? 'No services match your search' : 'No services yet. Add your first one to get started.'}
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Title</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => (
                <tr key={service.id}>
                  <td>
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs border border-slate-200">
                      {service.sort_order}
                    </div>
                  </td>
                  <td>{service.title}</td>
                  <td className="text-slate-500 text-sm">{service.description || '—'}</td>
                  <td>
                    <Badge variant={service.is_active ? 'success' : 'error'} pill={false}>
                      {service.is_active ? 'Active' : 'Hidden'}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="admin-ghost"
                        size="sm"
                        icon={Edit2}
                        onClick={() => openEditModal(service)}
                        title="Edit service"
                      />
                      <Button
                        variant="admin-danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => setDeleteConfirm(service)}
                        title="Delete service"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingService ? 'Edit Service' : 'Add Service'}
        footer={
          <div className="flex gap-4 justify-end w-full">
            <Button variant="admin-outline" onClick={handleCloseModal}>Cancel</Button>
            <Button variant="admin-primary" onClick={handleSave} loading={saving}>
              {editingService ? 'Save Changes' : 'Add Service'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Service Title *"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., Product Sourcing from China"
            required
            autoFocus
          />
          <div className="admin-form-group">
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              className="admin-input w-full"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Short description shown under the service title"
            />
          </div>
          <Input
            label="Icon (optional)"
            name="icon"
            value={formData.icon}
            onChange={handleInputChange}
            placeholder="e.g., truck, package, globe (lucide icon name)"
            helpText="Matches an icon name from the site's icon set. Leave blank for a default icon."
          />
          <Input label="Display Order" type="number" min="0" name="sort_order" value={formData.sort_order} onChange={handleInputChange} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
            />
            Visible on the public Services page
          </label>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Delete"
        size="sm"
        footer={
          <div className="flex gap-4 justify-end w-full">
            <Button variant="admin-outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="admin-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete Service</Button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-500 mt-1 flex-shrink-0" size={24} />
          <div>
            <p className="text-slate-700">Are you sure you want to delete <strong>"{deleteConfirm?.title}"</strong>?</p>
            <p className="text-sm text-red-600 mt-2">This action cannot be undone.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminServices;
