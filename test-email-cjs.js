const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmail() {
    console.log('Sending test email to tunguturidineshkumar@gmail.com...');

    try {
        const { data, error } = await supabase.functions.invoke('send-email', {
            body: {
                to: 'tunguturidineshkumar@gmail.com',
                firstName: 'Dinesh',
                lastName: 'Kumar',
                transactionId: 'TEST-TRANS-ID',
                orderId: 'TEST-ORDER-ID',
                timeOfPayment: new Date().toISOString(),
                amount: '30.00',
                currency: 'USD',
                password: 'TestPassword123'
            }
        });

        if (error) {
            console.error('❌ Error sending email:', error);
            if (error instanceof Error) {
                console.error('Error message:', error.message);
            }
        } else {
            console.log('✅ Email function response:', data);
        }
    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

testEmail();
