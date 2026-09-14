# 🚀 Skillora Backend — Postman Testing Guide

This guide walks you through testing your **Skillora Backend API** step-by-step using **Postman**.

---

## 📁 1. Generated Postman Files

Two ready-to-import files have been created in your project root and in `backend/`:

1. **`Skillora_API.postman_collection.json`**  
   Pre-configured with **30+ endpoints across 13 modules**, complete with headers, JSON sample bodies, and automatic JWT token handling scripts.
2. **`Skillora_Environment.postman_environment.json`**  
   Contains variables: `{{baseUrl}}`, `{{authToken}}`, `{{adminToken}}`, `{{userId}}`, `{{professionalId}}`, `{{serviceId}}`, `{{categoryId}}`, etc.

---

## ⚙️ 2. Start the Backend Server

Before testing in Postman, ensure your backend server and MySQL database are active.

1. **Start MySQL**:
   - Start MySQL using **XAMPP / WAMP** or your local MySQL service.
   - Ensure the database `skillora_db` exists:
     ```sql
     CREATE DATABASE IF NOT EXISTS skillora_db;
     ```

2. **Open a terminal in the `backend` folder**:
   ```bash
   cd backend
   npm install
   ```

3. **(Optional) Seed initial data** (creates categories, artisans, test customer, and admin):
   ```bash
   npm run seed
   ```
   *Test accounts created by seed:*
   - **Admin:** `admin@interlink.com` | `Password123!`
   - **Customer:** `customer@interlink.com` | `Password123!`
   - **Artisan:** `john.electrician@interlink.com` | `Password123!`

4. **Start the backend**:
   ```bash
   npm run dev
   ```
   *(or `npm start`)*  
   You should see:
   ```text
   Database synchronized with Skillora AI Verification models.
   Skillora Backend Server running on http://localhost:5000
   ```

---

## 📥 3. How to Import Into Postman

1. Open the **Postman** desktop application (or web version at `go.postman.co`).
2. In the top-left sidebar, click **Import** (or press `Ctrl + O`).
3. Drag & drop or browse to:
   - `c:\Users\PC\Desktop\My project\Skillora_API.postman_collection.json`
   - `c:\Users\PC\Desktop\My project\Skillora_Environment.postman_environment.json`
4. Click **Import**.
5. In the top-right corner of Postman, click the **Environment Dropdown** (defaults to *No Environment*) and select:  
   👉 **`Skillora Local Environment`**

---

## 🧪 4. Step-by-Step Testing Workflow

Follow this logical order to test all core functionality:

### Step 1: Server Health Check
- Open: **`00 - Health & Meta`** ➔ **`1. Health Check`**
- Click **Send**.
- **Expected Result (200 OK):**
  ```json
  {
    "success": true,
    "message": "Skillora API is running",
    "geminiConfigured": true,
    "timestamp": "..."
  }
  ```

---

### Step 2: Authentication & Automatic Token Chaining
- Open: **`01 - Authentication`** ➔ **`3. Login (Customer / Professional)`**
- Click **Send**.
- **What happens automatically:**  
  The built-in test script extracts the JWT token from the response and saves it as `{{authToken}}`.  
  *You do not need to copy-paste the token into any other requests!*
- Open: **`01 - Authentication`** ➔ **`4. Get Current User (/me)`**
- Click **Send**.
- **Expected Result:** Status `200 OK` returning the user profile.

---

### Step 3: Browse Categories & Artisans
- Open: **`03 - Categories`** ➔ **`1. Get All Categories`**
  - Click **Send**. Automatically stores the first category ID in `{{categoryId}}`.
- Open: **`04 - Professionals & Artisans`** ➔ **`1. Get All Professionals`**
  - Click **Send**. Automatically stores the first artisan ID in `{{professionalId}}`.
- Open: **`04 - Professionals & Artisans`** ➔ **`2. Filter Professionals`**
  - Test searching: `?search=electrician&verificationStatus=TRUSTED`.

---

### Step 4: Bookings & Services
- Open: **`05 - Services`** ➔ **`1. Get All Services`**
  - Click **Send**. Automatically stores `{{serviceId}}`.
- Open: **`06 - Service Requests & Bookings`** ➔ **`1. Create Booking Request`**
  - Click **Send**. Creates a booking using `{{professionalId}}` and `{{serviceId}}` and saves `{{requestId}}`.
- Open: **`06 - Service Requests & Bookings`** ➔ **`2. Get My Service Requests`**
  - Click **Send** to view all bookings for the logged-in user.

---

### Step 5: Test AI Features (Gemini)
- Open: **`10 - AI Services`** ➔ **`1. AI Chat Assistant`**
  - Sends a troubleshooting prompt (e.g., *"mon disjoncteur saute dès que j'allume le chauffe-eau"*).
  - Click **Send** to see the AI diagnostic and artisan recommendation.
- Open: **`10 - AI Services`** ➔ **`2. AI Match Recommendations`**
  - Click **Send** to test weighted matching algorithm.
- Open: **`10 - AI Services`** ➔ **`3. Generate Technical Questions`**
  - Generates custom quiz questions for trade assessments.

---

### Step 6: Test Admin Dashboard APIs
- Open: **`12 - Admin Panel`** ➔ **`1. Admin Login`**
  - Body has: `admin@interlink.com` / `Password123!`.
  - Click **Send**. The script automatically saves `{{adminToken}}`.
- Open: **`12 - Admin Panel`** ➔ **`3. Platform Stats & Metrics`**
  - Click **Send** to view total users, verified artisans, missions, and average rating.
- Open: **`12 - Admin Panel`** ➔ **`7. Admin Get Verification Requests`**
  - Click **Send** to view pending artisan applications.
- Open: **`12 - Admin Panel`** ➔ **`8. Admin Process Verification (Approve)`**
  - Approves the selected artisan.

---

## 💡 5. Testing Tips & Tricks

- **Authorization Headers**: Protected routes already have `Authorization: Bearer {{authToken}}` or `Authorization: Bearer {{adminToken}}` pre-filled.
- **Dynamic IDs**: Whenever you run requests like *Get All Categories*, *Get All Professionals*, or *Get All Services*, Postman will automatically update variables (`{{categoryId}}`, `{{professionalId}}`, etc.) for subsequent calls.
- **Run the Entire Collection with Collection Runner**:
  - In Postman, click on **Skillora API Collection** ➔ click **Run collection** (blue button).
  - You can run all 30+ tests in sequence automatically!
