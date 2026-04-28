import React from 'react';

const EnvCheck = () => {
    return (
        <div style={{ padding: '20px', backgroundColor: '#f0f0f0', margin: '20px', borderRadius: '8px' }}>
            <h2>Environment Variables Check</h2>
            <div style={{ fontFamily: 'monospace', marginTop: '15px' }}>
                <p><strong>VITE_SUPABASE_URL:</strong> {import.meta.env.VITE_SUPABASE_URL || '❌ NOT SET'}</p>
                <p><strong>VITE_SUPABASE_ANON_KEY:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ SET' : '❌ NOT SET'}</p>
                <p><strong>VITE_PAYPAL_CLIENT_ID:</strong> {import.meta.env.VITE_PAYPAL_CLIENT_ID || '❌ NOT SET'}</p>
            </div>
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                <p><strong>⚠️ If any show "NOT SET":</strong></p>
                <ol>
                    <li>Create/check your <code>.env</code> file in the <code>frontend</code> folder</li>
                    <li>Make sure it has all three variables</li>
                    <li>Restart the dev server (Ctrl+C then <code>npm run dev</code>)</li>
                </ol>
            </div>
        </div>
    );
};

export default EnvCheck;
