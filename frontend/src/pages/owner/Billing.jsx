import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { API_URL } from '../../config/api';

export default function Billing() {
  const { user } = useContext(AuthContext);
  const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
  
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [searchParams, setSearchParams] = useSearchParams();

  const isAdminOrOm = user.role === 'office_manager' || user.assignedRole === 'office_manager';

  const [farmers, setFarmers] = useState([]);
  const [farms, setFarms] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ farmId: '', billedTo: '', amount: '', purpose: '' });

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/billing`, cfg);
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to fetch invoices' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (isAdminOrOm) {
      axios.get(`${API_URL}/api/admin/users`, cfg).then(res => {
        setFarmers(res.data.filter(u => u.role === 'farmer' || u.assignedRole === 'farmer'));
      }).catch(console.error);
      axios.get(`${API_URL}/api/farms`, cfg).then(res => {
        setFarms(res.data);
      }).catch(console.error);
    }
  }, [isAdminOrOm]);

  // Handle return from Chapa
  useEffect(() => {
    const tx_ref = searchParams.get('verify');
    if (tx_ref) {
      setLoading(true);
      axios.get(`${API_URL}/api/billing/verify-payment/${tx_ref}`, cfg)
        .then(() => {
          setMessage({ type: 'success', text: 'Payment successful and verified!' });
          fetchInvoices();
          setSearchParams({});
        })
        .catch(err => {
          setMessage({ type: 'error', text: err.response?.data?.error || 'Payment verification failed' });
          setSearchParams({});
          setLoading(false);
        });
    }
  }, [searchParams]);

  const handlePay = async (id) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await axios.post(`${API_URL}/api/billing/${id}/pay`, {}, cfg);
      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to initiate payment' });
      setSaving(false);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!newInvoice.farmId || !newInvoice.billedTo || !newInvoice.amount || !newInvoice.purpose) {
      return setMessage({ type: 'error', text: 'Please fill in all fields' });
    }
    setSaving(true);
    setMessage(null);
    try {
      await axios.post(`${API_URL}/api/billing`, {
        ...newInvoice,
        amount: Number(newInvoice.amount)
      }, cfg);
      setMessage({ type: 'success', text: 'Invoice created successfully!' });
      setShowCreate(false);
      setNewInvoice({ farmId: '', billedTo: '', amount: '', purpose: '' });
      fetchInvoices();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to create invoice' });
    } finally {
      setSaving(false);
    }
  };

  if (loading && invoices.length === 0) return <div style={{ padding: 40 }}>Loading billing details...</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#064e3b' }}>🧾 {isAdminOrOm ? 'Invoice Management' : 'Billing & Subscriptions'}</h2>
          <p style={{ margin: '4px 0 0', color: '#4b5563' }}>
            {isAdminOrOm ? 'Create and manage invoices across all farms.' : 'Manage your IoT service subscriptions and fees.'}
          </p>
        </div>
        {isAdminOrOm && (
          <button 
            onClick={() => setShowCreate(!showCreate)}
            style={{
              background: '#064e3b', color: 'white', border: 'none', padding: '10px 16px',
              borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            {showCreate ? '✖ Cancel' : '➕ Create Invoice'}
          </button>
        )}
      </div>

      {message && (
        <div style={{
          padding: '12px 16px', marginBottom: '24px', borderRadius: '6px', fontWeight: 500,
          background: message.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: message.type === 'error' ? '#991b1b' : '#166534'
        }}>
          {message.text}
        </div>
      )}

      {showCreate && isAdminOrOm && (
        <form onSubmit={handleCreateInvoice} style={{
          background: '#f9fafb', padding: '20px', borderRadius: '12px', marginBottom: '24px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#111827' }}>Create New Invoice</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>Select Farmer</label>
              <select 
                value={newInvoice.billedTo} 
                onChange={e => setNewInvoice({...newInvoice, billedTo: e.target.value})}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="">-- Choose Farmer --</option>
                {farmers.map(f => <option key={f._id} value={f._id}>{f.name} ({f.email})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>Select Farm</label>
              <select 
                value={newInvoice.farmId} 
                onChange={e => setNewInvoice({...newInvoice, farmId: e.target.value})}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="">-- Choose Farm --</option>
                {farms.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>Amount (ETB)</label>
              <input 
                type="number" 
                value={newInvoice.amount} 
                onChange={e => setNewInvoice({...newInvoice, amount: e.target.value})}
                placeholder="e.g. 1500"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>Purpose / Description</label>
              <input 
                type="text" 
                value={newInvoice.purpose} 
                onChange={e => setNewInvoice({...newInvoice, purpose: e.target.value})}
                placeholder="e.g. Monthly Water Fee"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={saving}
            style={{
              background: '#2563eb', color: 'white', border: 'none', padding: '10px 24px',
              borderRadius: '6px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Creating...' : 'Send Invoice'}
          </button>
        </form>
      )}

      {invoices.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: '#f9fafb', borderRadius: '12px', color: '#6b7280' }}>
          No invoices found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {invoices.map(inv => (
            <div key={inv._id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px', borderRadius: '12px', background: 'white',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              borderLeft: `6px solid ${inv.status === 'paid' ? '#10b981' : '#f59e0b'}`
            }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#111827' }}>{inv.purpose}</h3>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', display: 'flex', gap: '16px' }}>
                  <span>🌾 Farm: {inv.farmId?.name || 'Unknown'}</span>
                  {isAdminOrOm && <span>👤 Billed to: {inv.billedTo?.name}</span>}
                  <span>📅 Date: {new Date(inv.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
                  ETB {inv.amount.toLocaleString()}
                </div>
                
                {inv.status === 'paid' ? (
                  <span style={{
                    display: 'inline-block', padding: '4px 12px', borderRadius: '9999px',
                    background: '#dcfce7', color: '#166534', fontSize: '0.75rem', fontWeight: 600
                  }}>
                    ✅ Paid on {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : 'Unknown'}
                  </span>
                ) : (
                  <button 
                    onClick={() => handlePay(inv._id)}
                    disabled={saving || isAdminOrOm}
                    title={isAdminOrOm ? "Only the billed farmer can pay this" : ""}
                    style={{
                      background: isAdminOrOm ? '#9ca3af' : '#10b981', color: 'white', border: 'none', padding: '8px 16px',
                      borderRadius: '6px', fontWeight: 600, cursor: (saving || isAdminOrOm) ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px', opacity: (saving || isAdminOrOm) ? 0.7 : 1
                    }}
                  >
                    💳 Pay with Chapa
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
