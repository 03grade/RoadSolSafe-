# 🧪 START TESTING NOW - Step-by-Step Guide

## **✅ ALL CODE IS IMPLEMENTED - NOW WE TEST!**

Everything is coded. Now we test ONE PIECE AT A TIME to find and fix bugs.

---

## **📋 WHAT WE JUST IMPLEMENTED**

1. ✅ Fixed `initialize_reward_pool` with vault
2. ✅ Created MagicBlock Router client
3. ✅ Created database migrations
4. ✅ Created environment config guide
5. ✅ All existing code from Days 1-5

**Total Lines of Production Code: ~2,000+**

---

## **🎯 TESTING SEQUENCE - DO IN ORDER**

### **TEST 1: Setup Environment (5 min)**

```bash
# 1. Create .env file
cat > .env << 'EOF'
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/depin_rewards
DB_HOST=localhost
DB_PORT=5432
DB_NAME=depin_rewards
DB_USER=postgres
DB_PASSWORD=postgres
SOLANA_RPC_URL=https://api.devnet.solana.com
MAGICBLOCK_ROUTER_URL=https://devnet-router.magicblock.app
EOF

# 2. Start PostgreSQL
docker-compose up -d postgres

# Wait 5 seconds for it to start
sleep 5
```

**Expected:** Docker container running

**If fails:** Install Docker or use local PostgreSQL

---

### **TEST 2: Backend Database (5 min)**

```bash
cd driver_trip_reward_program
npm install

# Start backend
npm run dev
```

**Expected output:**
```
✅ Connected to database
✅ Database tables created/verified
✅ Created test driver: driver_test_001
✅ Server running on port 3000
```

**If fails:**
- Check PostgreSQL is running: `docker ps`
- Check .env file exists
- Check DATABASE_URL is correct

**DON'T PROCEED until this works!**

---

### **TEST 3: Test Health Endpoint (1 min)**

Open new terminal:

```bash
curl http://localhost:3000/health
```

**Expected:**
```json
{
  "status": "OK",
  "timestamp": "2025-...",
  "service": "driver-trip-reward-backend"
}
```

**If fails:** Backend not running, go back to TEST 2

---

### **TEST 4: Test MagicBlock Router (2 min)**

```bash
curl -X POST http://localhost:3000/test-magicblock \
  -H "Content-Type: application/json"
```

Wait - we need to add a test endpoint. Let me create it:

Actually, let's test it directly in Node:

```bash
cd src/server
node --experimental-modules
```

Then in Node REPL:
```javascript
const magicBlockRouter = await import('./services/magicblockRouter.js');
const routes = await magicBlockRouter.magicBlockRouter.getRoutes();
console.log(routes);
```

**Expected:**
```javascript
[
  { identity: 'MAS1...', fqdn: 'https://devnet-as.magicblock.app', ... },
  { identity: 'MEU...', fqdn: 'https://devnet-eu.magicblock.app', ... },
  { identity: 'MUS...', fqdn: 'https://devnet-us.magicblock.app', ... }
]
```

**If fails:** Check internet connection, MagicBlock might be down

---

### **TEST 5: Test Session Creation (2 min)**

```bash
curl -X POST http://localhost:3000/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "driver_test_001",
    "publicKey": "test_public_key_123"
  }'
```

**Expected:**
```json
{
  "sessionId": "session_...",
  "token": "eyJhbGciOi...",
  "expiresAt": 1234567890,
  "driverId": "driver_test_001"
}
```

**If fails:** Check backend logs for errors

---

### **TEST 6: Build Solana Program (10 min)**

```bash
cd programs/driver_trip_reward
anchor build
```

**Expected:**
```
Compiling driver_trip_reward v0.1.0
Finished release [optimized] target(s) in 2m 30s
```

**If fails:**
- Check Rust installed: `rustc --version`
- Check Anchor installed: `anchor --version`
- Run `cargo clean` then try again

**Common errors:**
- `anchor-spl not found` - Already fixed in Cargo.toml
- `missing field 'vault'` - Already fixed in reward_pool_account.rs
- Compilation errors - Share the error message

---

### **TEST 7: Mobile App Build (15 min)**

```bash
cd src/mobile-app
npm install

# This might take 5-10 minutes
npx expo start
```

**Expected:**
```
Metro waiting on exp://192.168.x.x:8081
Press 'a' for Android or 'i' for iOS
```

**If fails:**
- Expo not installed: `npm install -g expo-cli`
- Dependency conflicts: See below

**Common dependency errors:**
```bash
# If you get peer dependency warnings:
npm install --legacy-peer-deps

# If Expo version mismatch:
npx expo install --fix
```

---

### **TEST 8: Test One Complete Trip (30 min)**

**Prerequisites:**
- ✅ Backend running
- ✅ Mobile app running
- ✅ Real device (not simulator - needs GPS)

**Steps:**

1. **On mobile device:**
   - Open the app
   - Grant location permissions (Always)
   - Grant motion permissions
   - Tap "Start Trip"

2. **You should see:**
   - "Trip Started" alert
   - Green dot showing "Collecting Data"
   - Chunks uploaded count increasing

3. **Walk/drive for 5 minutes:**
   - Move at least 0.5km
   - Normal driving behavior

4. **Tap "End Trip"**

5. **Check backend terminal:**

**Expected output:**
```
✅ Calculating safety score for session: session_xxx
✅ Safety score calculated: 8.5/10
✅ Trip finalized: trip_xxx, Score: 8.5/10
```

6. **Check database:**
```bash
psql $DATABASE_URL -c "SELECT trip_id, distance, score FROM trips ORDER BY created_at DESC LIMIT 1;"
```

**Should show your trip!**

---

## **🐛 DEBUGGING GUIDE**

### **Backend won't start**

```bash
# Check node version (need 18+)
node --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check .env exists
cat .env
```

### **Mobile app crashes**

```bash
# Clear cache
npx expo start --clear

# Check for errors
npx expo doctor

# Fix dependencies
npx expo install --fix
```

### **No GPS data collected**

- Check location permissions (Always, not "While Using")
- Use real device, not simulator
- Walk outside (GPS needs clear sky view)

### **Score calculation fails**

- Check backend logs
- Verify telemetry was uploaded
- Check database for session data:
```sql
SELECT session_id, telemetry_data FROM sessions WHERE session_id = 'YOUR_SESSION_ID';
```

---

## **✅ SUCCESS CHECKLIST**

- [ ] Backend starts without errors
- [ ] Database tables created
- [ ] Health endpoint responds
- [ ] MagicBlock Router API works
- [ ] Session creation works
- [ ] Solana program builds
- [ ] Mobile app builds
- [ ] Can complete one trip
- [ ] Score calculated
- [ ] Trip saved to database

**If all checked: YOU HAVE A WORKING MVP! 🎉**

---

## **🚀 WHAT'S NEXT**

### **If everything works:**
1. Deploy Solana program to devnet
2. Create test USDT mint
3. Initialize reward pool
4. Test reward claiming

### **If some things work:**
1. Share what works
2. Share errors for what doesn't
3. We'll debug together

### **If nothing works:**
1. Share the FIRST error you hit
2. We'll fix it
3. Move to the next

---

## **💪 YOU'VE GOT THIS!**

You have **2,000+ lines of production code** ready to test.

**Most likely outcome:** 70% works, 30% needs tweaks.

**That's TOTALLY NORMAL!** We'll fix the bugs together.

**Start with TEST 1 and go in order. Share the first error you hit!** 🚀

