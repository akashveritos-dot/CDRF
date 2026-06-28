'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Loader2, 
  Link as LinkIcon,
  Award,
  Linkedin,
  Building,
  AlertCircle,
  GripVertical
} from 'lucide-react';
import styles from './page.module.css';
import ActionLoader from '@/components/ui/ActionLoader/ActionLoader';

function getFriendlyError(err: any, fallback: string): string {
  const msg = err?.message || '';
  if (!msg || msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('typeerror') || msg.toLowerCase().includes('database') || msg.toLowerCase().includes('internal server error')) {
    return 'Unable to connect to the server. Please check your network connection and try again.';
  }
  return msg;
}

export default function AdminCouncils() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    role: '',
    role_badge_color: 'default',
    avatar_initials: '',
    profile_image: '',
    bio: '',
    linkedin_url: '',
    organization: '',
    display_order: 0,
    is_active: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadSuccess, setImageUploadSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Drag-and-drop / display limit states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [displayLimit, setDisplayLimit] = useState(25);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const reordered = [...members];
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedItem);

    setMembers(reordered);
    setDraggedIndex(null);

    const orderedIds = reordered.map(item => item.id);
    setActionLoading('Reordering council profiles...');
    try {
      const res = await fetch('/api/admin/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'councils', orderedIds })
      });
      if (!res.ok) throw new Error('Failed to update display order.');
    } catch (err: any) {
      console.error(err);
      fetchMembers(); // Revert on failure
    } finally {
      setActionLoading(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setImageUploadSuccess('');
    setError('');
    setActionLoading('Uploading profile image...');

    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload image');

      setFormData(prev => ({ ...prev, profile_image: data.url }));
      setImageUploadSuccess(file.name);
    } catch (err: any) {
      setError(err.message || 'Image upload failed.');
    } finally {
      setIsUploadingImage(false);
      setActionLoading(null);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/councils?all=true');
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load council members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      id: '',
      name: '',
      role: '',
      role_badge_color: 'default',
      avatar_initials: '',
      profile_image: '',
      bio: '',
      linkedin_url: '',
      organization: '',
      display_order: members.length + 1,
      is_active: true
    });
    setError('');
    setImageUploadSuccess('');
    setIsFormOpen(true);
  };

  const handleEdit = (member: any) => {
    setEditingId(member.id);
    setFormData({
      id: member.id,
      name: member.name || '',
      role: member.role || '',
      role_badge_color: member.roleBadgeColor || 'default',
      avatar_initials: member.avatarInitials || '',
      profile_image: member.profileImage || '',
      bio: member.bio || '',
      linkedin_url: member.linkedinUrl || '',
      organization: member.organization || '',
      display_order: member.displayOrder || 0,
      is_active: member.isActive !== false
    });
    setError('');
    setImageUploadSuccess('');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    // eslint-disable-next-line no-alert
    if (!confirm('Are you sure you want to permanently delete this council member?')) return;
    setIsSaving(true);
    setActionLoading('Deleting council member...');
    try {
      const res = await fetch(`/api/admin/councils/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete');
      }
      await fetchMembers();
    } catch (err: any) {
      // eslint-disable-next-line no-alert
      alert(getFriendlyError(err, 'Error deleting council member. Please try again.'));
    } finally {
      setIsSaving(false);
      setActionLoading(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let parsedValue: any = value;
    if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'display_order') {
      parsedValue = parseInt(value, 10) || 0;
    }

    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    setActionLoading(editingId ? 'Saving profile...' : 'Creating profile...');

    try {
      const url = editingId ? `/api/admin/councils/${editingId}` : '/api/councils';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save council member');

      setIsFormOpen(false);
      fetchMembers();
    } catch (err: any) {
      setError(getFriendlyError(err, 'Error occurred while saving council member. Please try again.'));
    } finally {
      setIsSaving(false);
      setActionLoading(null);
    }
  };

  const getBadgeClass = (color?: string) => {
    switch (color) {
      case 'gold': return styles.badgeGold;
      case 'finance': return styles.badgeFinance;
      default: return '';
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <Users className={styles.headerIcon} size={28} />
          <div>
            <h1>Governing Councils Manager</h1>
            <p>Administer members of the DCRF Governing and Executive councils displayed on the public website.</p>
          </div>
        </div>
        <button onClick={handleAddNew} className={styles.addBtn}>
          <Plus size={16} />
          Add Council Member
        </button>
      </div>

      {/* Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>Show limit:</span>
          <select 
            value={displayLimit} 
            onChange={(e) => setDisplayLimit(e.target.value === 'all' ? 9999 : Number(e.target.value))}
            style={{
              backgroundColor: '#121824',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#ffffff',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '12px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value={10}>10 profiles</option>
            <option value={25}>25 profiles</option>
            <option value={50}>50 profiles</option>
            <option value="all">All profiles</option>
          </select>
        </div>
      </div>

      {/* Main List Grid/Table */}
      {loading ? (
        <div className={styles.loadingBlock}>
          <Loader2 size={32} className={styles.spinner} />
          <span>Syncing council profiles...</span>
        </div>
      ) : members.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>Sort</th>
                <th style={{ width: '80px' }}>Initials</th>
                <th>Name & Organization</th>
                <th>Council Role</th>
                <th>Display Order</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.slice(0, displayLimit).map((member, index) => (
                <tr 
                  key={member.id} 
                  className={styles.tableRow}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  style={{
                    opacity: draggedIndex === index ? 0.4 : 1,
                    transition: 'opacity 0.2s',
                    cursor: 'grab'
                  }}
                >
                  <td style={{ textAlign: 'center', verticalAlign: 'middle', width: '40px' }}>
                    <GripVertical size={14} style={{ color: 'rgba(255, 255, 255, 0.3)', cursor: 'grab' }} />
                  </td>
                  <td>
                    <div className={styles.avatarCell}>
                      {member.profileImage ? (
                        // eslint-disable-next-line
                        <img 
                          src={member.profileImage} 
                          alt={member.name} 
                          className={styles.avatarImg}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : null}
                      <span className={styles.avatarInitialsText}>{member.avatarInitials}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.nameCell}>
                      <span className={styles.nameText}>{member.name}</span>
                      <span className={styles.orgText}>{member.organization || 'No Organization'}</span>
                      {member.linkedinUrl && (
                        <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className={styles.linkedinLink}>
                          <Linkedin size={10} fill="currentColor" stroke="none" /> LinkedIn
                        </a>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.roleBadge} ${getBadgeClass(member.roleBadgeColor)}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className={styles.orderCell}>
                    {member.displayOrder}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${member.isActive !== false ? styles.statusActive : styles.statusInactive}`}>
                      {member.isActive !== false ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionCell}>
                      <button 
                        onClick={() => handleEdit(member)} 
                        disabled={isSaving}
                        className={styles.editBtn}
                        title="Edit Member"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(member.id)} 
                        disabled={isSaving}
                        className={styles.deleteBtn}
                        title="Delete Member"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <AlertCircle size={36} />
          <h3>No council members found.</h3>
          <p>Click "Add Council Member" to insert the first profile.</p>
        </div>
      )}

      {/* Form Overlay Modal */}
      {isFormOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingId ? 'Edit Council Profile' : 'Add New Council Member'}</h2>
              <button onClick={() => setIsFormOpen(false)} className={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className={styles.modalError}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                {/* ID (Editable only for new member) */}
                <div className={styles.inputGroup}>
                  <label htmlFor="id">Member ID Code (Short lowercase, e.g. "bm", "aj")</label>
                  <input
                    id="id"
                    type="text"
                    name="id"
                    required
                    disabled={Boolean(editingId)}
                    value={formData.id}
                    onChange={handleInputChange}
                    placeholder="e.g. bm"
                    className={styles.inputField}
                  />
                </div>

                {/* Display Order */}
                <div className={styles.inputGroup}>
                  <label htmlFor="display_order">Display Ordering Weight (1, 2, 3...)</label>
                  <input
                    id="display_order"
                    type="number"
                    name="display_order"
                    required
                    value={formData.display_order}
                    onChange={handleInputChange}
                    className={styles.inputField}
                  />
                </div>

                {/* Name */}
                <div className={`${styles.inputGroup} ${styles.colSpan2}`}>
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Dr. Brijendra Kumar Mishra"
                    className={styles.inputField}
                  />
                </div>

                {/* Role & Role Badge Color */}
                <div className={styles.inputGroup}>
                  <label htmlFor="role">Federation Role / Designation</label>
                  <input
                    id="role"
                    type="text"
                    name="role"
                    required
                    value={formData.role}
                    onChange={handleInputChange}
                    placeholder="e.g. Secretary General, DCRF"
                    className={styles.inputField}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="role_badge_color">Role Badge Theme color</label>
                  <select
                    id="role_badge_color"
                    name="role_badge_color"
                    value={formData.role_badge_color}
                    onChange={handleInputChange}
                    className={styles.selectField}
                  >
                    <option value="default">Default Blue</option>
                    <option value="gold">Gold (Leadership)</option>
                    <option value="finance">Finance (Controller)</option>
                  </select>
                </div>

                {/* Avatar Initials & Profile Image URL */}
                <div className={styles.inputGroup}>
                  <label htmlFor="avatar_initials">Avatar Initials (2-3 chars max)</label>
                  <input
                    id="avatar_initials"
                    type="text"
                    name="avatar_initials"
                    required
                    maxLength={3}
                    value={formData.avatar_initials}
                    onChange={handleInputChange}
                    placeholder="e.g. BM"
                    className={styles.inputField}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="profile_image">Profile Image URL</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center' }}>
                    <input
                      id="profile_image"
                      type="text"
                      name="profile_image"
                      value={formData.profile_image}
                      onChange={handleInputChange}
                      placeholder="Paste image link or upload a file"
                      className={styles.inputField}
                    />
                    <div style={{ position: 'relative' }}>
                      <input
                        type="file"
                        accept="image/*"
                        id="councils-profile-upload"
                        style={{ display: 'none' }}
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                      />
                      <label
                        htmlFor="councils-profile-upload"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          height: '38px',
                          padding: '0 14px',
                          borderRadius: '8px',
                          backgroundColor: '#121824',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#ffffff',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 600,
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap',
                          boxSizing: 'border-box'
                        }}
                        onMouseEnter={(e) => { 
                          e.currentTarget.style.backgroundColor = '#1e293b';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                        }}
                        onMouseLeave={(e) => { 
                          e.currentTarget.style.backgroundColor = '#121824';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                        }}
                      >
                        {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                      </label>
                    </div>
                  </div>
                  {imageUploadSuccess && (
                    <span style={{ fontSize: '11px', color: '#10b981', display: 'block', marginTop: '2px' }}>
                      ✓ Uploaded: <strong>{imageUploadSuccess}</strong>
                    </span>
                  )}
                </div>

                {/* Organization & LinkedIn URL */}
                <div className={styles.inputGroup}>
                  <label htmlFor="organization">Primary Organization Affiliation</label>
                  <div className={styles.iconInputWrap}>
                    <Building size={14} className={styles.inputIcon} />
                    <input
                      id="organization"
                      type="text"
                      name="organization"
                      value={formData.organization}
                      onChange={handleInputChange}
                      placeholder="e.g. KPMG India"
                      className={styles.inputFieldWithIcon}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="linkedin_url">LinkedIn Profile URL</label>
                  <div className={styles.iconInputWrap}>
                    <Linkedin size={14} className={styles.inputIcon} />
                    <input
                      id="linkedin_url"
                      type="text"
                      name="linkedin_url"
                      value={formData.linkedin_url}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/in/username"
                      className={styles.inputFieldWithIcon}
                    />
                  </div>
                </div>

                {/* Bio Description */}
                <div className={`${styles.inputGroup} ${styles.colSpan2}`}>
                  <label htmlFor="bio">Professional Profile Bio Summary</label>
                  <textarea
                    id="bio"
                    name="bio"
                    required
                    rows={4}
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Detailed professional bio, credentials, former positions..."
                    className={styles.textareaField}
                  />
                </div>

                {/* Visibility Status */}
                <div className={`${styles.inputGroup} ${styles.colSpan2}`} style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                  <input
                    id="is_active"
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="is_active" style={{ cursor: 'pointer', marginBottom: 0 }}>
                    Show profile active on the public Governing Council directory
                  </label>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsFormOpen(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className={styles.saveBtn}>
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className={styles.spinner} />
                      Saving Profile...
                    </>
                  ) : (
                    editingId ? 'Save Changes' : 'Create Profile'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ActionLoader message={actionLoading} />
    </div>
  );
}
