'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Plus, Trash2, Edit3, GripVertical, Save, X, Settings2 } from 'lucide-react';
import styles from './page.module.css';

interface FormField {
  id: number;
  formType: string;
  name: string;
  label: string;
  type: string;
  isRequired: boolean | number;
  options: string | null;
  displayOrder: number;
}

const FORM_TYPES = [
  { value: 'contact', label: 'Contact Us Form' },
  { value: 'event_register', label: 'Conclave Registration Form' },
  { value: 'membership', label: 'Membership Form' },
  { value: 'agenda_download', label: 'Agenda Download Form' }
];

const FIELD_TYPES = [
  { value: 'text', label: 'Single Line Text (text)' },
  { value: 'email', label: 'Email (email)' },
  { value: 'tel', label: 'Telephone / Mobile (tel)' },
  { value: 'textarea', label: 'Paragraph Text (textarea)' },
  { value: 'select', label: 'Dropdown Selection (select)' },
  { value: 'checkbox', label: 'Single Checkbox (checkbox)' }
];

export default function AdminFormsFieldsManager() {
  const [selectedForm, setSelectedForm] = useState<string>('contact');
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Form states for creating/editing fields
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [fieldName, setFieldName] = useState<string>('');
  const [fieldLabel, setFieldLabel] = useState<string>('');
  const [fieldType, setFieldType] = useState<string>('text');
  const [fieldRequired, setFieldRequired] = useState<boolean>(true);
  const [fieldOptions, setFieldOptions] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Drag and drop state
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);

  // Agenda gating setting states
  const [gateEnabled, setGateEnabled] = useState<boolean>(true);
  const [loadingGateSetting, setLoadingGateSetting] = useState<boolean>(false);

  const fetchFields = async (formType: string) => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/admin/forms?type=${formType}`);
      if (res.ok) {
        const data = await res.json();
        setFields(data);
      } else {
        const err = await res.json();
        setStatus({ type: 'error', msg: err.error || 'Failed to fetch form fields.' });
      }
    } catch (err) {
      console.error('Fetch fields error:', err);
      setStatus({ type: 'error', msg: 'Network error occurred while fetching fields.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchGateSetting = async () => {
    setLoadingGateSetting(true);
    try {
      const res = await fetch('/api/admin/forms/settings?key=agenda_download_gate_enabled');
      if (res.ok) {
        const data = await res.json();
        setGateEnabled(data.value === 'true');
      }
    } catch (err) {
      console.error('Failed to fetch agenda gate setting:', err);
    } finally {
      setLoadingGateSetting(false);
    }
  };

  const handleToggleGateSetting = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setGateEnabled(newValue);
    setLoadingGateSetting(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/forms/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'agenda_download_gate_enabled', value: newValue })
      });
      if (res.ok) {
        setStatus({ type: 'success', msg: `Agenda download gating successfully ${newValue ? 'enabled' : 'disabled'}.` });
      } else {
        const err = await res.json();
        setStatus({ type: 'error', msg: err.error || 'Failed to update setting.' });
        setGateEnabled(!newValue);
      }
    } catch (err) {
      console.error('Failed to toggle agenda gate setting:', err);
      setStatus({ type: 'error', msg: 'Network error updating setting.' });
      setGateEnabled(!newValue);
    } finally {
      setLoadingGateSetting(false);
    }
  };

  useEffect(() => {
    fetchFields(selectedForm);
    cancelEditing();
    if (selectedForm === 'agenda_download') {
      fetchGateSetting();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedForm]);

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldLabel.trim() || (!editingField && !fieldName.trim())) {
      setStatus({ type: 'error', msg: 'All basic field settings are required.' });
      return;
    }

    setSaving(true);
    setStatus(null);

    const payload = {
      id: editingField?.id,
      formType: selectedForm,
      name: editingField ? editingField.name : fieldName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      label: fieldLabel.trim(),
      type: fieldType,
      isRequired: fieldRequired ? 1 : 0,
      options: fieldType === 'select' ? fieldOptions.trim() : null,
      displayOrder: editingField ? editingField.displayOrder : fields.length
    };

    try {
      const endpoint = '/api/admin/forms';
      const method = editingField ? 'PUT' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', msg: `Field ${editingField ? 'updated' : 'created'} successfully.` });
        cancelEditing();
        fetchFields(selectedForm);
      } else {
        setStatus({ type: 'error', msg: data.error || 'Failed to save field settings.' });
      }
    } catch (err) {
      console.error('Save field error:', err);
      setStatus({ type: 'error', msg: 'An unexpected error occurred.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteField = async (id: number, label: string) => {
    if (!confirm(`Are you sure you want to delete the field "${label}"? Dynamic field submissions mapping to this field name may no longer load.`)) {
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/admin/forms?id=${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', msg: 'Field deleted successfully.' });
        fetchFields(selectedForm);
      } else {
        setStatus({ type: 'error', msg: data.error || 'Failed to delete field.' });
      }
    } catch (err) {
      console.error('Delete field error:', err);
      setStatus({ type: 'error', msg: 'An unexpected error occurred during deletion.' });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (field: FormField) => {
    setEditingField(field);
    setFieldName(field.name);
    setFieldLabel(field.label);
    setFieldType(field.type);
    setFieldRequired(field.isRequired === 1 || field.isRequired === true);
    setFieldOptions(field.options || '');
  };

  const cancelEditing = () => {
    setEditingField(null);
    setFieldName('');
    setFieldLabel('');
    setFieldType('text');
    setFieldRequired(true);
    setFieldOptions('');
  };

  // Reorder drag handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (draggedItemId === null || draggedItemId === targetId) return;

    const draggedIdx = fields.findIndex(f => f.id === draggedItemId);
    const targetIdx = fields.findIndex(f => f.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const reorderedFields = [...fields];
    const [draggedItem] = reorderedFields.splice(draggedIdx, 1);
    reorderedFields.splice(targetIdx, 0, draggedItem);

    // Re-map displayOrder
    const updatedFields = reorderedFields.map((f, index) => ({
      ...f,
      displayOrder: index
    }));

    setFields(updatedFields);

    // Call API to save reordered display indices
    try {
      const res = await fetch('/api/admin/forms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reorder: true,
          fields: updatedFields.map(f => ({ id: f.id, displayOrder: f.displayOrder }))
        })
      });

      if (!res.ok) {
        const data = await res.json();
        setStatus({ type: 'error', msg: data.error || 'Failed to save field order.' });
      }
    } catch (err) {
      console.error('Reorder save error:', err);
      setStatus({ type: 'error', msg: 'Failed to update reordered configuration.' });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dynamic Forms Manager</h1>
        <p className={styles.subtitle}>Customize, add, reorder, or remove inputs dynamically for any form used on the public site.</p>
      </div>

      {/* Tabs */}
      <div className={styles.tabsRow}>
        {FORM_TYPES.map((t) => (
          <button
            key={t.value}
            className={`${styles.tabBtn} ${selectedForm === t.value ? styles.tabBtnActive : ''}`}
            onClick={() => setSelectedForm(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Alert/Status Banner */}
      {status && (
        <div className={`${styles.statusMessage} ${status.type === 'success' ? styles.statusSuccess : styles.statusError}`}>
          {status.msg}
        </div>
      )}

      {/* Agenda Download Gate Config Toggle */}
      {selectedForm === 'agenda_download' && (
        <div className={styles.settingsCard}>
          <div className={styles.settingsRow}>
            <input
              type="checkbox"
              id="agendaGateEnabled"
              checked={gateEnabled}
              onChange={handleToggleGateSetting}
              disabled={loadingGateSetting}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="agendaGateEnabled" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-default)', cursor: 'pointer' }}>
              Enable Gating Form for Agenda Downloads
            </label>
            {loadingGateSetting && <Loader2 size={14} className={styles.spinner} />}
          </div>
          <p className={styles.settingsDescription}>
            When enabled, public visitors must fill out their coordinates on the event page before downloading the conclave agenda. 
            When disabled, the form is bypassed and the agenda downloads immediately on click.
          </p>
        </div>
      )}

      {/* Main workspace splits table and input card */}
      {selectedForm === 'agenda_download' && !gateEnabled ? (
        <div className={styles.disabledBanner}>
          <Settings2 size={48} className={styles.disabledBannerIcon} />
          <h3 className={styles.disabledBannerTitle}>Agenda Download Gating is Disabled</h3>
          <p className={styles.disabledBannerText}>
            The gating form configuration is hidden because the gating form is currently disabled. 
            Public users will download the conclave agenda directly. 
            To customize the download form inputs, check the toggle above to re-enable the gating form.
          </p>
        </div>
      ) : (
        <div className={styles.workspace}>
        {/* Left Side: Fields table */}
        <div className={styles.mainPanel}>
          <h3 className={styles.panelTitle}>
            Configure inputs for: <strong>{FORM_TYPES.find(f => f.value === selectedForm)?.label}</strong>
          </h3>

          {loading && fields.length === 0 ? (
            <div className={styles.emptyState}>
              <Loader2 size={36} className={styles.spinner} style={{ margin: '0 auto 16px' }} />
              <span>Fetching dynamic form elements...</span>
            </div>
          ) : fields.length === 0 ? (
            <div className={styles.emptyState}>
              <Settings2 size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <h4 style={{ color: 'var(--text-default)' }}>No Fields Configured</h4>
              <p style={{ fontSize: '13px', marginTop: '6px' }}>Add dynamic form elements using the side panel config creator.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>Order</th>
                  <th>Field Name (ID)</th>
                  <th>Label Name</th>
                  <th>Input Type</th>
                  <th>Validation</th>
                  <th style={{ width: '80px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((f) => (
                  <tr
                    key={f.id}
                    className={styles.draggableRow}
                    draggable
                    onDragStart={(e) => handleDragStart(e, f.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, f.id)}
                  >
                    <td className={styles.dragHandle}>
                      <GripVertical size={16} />
                    </td>
                    <td>
                      <code style={{ fontSize: '11px', color: 'var(--wine-red-primary)' }}>{f.name}</code>
                    </td>
                    <td style={{ fontWeight: 600 }}>{f.label}</td>
                    <td>
                      <span style={{ fontSize: '12px' }}>
                        {FIELD_TYPES.find(ft => ft.value === f.type)?.label || f.type}
                      </span>
                      {f.type === 'select' && f.options && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Options: <em>{f.options}</em>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${f.isRequired === 1 || f.isRequired === true ? styles.badgeRequired : styles.badgeOptional}`}>
                        {f.isRequired === 1 || f.isRequired === true ? 'Required' : 'Optional'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.btnGroup}>
                        <button
                          onClick={() => startEditing(f)}
                          className={styles.actionBtn}
                          title="Edit Field"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteField(f.id, f.label)}
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          title="Delete Field"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GripVertical size={12} />
            <span>Pro-Tip: Click and drag any row by its handle to adjust the display order of fields on the website form.</span>
          </div>
        </div>

        {/* Right Side: Configuration Form */}
        <div className={styles.sidePanel}>
          <h3 className={styles.panelTitle}>
            {editingField ? 'Modify Input Field' : 'Create Form Input'}
          </h3>

          <form onSubmit={handleSaveField}>
            {!editingField && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Field ID (System Name)</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. mobile_number"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  required
                />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Lowercase alphabetic string used as index keys (no spaces, e.g. "office_address").
                </span>
              </div>
            )}

            {editingField && (
              <div className={styles.formGroup} style={{ opacity: 0.7 }}>
                <label className={styles.label}>Field ID (System Name)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={fieldName}
                  disabled
                />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Identifier name cannot be changed once created.
                </span>
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>Form Display Label</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. Mobile Number"
                value={fieldLabel}
                onChange={(e) => setFieldLabel(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Field Render Type</label>
              <select
                className={styles.select}
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value)}
              >
                {FIELD_TYPES.map(ft => (
                  <option key={ft.value} value={ft.value}>{ft.label}</option>
                ))}
              </select>
            </div>

            {fieldType === 'select' && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Dropdown Options</label>
                <textarea
                  className={styles.textarea}
                  placeholder="e.g. Option 1, Option 2, Option 3"
                  value={fieldOptions}
                  onChange={(e) => setFieldOptions(e.target.value)}
                  rows={3}
                  required
                />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Enter values separated by commas.
                </span>
              </div>
            )}

            <div className={styles.checkboxRow}>
              <input
                type="checkbox"
                id="fieldRequired"
                className={styles.checkbox}
                checked={fieldRequired}
                onChange={(e) => setFieldRequired(e.target.checked)}
              />
              <label htmlFor="fieldRequired" className={styles.label} style={{ margin: 0, cursor: 'pointer' }}>
                Required Input
              </label>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 size={14} className={styles.spinner} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>{editingField ? 'Save Field Edits' : 'Create Form Field'}</span>
                </>
              )}
            </button>

            {editingField && (
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={cancelEditing}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>
      </div>
      )}
    </div>
  );
}
