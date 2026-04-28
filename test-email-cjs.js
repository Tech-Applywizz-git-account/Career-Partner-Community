const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://lcoudctoaizjmrcvgjvk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3VkY3RvYWl6am1yY3ZnanZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgxNzA3OCwiZXhwIjoyMDgwMzkzMDc4fQ.59n1dclA6JdMnhZ7IwT8vRJoKc1tYmGJM1dQuRX2Pu8';
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
