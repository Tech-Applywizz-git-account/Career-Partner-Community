const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiZmN4YXdieWdmdGFsYWxodmxmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI1MDU2NywiZXhwIjoyMDkxODI2NTY3fQ.iJUbjt_MytZK_rnSfZgP6xkRJIajwzAsTwv1adZUu3w';
const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString());
console.log(payload);
