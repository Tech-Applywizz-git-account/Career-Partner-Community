import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testEmail() {
    console.log('Sending test email...')

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
    })

    if (error) {
        console.error('Error sending email:', error)
    } else {
        console.log('Email sent successfully:', data)
    }
}

testEmail()
