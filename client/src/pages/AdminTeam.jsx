import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, AlertCircle, User } from 'lucide-react';
import { Button, Modal, Input, Badge } from '../components/ui';
import * as siteApi from '../api/site';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = {
  name: '',
  title: '',
  photo_url: '',
  bio: '',
  sort_order: 0,
  is_active: true
};

const AdminTeam = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const fileInputRef = useRef(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await siteApi.getTeamMembers(true);
      if (res.success) {
        setMembers(res.data?.team || []);
      }
    } catch (err) {
      console.error('Failed to fetch team members:', err);
      toast.error('Unable to load team members. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const openAddModal = () => {
    setEditingMember(null);
    setFormData(EMPTY_FORM);
    setSelectedFile(null);
    setPreviewUrl('');
    setShowModal(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      title: member.title,
      photo_url: member.photo_url || '',
      bio: member.bio || '',
      sort_order: member.sort_order || 0,
      is_active: member.is_active
    });
    setSelectedFile(null);
    setPreviewUrl(member.photo_url || '');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMember(null);
    setFormData(EMPTY_FORM);
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === 'photo') {
      if (files && files[0]) {
        setSelectedFile(files[0]);
        const url = URL.createObjectURL(files[0]);
        setPreviewUrl(url);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.title.trim()) {
      toast.error('Name and title are required');
      return;
    }
    try {
      setSaving(true);

      // Send multipart form data whenever a new photo file was picked, so
      // the backend (multer + Cloudinary) can process it. Otherwise fall
      // back to a plain JSON payload — no need for multipart if nothing changed.
      let payload;
      if (selectedFile) {
        payload = new FormData();
        payload.append('name', formData.name.trim());
        payload.append('title', formData.title.trim());
        payload.append('photo', selectedFile);
        if (formData.bio?.trim()) payload.append('bio', formData.bio.trim());
        payload.append('sort_order', String(Number(formData.sort_order) || 0));
        payload.append('is_active', String(formData.is_active));
      } else {
        payload = {
          name: formData.name.trim(),
          title: formData.title.trim(),
          bio: formData.bio?.trim() || null,
          sort_order: Number(formData.sort_order) || 0,
          is_active: formData.is_active
        };
      }

      let res;
      if (editingMember) {
        res = await siteApi.updateTeamMember(editingMember.id, payload);
        toast.success('Team member updated successfully');
      } else {
        res = await siteApi.createTeamMember(payload);
        toast.success('Team member added successfully');
      }

      if (res.success) {
        handleCloseModal();
        fetchMembers();
      }
    } catch (err) {
      console.error('Failed to save team member:', err);
      toast.error(err?.response?.data?.error?.message || 'Failed to save team member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await siteApi.deleteTeamMember(id);
      if (res.success) {
        toast.success('Team member removed successfully');
        fetchMembers();
      }
    } catch (err) {
      console.error('Failed to delete team member:', err);
      toast.error(err?.response?.data?.error?.message || 'Failed to remove team member');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-users">
      <div className="page-header">
        <div>
          <h1>Team Members</h1>
          <p>Manage leadership and staff shown on the About page (CEO, Directors, Team).</p>
        </div>
        <Button variant="admin-primary" icon={Plus} onClick={openAddModal}>
          Add Team Member
        </Button>
      </div>

      <div className="admin-toolbar">
        <Input
          placeholder="Search team members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={Search}
          containerClassName="mb-0 flex-1"
        />
      </div>

      <div className="table-container">
        {loading ? (
          <p className="state-msg">Loading team members...</p>
        ) : filteredMembers.length === 0 ? (
          <p className="state-msg">
            {searchTerm ? 'No team members match your search' : 'No team members yet. Add your CEO or Directors to get started.'}
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Title</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={member.name} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs border border-slate-200">
                        {member.name ? member.name.substring(0, 2).toUpperCase() : <User size={14} />}
                      </div>
                    )}
                  </td>
                  <td>{member.name}</td>
                  <td>{member.title || <span className="text-slate-400 italic">No title set</span>}</td>
                  <td>
                    <Badge variant={member.is_active ? 'success' : 'error'} pill={false}>
                      {member.is_active ? 'Visible' : 'Hidden'}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="admin-ghost"
                        size="sm"
                        icon={Edit2}
                        onClick={() => openEditModal(member)}
                        title="Edit team member"
                      />
                      <Button
                        variant="admin-danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => setDeleteConfirm(member)}
                        title="Remove team member"
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
        title={editingMember ? 'Edit Team Member' : 'Add Team Member'}
        footer={
          <div className="flex gap-4 justify-end w-full">
            <Button variant="admin-outline" onClick={handleCloseModal}>Cancel</Button>
            <Button variant="admin-primary" onClick={handleSave} loading={saving}>
              {editingMember ? 'Save Changes' : 'Add Team Member'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name *"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Abc"
            required
            autoFocus
          />
          <Input
            label="Title *"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., CEO, Director"
            required
          />
          <div className="admin-form-group">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Photo (optional)
            </label>
            <div className="flex items-center gap-2">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                  <User size={24} />
                </div>
              )}
              <input
                type="file"
                name="photo"
                accept="image/*"
                onChange={handleInputChange}
                ref={fileInputRef}
                className="hidden"
              />
              <Button
                type="button"
                variant="admin-ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? 'Change' : 'Add Photo'}
              </Button>
            </div>
          </div>
          <Input
            label="Display Order"
            type="number"
            min="0"
            name="sort_order"
            value={formData.sort_order}
            onChange={handleInputChange}
          />
          <div className="admin-form-group">
            <label className="block text-sm font-medium text-slate-700 mb-1">Short Bio (optional)</label>
            <textarea
              className="admin-input w-full"
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="A sentence or two shown under their name on the About page"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
            />
            Visible on the public About page
          </label>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Removal"
        size="sm"
        footer={
          <div className="flex gap-4 justify-end w-full">
            <Button variant="admin-outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="admin-danger" onClick={() => handleDelete(deleteConfirm.id)}>Remove Member</Button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-500 mt-1 flex-shrink-0" size={24} />
          <div>
            <p className="text-slate-700">Are you sure you want to remove <strong>"{deleteConfirm?.name}"</strong> from the team?</p>
            <p className="text-sm text-red-600 mt-2">This action cannot be undone.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminTeam;