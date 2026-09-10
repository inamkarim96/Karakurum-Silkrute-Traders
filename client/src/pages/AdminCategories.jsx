import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, AlertCircle, Image as ImageIcon, X } from 'lucide-react';
import { Button, Modal, Input, Badge, Card } from '../components/ui';

import * as productsApi from '../api/products';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = {
  name: '',
  image: ''
};

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await productsApi.getCategories();
      if (res.success) {
        setCategories(res.data?.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      toast.error('Unable to load categories. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData(EMPTY_FORM);
    setSelectedFile(null);
    setPreviewImage(null);
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      image: category.image || ''
    });
    setSelectedFile(null);
    setPreviewImage(category.image || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData(EMPTY_FORM);
    setSelectedFile(null);
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image' && files && files[0]) {
      setSelectedFile(files[0]);
      const url = URL.createObjectURL(files[0]);
      setPreviewImage(url);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;
    if (!editingCategory) {
      toast.error('Save the category first, then upload an image');
      return;
    }
    try {
      setUploadingImage(true);
      const res = await productsApi.uploadCategoryImage(editingCategory.id, selectedFile);
      if (res.success) {
        toast.success('Image uploaded successfully');
        setPreviewImage(res.data.url);
        setFormData(prev => ({ ...prev, image: res.data.url }));
        setSelectedFile(null);
        fetchCategories();
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error(err?.response?.data?.error?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    setSelectedFile(null);
    setFormData(prev => ({ ...prev, image: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      if (!formData.name.trim()) {
        toast.error('Category name is required');
        return;
      }

      const payload = {
        name: formData.name.trim(),
        image: formData.image || null
      };

      let res;
      if (editingCategory) {
        res = await productsApi.updateCategory(editingCategory.id, payload);
        toast.success('Category updated successfully');
      } else {
        res = await productsApi.createCategory(payload);
        toast.success('Category created successfully');
      }

      if (res.success) {
        handleCloseModal();
        fetchCategories();
      }
    } catch (err) {
      console.error('Failed to save category:', err);
      toast.error(err?.response?.data?.error?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId) => {
    try {
      const res = await productsApi.deleteCategory(categoryId);
      if (res.success) {
        toast.success('Category deleted successfully');
        fetchCategories();
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
      toast.error(err?.response?.data?.error?.message || 'Failed to delete category');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-management">
      <div className="page-header">
        <div>
          <h1>Product Categories</h1>
          <p>Organize your products into categories. Categories with products cannot be deleted.</p>
        </div>
        <Button
          variant="admin-primary"
          icon={Plus}
          onClick={openAddModal}
        >
          Add Category
        </Button>
      </div>

      <div className="admin-toolbar">
        <Input
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchCategories()}
          icon={Search}
          containerClassName="mb-0 flex-1"
        />
        <div className="toolbar-actions">
          <span className="results-count">
            {filteredCategories.length} categories
          </span>
        </div>
      </div>

      {loading ? (
        <p style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading categories...</p>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Products</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    {searchTerm ? 'No categories match your search' : 'No categories found. Create your first category to get started.'}
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <div className="cat-img" onClick={() => cat.image && setPreviewImage(cat.image)}>
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                            <ImageIcon size={18} className="text-slate-300" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-900">{cat.name}</div>
                    </td>
                    <td>
                      <span className="text-sm text-slate-500 font-mono">{cat.slug}</span>
                    </td>
                    <td>
                      <span className="text-sm font-medium text-slate-600">{cat.product_count || 0}</span>
                    </td>
                    <td>
                      <span className="text-sm text-slate-500">{new Date(cat.created_at).toLocaleDateString()}</span>
                    </td>
                    <td>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="admin-ghost"
                          size="sm"
                          icon={Edit2}
                          onClick={() => openEditModal(cat)}
                          title="Edit category"
                        />
                        <Button
                          variant="admin-danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => setDeleteConfirm(cat)}
                          title="Delete category"
                          disabled={cat.product_count > 0}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        footer={
          <div className="flex gap-4 justify-end w-full">
            <Button variant="admin-outline" onClick={handleCloseModal}>Cancel</Button>
            <Button 
              variant="admin-primary" 
              onClick={handleSave} 
              loading={saving}
            >
              {editingCategory ? 'Save Changes' : 'Add Category'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-4">Category Image</h3>
            <div className="admin-img-preview-grid">
              {previewImage && (
                <div className="admin-img-thumb">
                  <img src={previewImage} alt="Preview" />
                  {editingCategory && !uploadingImage && (
                    <button type="button" onClick={handleRemoveImage} className="admin-img-remove"><X size={12} /></button>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleInputChange} />
              <Button 
                variant="admin-ghost" 
                icon={ImageIcon} 
                onClick={() => fileInputRef.current?.click()}
                loading={uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : 'Add Image'}
              </Button>
              <p className="text-[11px] text-slate-500 mt-2">
                {editingCategory ? 'Changes apply instantly.' : 'Upload after creation.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Category Name *"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Blankets"
              required
              autoFocus
              containerClassName="md:col-span-2"
            />
            {editingCategory && (
              <Input
                label="Slug (Read-only)"
                value={editingCategory.slug}
                disabled
                className="bg-slate-50"
              />
            )}
          </div>
          <p className="text-xs text-slate-500">
            Slug is auto-generated from the name and used in URLs.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Delete"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button variant="admin-outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="admin-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete</Button>
          </div>
        }
      >
        <div className="p-4 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Are you sure?</h3>
          <p className="text-slate-600">
            You are about to delete <strong>{deleteConfirm?.name}</strong>. This action cannot be undone.
            {deleteConfirm?.product_count > 0 && (
              <span className="text-red-600 font-medium"> This category has {deleteConfirm.product_count} product(s) and cannot be deleted until they are reassigned.</span>
            )}
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title="Category Image Preview"
        size="lg"
      >
        <div className="image-preview-modal-content">
          {previewImage && <img src={previewImage} alt="Preview" />}
        </div>
      </Modal>
    </div>
  );
};

export default AdminCategories;
