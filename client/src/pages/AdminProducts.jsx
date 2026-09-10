import { useState, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, X, FolderOpen, AlertTriangle } from 'lucide-react';
import { Button, Input, Modal, Select, Card } from '../components/ui';

import * as productsApi from '../api/products';
import { toast } from 'react-hot-toast';
import useProducts from '../hooks/useProducts';

const EMPTY_FORM = {
  name: '',
  description: '',
  category_id: '',
  base_price: '',
  wholesale_price: '',
  min_wholesale_qty: '',
  stock: '',
  is_featured: false,
  is_active: true,
  product_variants: [
    { label: '', attribute_name: 'Size', attribute_value: '', price: '', wholesale_price: '', stock: '' }
  ]
};

const AdminProducts = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const {
    products,
    categories,
    loading,
    error: productsError,
    refresh: fetchProducts,
    refreshCategories,
    setProducts
  } = useProducts({
    isAdmin: true,
    initialFilters: { limit: 100 }
  });

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, productId: null, productName: '' });
  const [previewImage, setPreviewImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]); // For new products
  const fileInputRef = useRef(null);

  const clearSelectedFiles = () => {
    selectedFiles.forEach(item => URL.revokeObjectURL(item.previewUrl));
    setSelectedFiles([]);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
    clearSelectedFiles();
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    clearSelectedFiles();
    setFormData({
      name: product.name,
      description: product.description || '',
      category_id: product.category?.id || '',
      base_price: product.base_price,
      wholesale_price: product.wholesale_price || '',
      min_wholesale_qty: product.min_wholesale_qty || '',
      stock: product.stock,
      is_featured: product.is_featured || false,
      is_active: product.is_active !== false,
      product_variants: product.product_variants?.length > 0
        ? product.product_variants.map(v => ({ ...v }))
        : [{ label: '', attribute_name: 'Size', attribute_value: '', price: '', wholesale_price: '', stock: '' }]
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const payload = {
        name: formData.name,
        description: formData.description || null,
        category_id: formData.category_id || null,
        base_price: parseFloat(formData.base_price) || 0,
        wholesale_price: formData.wholesale_price === '' ? null : parseFloat(formData.wholesale_price),
        min_wholesale_qty: formData.min_wholesale_qty === '' ? null : parseInt(formData.min_wholesale_qty, 10),
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        product_variants: formData.product_variants.map(v => ({
          id: v.id,
          label: v.label,
          attribute_name: v.attribute_name,
          attribute_value: v.attribute_value,
          price: parseFloat(v.price) || 0,
          wholesale_price: v.wholesale_price === '' ? null : parseFloat(v.wholesale_price),
          stock: parseInt(v.stock) || 0
        }))
      };

      // Basic client-side validation
      if (!payload.name) throw new Error('Product name is required');
      if (!payload.category_id) throw new Error('Please select a category');
      if (payload.base_price <= 0) throw new Error('Base price must be greater than 0');
      if (payload.product_variants.length === 0) throw new Error('At least one product variant is required');
      
      for (const v of payload.product_variants) {
        if (!v.label || v.price <= 0) {
          throw new Error('All variants must have a label and price > 0');
        }
      }

      if (editingProduct) {
        await productsApi.updateProduct(editingProduct.id, payload);
        toast.success('Product updated successfully!');
        setShowModal(false);
      } else {
        const res = await productsApi.createProduct(payload);
        if (res.success) {
          const newProduct = res.data.product;

          // Upload pending images if any
          if (selectedFiles.length > 0) {
            toast.loading('Uploading images...', { id: 'img-upload' });
            for (const item of selectedFiles) {
              await productsApi.uploadProductImage(newProduct.id, item.file);
            }
            toast.success('Product added with images!', { id: 'img-upload' });
            clearSelectedFiles();
          } else {
            toast.success('Product added successfully!');
          }

          setShowModal(false);
        }
      }

      fetchProducts();
    } catch (err) {
      console.error('Failed to save product:', err);
      const errorMsg = err?.response?.data?.error?.message || err?.message || 'Unable to save product. Please try again.';
      toast.error(errorMsg, { id: 'img-upload' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (product) => {
    setDeleteConfirm({ show: true, productId: product.id, productName: product.name });
  };

  const executeDelete = async () => {
    const { productId } = deleteConfirm;
    try {
      setSaving(true);
      await productsApi.deleteProduct(productId);
      toast.success('Product deleted successfully');
      setDeleteConfirm({ show: false, productId: null, productName: '' });
      fetchProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
      const errorMsg = err?.response?.data?.error?.message || 'Failed to delete product';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };



  const handleToggleFeatured = async (product) => {
    const originalProducts = [...products];
    const newStatus = !product.is_featured;
    
    // Optimistic Update
    setProducts(prev => prev.map(p => 
      p.id === product.id ? { ...p, is_featured: newStatus } : p
    ));

    try {
      await productsApi.updateProduct(product.id, { is_featured: newStatus });
      toast.success(`Product ${newStatus ? 'featured' : 'un-featured'}`);
    } catch (err) {
      setProducts(originalProducts);
      toast.error('Failed to update featured status');
    }
  };

  const handleUpdateStatus = async (product, isActive) => {
    if (product.is_active === isActive) return;
    
    const originalProducts = [...products];
    
    // Optimistic Update
    setProducts(prev => prev.map(p => 
      p.id === product.id ? { ...p, is_active: isActive } : p
    ));

    try {
      await productsApi.updateProduct(product.id, { is_active: isActive });
      toast.success(`Product ${isActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
      setProducts(originalProducts);
      toast.error('Failed to update status');
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (editingProduct) {
      // Direct upload for existing product
      try {
        setUploadingImage(true);
        for (const file of files) {
          await productsApi.uploadProductImage(editingProduct.id, file);
        }
        toast.success('Images uploaded successfully');
        const res = await productsApi.getProduct(editingProduct.id);
        if (res.success) {
          setEditingProduct(res.data);
          fetchProducts();
        }
      } catch (err) {
        toast.error(err?.response?.data?.error || 'Failed to upload image');
      } finally {
        setUploadingImage(false);
      }
    } else {
      // Queue for new product
      const newSelected = files.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }));
      setSelectedFiles(prev => [...prev, ...newSelected]);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePendingImage = (index) => {
    setSelectedFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleRemoveImage = async (imageUrl) => {
    if (!editingProduct || !window.confirm('Remove this image?')) return;
    try {
      await productsApi.deleteProductImage(editingProduct.id, imageUrl);
      toast.success('Image removed');
      const res = await productsApi.getProduct(editingProduct.id);
      if (res.success) setEditingProduct(res.data);
      fetchProducts();
    } catch (err) {
      toast.error('Failed to remove image');
    }
  };

  const addVariantRow = () => {
    setFormData(prev => ({
      ...prev,
      product_variants: [
        ...prev.product_variants,
        { label: '', attribute_name: 'Size', attribute_value: '', price: '', wholesale_price: '', stock: '' }
      ]
    }));
  };

  const updateVariantRow = (index, field, value) => {
    setFormData(prev => {
      const newVariants = [...prev.product_variants];
      newVariants[index][field] = value;
      return { ...prev, product_variants: newVariants };
    });
  };

  const removeVariantRow = (index) => {
    setFormData(prev => {
      const newVariants = [...prev.product_variants];
      newVariants.splice(index, 1);
      return { ...prev, product_variants: newVariants };
    });
  };

  const filtered = products.filter((p) =>
    !searchTerm ||
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

    const lowStockVariants = [];
    products.forEach(p => {
      if (p.stock < 10) {
        p.product_variants?.forEach(v => {
          if (v.stock < 10) {
            lowStockVariants.push({ productName: p.name, variantLabel: v.label, stock: v.stock });
          }
        });
      }
    });

  return (
    <div className="admin-products">
      {lowStockVariants.length > 0 && (
        <Card className="bg-amber-50 border-amber-200 mb-6 p-4">
          <div className="flex flex-col gap-2 text-amber-800">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} />
              <span className="font-semibold text-lg">Low Stock Alerts</span>
            </div>
            <ul className="list-disc list-inside text-sm space-y-1">
              {lowStockVariants.slice(0, 5).map((v, i) => (
                <li key={i}>
                  <strong>{v.productName}</strong> ({v.variantLabel}) is low: <span className="font-bold text-red-600">{v.stock} units left</span>
                </li>
              ))}
              {lowStockVariants.length > 5 && <li>...and {lowStockVariants.length - 5} more</li>}
            </ul>
          </div>
        </Card>
      )}

      <div className="page-header">
        <div>
          <h1>Product Catalog</h1>
          <p>Manage your inventory, pricing, variants, and product details.</p>
        </div>
        <div className="header-actions flex gap-3">
          {categories.length === 0 && (
            <Button 
              variant="admin-danger" 
              icon={FolderOpen} 
              onClick={() => window.location.href = '/admin/categories'}
            >
              Create Categories First
            </Button>
          )}
          <Button
            variant="admin-primary"
            icon={Plus}
            onClick={openAddModal}
            disabled={categories.length === 0}
          >
            Add Product
          </Button>
        </div>
      </div>

      <div className="admin-toolbar">
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchProducts({ search: searchTerm, limit: 100 })}
          icon={Search}
          containerClassName="mb-0 flex-1"
        />
      </div>

      <div className="table-container">
        {loading ? (
          <p style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading products...</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product Details</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="8" style={{textAlign: 'center', padding: '2rem'}}>No products found.</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="prod-img" onClick={() => p.images?.[0] && setPreviewImage(p.images[0])}>
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                          <ImageIcon size={18} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <strong>{p.name}</strong>
                      <span className="text-xs text-gray-500">{p.slug}</span>
                    </div>
                  </td>
                  <td>{p.category?.name || '-'}</td>
                  <td>PKR {Number(p.base_price).toLocaleString()}</td>
                  <td>
                    <div
                      className={`text-sm font-bold px-2 py-1 inline-block rounded border ${p.stock < 10 ? 'border-red-200 bg-red-50 text-red-600' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                      title={p.product_variants?.map(v => `${v.label}: ${v.stock}`).join(', ') || 'No variants'}
                    >
                      {p.stock} in stock
                    </div>
                  </td>
                  <td>
                    <Select
                      value={p.is_active ? "active" : "inactive"}
                      onChange={(e) => handleUpdateStatus(p, e.target.value === "active")}
                      options={[
                        { label: "Active", value: "active" },
                        { label: "Inactive", value: "inactive" }
                      ]}
                      className={`text-xs font-bold !py-1 !px-2 rounded-lg border-none ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}
                      containerClassName="!mb-0 w-28"
                    />
                  </td>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={p.is_featured} 
                      onChange={() => handleToggleFeatured(p)}
                      title="Toggle Featured"
                    />
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Button
                        variant="admin-ghost"
                        size="sm"
                        icon={Edit2}
                        onClick={() => openEditModal(p)}
                        title="Edit"
                      />
                      <Button
                        variant="admin-danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleDelete(p)}
                        title="Delete"
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
        onClose={() => setShowModal(false)}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        size="2xl"
        footer={
          <div className="flex gap-4 justify-end w-full">
            <Button variant="admin-outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button 
              variant="admin-primary" 
              onClick={handleSave} 
              loading={saving}
            >
              {editingProduct ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>
        }
      >
        <div className="space-y-8">
          {/* Images Section */}
          <div>
            <h3 className="text-lg font-bold mb-4">Product Images</h3>
            <div className="admin-img-preview-grid">
              {editingProduct?.images?.map((img, idx) => (
                <div key={`existing-${idx}`} className="admin-img-thumb">
                  <img src={img} alt="Product" />
                  <button type="button" onClick={() => handleRemoveImage(img)} className="admin-img-remove"><X size={12} /></button>
                </div>
              ))}
              {selectedFiles.map((item, idx) => (
                <div key={`pending-${idx}`} className="admin-img-thumb pending">
                  <img src={item.previewUrl} alt="Pending" />
                  <button type="button" onClick={() => handleRemovePendingImage(idx)} className="admin-img-remove"><X size={12} /></button>
                  <div className="admin-img-pending-badge">Pending</div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
              <Button 
                variant="admin-ghost" 
                icon={ImageIcon} 
                onClick={() => fileInputRef.current?.click()}
                loading={uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : 'Add Images'}
              </Button>
              <p className="text-[11px] text-slate-500 mt-2">
                {editingProduct ? 'Changes apply instantly.' : 'Uploads after creation.'}
              </p>
            </div>
          </div>

          {/* Core Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Product Name"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="Wool Blanket"
              required
              containerClassName="md:col-span-2"
            />
            <Select
              label="Category"
              value={formData.category_id}
              onChange={(e) => setFormData((p) => ({ ...p, category_id: e.target.value }))}
              disabled={categories.length === 0}
              options={[
                { value: '', label: 'No Category' },
                ...categories.map(cat => ({ value: cat.id, label: cat.name }))
              ]}
            />
            <Input
              label="Base Price (PKR)"
              type="number"
              value={formData.base_price}
              onChange={(e) => setFormData((p) => ({ ...p, base_price: e.target.value }))}
              placeholder="0.00"
              required
            />
            <Input label="Wholesale Price (PKR)" type="number" value={formData.wholesale_price} onChange={(e) => setFormData((p) => ({ ...p, wholesale_price: e.target.value }))} placeholder="Optional" />
            <Input label="Minimum Wholesale Quantity" type="number" value={formData.min_wholesale_qty} onChange={(e) => setFormData((p) => ({ ...p, min_wholesale_qty: e.target.value }))} placeholder="Optional" />
            <Input
              label="Description"
              as="textarea"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              containerClassName="md:col-span-2"
            />
            <div className="flex gap-6 items-center pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={formData.is_featured} onChange={(e) => setFormData(p => ({ ...p, is_featured: e.target.checked }))} className="w-4 h-4 rounded text-primary" />
                Featured
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded text-primary" />
                Active
              </label>
            </div>
          </div>

          {/* Product Variants */}
          <Card className="border-slate-200 bg-slate-50/50" title={
            <div className="flex justify-between items-center w-full">
              <span>Product Variants</span>
              <Button variant="admin-primary" size="sm" onClick={addVariantRow} type="button">+ Add</Button>
            </div>
          }>
            <div className="space-y-4">
              <div className="hidden md:grid grid-cols-7 gap-4 text-xs font-bold text-slate-400 px-1">
                <span>Label</span>
                <span>Attribute</span>
                <span>Value</span>
                <span>Price (PKR)</span>
                <span>Wholesale (PKR)</span>
                <span>Stock</span>
                <span></span>
              </div>
              {formData.product_variants.map((v, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
                  <Input value={v.label} onChange={e => updateVariantRow(index, 'label', e.target.value)} placeholder="King - Maroon" containerClassName="mb-0" />
                  <Input value={v.attribute_name} onChange={e => updateVariantRow(index, 'attribute_name', e.target.value)} placeholder="Size" containerClassName="mb-0" />
                  <Input value={v.attribute_value} onChange={e => updateVariantRow(index, 'attribute_value', e.target.value)} placeholder="King" containerClassName="mb-0" />
                  <Input type="number" value={v.price} onChange={e => updateVariantRow(index, 'price', e.target.value)} placeholder="1200" containerClassName="mb-0" />
                  <Input type="number" value={v.wholesale_price} onChange={e => updateVariantRow(index, 'wholesale_price', e.target.value)} placeholder="Wholesale" containerClassName="mb-0" />
                  <Input type="number" value={v.stock} onChange={e => updateVariantRow(index, 'stock', e.target.value)} placeholder="50" containerClassName="mb-0" />
                  <Button 
                    variant="admin-ghost" 
                    size="sm" 
                    icon={Trash2} 
                    onClick={() => removeVariantRow(index)} 
                    disabled={formData.product_variants.length === 1}
                    className="text-red-500"
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, productId: null, productName: '' })}
        title="Delete Product"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button variant="admin-outline" onClick={() => setDeleteConfirm({ show: false, productId: null, productName: '' })}>Cancel</Button>
            <Button variant="admin-danger" onClick={executeDelete} loading={saving}>Delete</Button>
          </div>
        }
      >
        <div className="p-4 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Are you sure?</h3>
          <p className="text-slate-600">
            You are about to delete <strong>{deleteConfirm.productName}</strong>. This action cannot be undone.
          </p>
        </div>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title="Product Image Preview"
        size="lg"
      >
        <div className="image-preview-modal-content">
          {previewImage && (
            <img src={previewImage} alt="Preview" />
          )}
        </div>
      </Modal>

    </div>
  );
};

export default AdminProducts;
