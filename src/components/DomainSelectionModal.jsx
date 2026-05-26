// src/components/DomainSelectionModal.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import useAuth from '../hooks/useAuth';

export default function DomainSelectionModal() {
  const { user } = useAuth();
  const [show, setShow]         = useState(false);
  const [domain, setDomain]     = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  // Check if the logged-in user already has a domain saved
  useEffect(() => {
    if (!user) return;
    const checkDomain = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('domain')
        .eq('id', user.id)
        .single();
      if (error) return; // fail silently — don't block the app
      if (!data?.domain) setShow(true);
    };
    checkDomain();
  }, [user]);

  const handleSave = async () => {
    if (!domain.trim()) {
      setError('Please enter your domain before continuing.');
      return;
    }
    setSaving(true);
    setError('');

    const { error } = await supabase
      .from('profiles')
      .update({ domain: domain.trim() })
      .eq('id', user.id);

    setSaving(false);
    if (error) {
      setError('Failed to save. Please try again.');
    } else {
      setShow(false); // ✅ saved — never shows again
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(26, 42, 71, 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        padding: '40px 36px 36px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 32px 80px rgba(44,118,255,0.15)',
        position: 'relative',
        border: '1px solid #e5e7eb',
      }}>

        {/* Icon */}
        <div style={{
          width: '56px', height: '56px',
          background: '#2C76FF',
          borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '26px',
          margin: '0 auto 20px',
          boxShadow: '0 4px 16px rgba(44,118,255,0.25)'
        }}>💼</div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{
            color: '#1E1E1E',
            fontSize: '22px',
            fontWeight: 800,
            margin: '0 0 8px',
            letterSpacing: '-0.3px',
            fontFamily: 'Inter, sans-serif'
          }}>
            What's Your Domain?
          </h2>
          <p style={{
            color: '#666666',
            fontSize: '14px',
            margin: 0,
            lineHeight: 1.6
          }}>
            Tell us your area of expertise so we can<br />
            personalise your job recommendations.
          </p>
        </div>

        {/* Text Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 700,
            color: '#1E1E1E',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}>
            Your Domain / Technology
          </label>
          <input
            type="text"
            value={domain}
            onChange={(e) => { setDomain(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. SAP, Salesforce, Data Analytics..."
            autoFocus
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '12px',
              border: error ? '2px solid #ef4444' : '2px solid #e5e7eb',
              background: '#fafafa',
              color: '#1E1E1E',
              fontSize: '15px',
              fontWeight: 500,
              outline: 'none',
              transition: 'all 0.2s ease',
              fontFamily: 'Inter, sans-serif',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#2C76FF';
              e.target.style.background = '#ffffff';
              e.target.style.boxShadow = '0 0 0 4px rgba(44,118,255,0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error ? '#ef4444' : '#e5e7eb';
              e.target.style.background = '#fafafa';
              e.target.style.boxShadow = 'none';
            }}
          />
          {error && (
            <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', marginBottom: 0 }}>
              {error}
            </p>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: '12px',
            border: 'none',
            background: saving ? '#dae7ff' : '#2C76FF',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            letterSpacing: '0.02em',
            fontFamily: 'Inter, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(44,118,255,0.2)'
          }}
          onMouseEnter={(e) => { if (!saving) { e.target.style.background = '#1E5AD4'; e.target.style.boxShadow = '0 6px 16px rgba(44,118,255,0.3)'; } }}
          onMouseLeave={(e) => { if (!saving) { e.target.style.background = '#2C76FF'; e.target.style.boxShadow = '0 4px 12px rgba(44,118,255,0.2)'; } }}
        >
          {saving ? '⏳ Saving...' : 'Save & Continue'}
        </button>

        <p style={{
          color: '#999999',
          fontSize: '12px',
          textAlign: 'center',
          marginTop: '14px',
          marginBottom: 0
        }}>
          This popup won't appear again after you save.
        </p>
      </div>
    </div>
  );
}
