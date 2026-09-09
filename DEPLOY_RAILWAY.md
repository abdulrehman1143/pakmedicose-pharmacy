# 🚀 Deploy to Railway.app (Pakistan Client Testing)

## Quick Deployment (5 minutes)

### Step 1: Prepare GitHub
```bash
cd medical-store
git init
git add .
git commit -m "Pak Medicose Pharmacy - Medical Store Management System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pakmedicose-pharmacy.git
git push -u origin main
```

### Step 2: Deploy on Railway.app

1. **Go to**: https://railway.app
2. **Sign up** (free account)
3. **Connect GitHub**
4. **Select repo**: pakmedicose-pharmacy
5. **Click Deploy**

Railway automatically:
- ✅ Installs dependencies (npm install)
- ✅ Starts server (npm start)
- ✅ Assigns URL: `https://pakmedicose-pharmacy-xxx.railway.app`
- ✅ Scales automatically

### Step 3: Add Environment Variables

In Railway Dashboard:
```
PORT = 3002
NODE_ENV = production
JWT_SECRET = pakmedicose-pharmacy-secret-key-2026
STORE_NAME = Pak Medicose Pharmacy
```

### Step 4: Share Link with Pakistan Client

```
🔗 Send this to your client in Pakistan:

Dashboard: https://pakmedicose-pharmacy-xxx.railway.app
License Key: PAKMEDICOSE-PHARM-PMP001-260909

Instructions:
1. Open link
2. Dashboard loads automatically
3. Start testing all features
4. Feedback via WhatsApp
```

---

## 🎯 Testing Checklist for Client

**Patient Billing**:
- [ ] Add medicines to cart
- [ ] Apply discount
- [ ] View tax calculation (17%)
- [ ] Print invoice
- [ ] Customer info saved

**Inventory**:
- [ ] Add new medicine
- [ ] Check expiry alerts
- [ ] Low stock warnings
- [ ] Supplier management

**Prescriptions**:
- [ ] Add customer prescription
- [ ] Search by phone number
- [ ] Edit dosage
- [ ] Delete old prescriptions

**Reports**:
- [ ] Generate daily report
- [ ] View FBR tax collected
- [ ] Download as PDF
- [ ] Monthly liability

**Settings**:
- [ ] Enter NTN number
- [ ] Verify FBR compliance
- [ ] Save store details
- [ ] Configure tax rate

---

## 📊 Example Deployment URL

Once deployed, your client gets:
```
🌐 https://pakmedicose-pharmacy-production.railway.app
🔑 License: PAKMEDICOSE-PHARM-PMP001-260909
📱 Works on phone, tablet, laptop
🇵🇰 FBR Compliant
```

---

## 💬 Client Communication

**WhatsApp message to send**:
```
السلام عليكم

Pak Medicose Pharmacy Management System ready for testing!

🔗 Link: https://pakmedicose-pharmacy-xxx.railway.app
🔑 License Key: PAKMEDICOSE-PHARM-PMP001-260909

Features:
✅ Complete POS billing
✅ Inventory management
✅ FBR tax compliance (17%)
✅ Prescription tracking
✅ Print invoices
✅ Daily/monthly reports

Test kro aur feedback do please.
```
```

---

## ⚡ Free vs Paid

**Railway Free Tier**:
- ✅ First $5 free
- ✅ Deploy now, pay later
- ✅ Full features included
- 💰 After free tier: ₨500-1,000/month

---

## 🔧 If Issues

**Page not loading?**
- Wait 2-3 minutes (first deploy takes time)
- Clear browser cache
- Try incognito window

**Database issue?**
- Railway creates SQLite automatically
- All tables initialize on first run

**License key not working?**
- Make sure: `PAKMEDICOSE-PHARM-PMP001-260909`
- Copy exactly (no spaces)

---

**✅ Ready to share with Pakistan client!** 🚀
