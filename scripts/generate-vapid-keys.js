import webPush from 'web-push'

const vapidKeys = webPush.generateVAPIDKeys()

console.log('=== VAPID Keys Generated ===\n')
console.log('Public Key (add to .env.local as VITE_VAPID_PUBLIC_KEY):')
console.log(vapidKeys.publicKey)
console.log('\nPrivate Key (add to Supabase Edge Function secrets as VAPID_PRIVATE_KEY):')
console.log(vapidKeys.privateKey)
console.log('\n=== Setup Instructions ===')
console.log('1. Add the public key to your .env.local file:')
console.log(`   VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log('\n2. Add secrets to Supabase Edge Functions:')
console.log(`   supabase secrets set VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)
console.log(`   supabase secrets set VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log('   supabase secrets set VAPID_SUBJECT=mailto:your-email@example.com')
console.log('\n3. Also add the public key in your Vercel environment variables.')
console.log('\nKeep the private key safe! Do not commit it to version control.')
