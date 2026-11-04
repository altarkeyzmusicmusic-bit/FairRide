const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express();
app.use(cors());
app.use(express.json());
const supabase = createClient('https://tewhrcduudgkmmqzkhev.supabase.co','sb_publishable_dJClvlZ65RVF7EtjfC8x8w_meOVq6O_');
const dbConfig = { host: process.env.MYSQLHOST, user: process.env.MYSQLUSER, password: process.env.MYSQLPASSWORD, database: process.env.MYSQLDATABASE, port: process.env.MYSQLPORT || 3306 };
app.get('/', (req,res)=> res.json({ status: 'FairRide Linked - Supabase tewhrcduudgkmmqzkhev + Railway MySQL', url: 'https://fairride-production-3aa1.up.railway.app' }));
app.post('/api/register', async (req,res)=>{
  try{
    const { name, phone, email } = req.body;
    try{ const conn = await mysql.createConnection(dbConfig); await conn.execute('CREATE TABLE IF NOT EXISTS users (id VARCHAR(255) PRIMARY KEY, name TEXT, phone TEXT, email TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)'); await conn.execute('INSERT INTO users (id, name, phone, email) VALUES (UUID(), ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)', [name, phone, email]); await conn.end(); }catch(e){ console.log('MySQL register:', e.message); }
    try{ await supabase.from('users').insert({ name, phone, email }); }catch(e){ console.log('Supabase register:', e.message); }
    res.json({ success: true, message: 'User registered in MySQL + Supabase' });
  }catch(e){ res.status(500).json({ error: e.message }); }
});
app.post('/api/trips', async (req,res)=>{
  try{
    const data = req.body;
    try{ const conn = await mysql.createConnection(dbConfig); await conn.execute(`CREATE TABLE IF NOT EXISTS trips (id VARCHAR(255) PRIMARY KEY, user_id TEXT, vehicle_type TEXT, pickup_lat DOUBLE, pickup_lng DOUBLE, drop_lat DOUBLE, drop_lng DOUBLE, price DOUBLE, description TEXT, status TEXT DEFAULT 'searching', addReturn BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`); await conn.execute('INSERT INTO trips (id, user_id, vehicle_type, pickup_lat, pickup_lng, drop_lat, drop_lng, price, description, addReturn) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)', [data.user_id, data.vehicle_type, data.pickup_lat, data.pickup_lng, data.drop_lat, data.drop_lng, data.price, data.description, data.addReturn || false]); await conn.end(); }catch(e){ console.log('MySQL trips:', e.message); }
    try{
      await supabase.from('trips').insert({ user_id: data.user_id, vehicle_type: data.vehicle_type, pickup_lat: data.pickup_lat, pickup_lng: data.pickup_lng, drop_lat: data.drop_lat, drop_lng: data.drop_lng, price: data.price, description: data.description, addReturn: data.addReturn || false, status: 'searching' });
      if (data.vehicle_type === 'gogo_return') { await supabase.from('gogo_returns').insert({ user_id: data.user_id, drop_lat: data.drop_lat, drop_lng: data.drop_lng, return_price: data.price, expires_at: new Date(Date.now() + 75*60000).toISOString() }); }
      if (data.vehicle_type && data.vehicle_type.startsWith('rating_')) { await supabase.from('ratings').insert({ trip_id: 'api_trip', rater_id: data.user_id, rated_id: data.description, rated_role: data.vehicle_type.replace('rating_',''), stars: data.price, comment: data.description }); }
    }catch(e){ console.log('Supabase trips:', e.message); }
    res.json({ success: true, linked: 'MySQL + Supabase tewhrcduudgkmmqzkhev' });
  }catch(e){ res.status(500).json({ error: e.message }); }
});
app.get('/api/gogo-return/:userId', async (req,res)=>{
  try{ const { data } = await supabase.from('gogo_returns').select('*').eq('user_id', req.params.userId).order('created_at', { ascending: false }).limit(1); if (data && data.length > 0) return res.json(data[0]); res.json({ valid: false }); }catch(e){ res.json({ valid: false }); }
});
const PORT = process.env.PORT || 8080;
app.listen(PORT, ()=> console.log('FairRide Linked running on ' + PORT));
