# 🎯 MB Solutions Backend - Quick Reference Sheet

## 3-Step Startup

```powershell
1. cd C:\Users\bjorg\OneDrive\Desktop\mbsolutions
2. .\backend\start.ps1
3. Open: file:///C:/Users/bjorg/OneDrive/Desktop/mbsolutions/index.html
```

## URLs

| Service | URL |
|---------|-----|
| Shop | `file:///C:/Users/bjorg/OneDrive/Desktop/mbsolutions/index.html` |
| Login | `file:///C:/Users/bjorg/OneDrive/Desktop/mbsolutions/login.html` |
| Admin | `file:///C:/Users/bjorg/OneDrive/Desktop/mbsolutions/admin.html` |
| API | `http://localhost:3000` |
| Health | `http://localhost:3000/api/health` |

## Credentials

```
Username: jmbravoc
Password: 07may2025
```

## API Endpoints

### Public
```
GET /api/productos           # List products
GET /api/productos/:id       # Get product
GET /api/health              # Check status
POST /api/login              # Get JWT token
```

### Protected (Need Bearer Token)
```
POST /api/productos          # Create
PUT /api/productos/:id       # Update
DELETE /api/productos/:id    # Delete
```

## Quick Fixes

| Issue | Fix |
|-------|-----|
| Can't connect | Run `start.ps1` |
| Port 3000 busy | Close other apps |
| Products not saving | Check token validity |
| Token expired | Login again |

## File Locations

```
backend/server.js           ← Main server
backend/data/productos.json ← Products database
backend/.env               ← Config
```

## Key Login Info

- Admin user: `jmbravoc`
- Password: `07may2025`
- Location: `backend/.env`

## Documentation Files

- `START_HERE.md` → Read first
- `QUICK_START.md` → 5-minute setup
- `API_GUIDE.md` → Full API docs

## What Gets Delivered

✅ Secure backend with JWT auth  
✅ API REST endpoints  
✅ Product database on server  
✅ Admin panel with CRUD  
✅ Complete documentation  

## Is It Working?

Test with:
```bash
curl http://localhost:3000/api/health
```

Should return: `{"status":"ok",...}`

## Common Tasks

### Create Product
1. Login with credentials above
2. Go to admin panel
3. Fill form + upload image
4. Click "Guardar"

### View Products
1. Open shop URL above
2. Products load automatically
3. Click to view details
4. Contact via WhatsApp/Email

### Add More Users
Edit `backend/.env` and restart

---

**Status:** ✅ Ready to use  
**Next:** `START_HERE.md`
