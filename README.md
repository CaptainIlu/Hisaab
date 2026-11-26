# Hisaab 🏠

> A mobile-first Progressive Web App (PWA) designed for flatmates to track shared monthly expenses, automate static monthly bills (Society, Electricity, Maid, Cook, Gas, WiFi), batch groceries twice a month (1-15 & 16-End), and seamlessly track & sync expenses into Splitwise.

---

## ✨ Features Built for Your Workflow

### 1. 📅 Monthly Tracking & Deep Analysis
- **Month Stepper**: Easily navigate between months (`‹ Nov 2026 ›`) with instant recalculation.
- **Monthly Net Settlement Balance**: Instantly see who paid what and who owes whom (e.g., *"Flatmate owes you ₹4,200"* or *"You owe Flatmate ₹1,500"*).
- **Interactive Visual Breakdown**:
  - SVG category donut chart with center total.
  - Ranked category spend list with proportional progress bars.
  - Payment contribution ratio visualizer (Your share vs Flatmate's share).
  - Daily average spend metric.

### 2. ⚡ Automated New Month Static Expenses Setup
- As soon as a new month starts, Hisaab prompts you with a checklist banner:
  > *"✨ November Static Expenses — Add Society, Electricity, Maid & flat bills"*
- Tapping **"Review & Add"** opens the monthly setup sheet:
  - Pre-filled with your configurable recurring bills (Society Dues, Maid Salary, Cook Salary, Gas Cylinder, WiFi Broadband, etc.).
  - Variable expenses (like Electricity) can be quickly edited in-place with the current month's bill amount.
  - Single tap **"Add Selected Expenses"** generates all recurring expenses tagged for that month and marked as pending for Splitwise.
- **Fully Configurable in Settings**: Add, edit, remove, or change default amounts and payers for recurring bills anytime.

### 3. 🔄 Splitwise Sync Tracker & Bi-Monthly Grocery Batches
- Designed specifically for entering expenses into the official Splitwise app:
- **Bi-Monthly Collective Grocery Batches (1-15th & 16th-End)**:
  - Record daily groceries (Blinkit, Zepto, Milk, Supermarket) individually as they happen.
  - In the **Splitwise** tab, they automatically roll up into two neat collective cycles:
    - **Cycle 1 (1st – 15th)**: Total spend, who paid what (e.g. Shivam ₹2,350, Sanket ₹1,100), and a single **`[Mark Batch Added]`** button!
    - **Cycle 2 (16th – End of month)**: Same collective breakdown & 1-tap batch sync.
  - **`[Copy for Splitwise]` per batch**: Instantly copies the collective total, payer breakdown, and individual receipt details formatted for Splitwise.
  - **Master "Copy Summary"**: Formats the entire month's pending expenses with groceries rolled up collectively into Cycle 1 & Cycle 2, and non-grocery flat bills listed individually.
- **Instant Status Badge on Every Expense**: Toggle between `○ Splitwise` (pending) and `✓ In Splitwise` (synced) with a single tap.
- **Interactive Checklist**: As you enter expenses on your phone's Splitwise app, tap checkboxes to mark them synced.
- **"Mark All Added"**: 1-tap batch completion once your monthly sync is finished.

### 4. 📱 100% Mobile-First PWA (Phone Native Feel)
- Designed following clean design principles: touch targets (44px+), no clunky UI or neon glow.
- **Refined Nordic Paper Aesthetic**: Warm linen background (`#f6f4ee`), clean typography, crisp touch targets (44px+), and dark pine teal accent with warm amber highlights.
- Tactile bottom sheets for expense creation and editing.
- Bottom navigation with dynamic badge indicators.
- iPhone safe-area padding (`env(safe-area-inset-bottom)`) for edge-to-edge screens.
- Offline-ready with Service Worker (`sw.js`) and Web App Manifest (`manifest.json`).
- Full local persistence (`localStorage`) + JSON Data Backup Export & Import.

---

## 🌐 Deploy to GitHub Pages (Free Hosting & Mobile Install)

Hisaab is 100% static, uses relative paths, and comes pre-configured with `.nojekyll`, `404.html`, and an automated GitHub Actions deployment workflow.

### 1. Create a Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Name your repository (e.g. `hisaab` or `Splitwise`).
3. Choose **Public** (or Private if you have GitHub Pro/Enterprise).
4. Do **not** check "Initialize with README", then click **Create repository**.

### 2. Push Your Local Code
Run these commands from this directory in your terminal:

```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git
git branch -M main
git push -u origin main
```

### 3. Turn on GitHub Pages (Takes 10 Seconds)
1. Go to your GitHub repository on github.com.
2. Click **Settings** ➔ **Pages** (in the left sidebar).
3. Under **Build and deployment** ➔ **Source**:
   - Choose **GitHub Actions** (recommended — uses the included automated workflow), **OR**
   - Choose **Deploy from a branch** ➔ select `main` branch ➔ folder `/ (root)` ➔ click **Save**.
4. In about 30 seconds, your PWA will be live at:
   ```
   https://<YOUR_GITHUB_USERNAME>.github.io/<YOUR_REPO_NAME>/
   ```
5. Open that link on your phone in Safari or Chrome, tap **"Add to Home Screen"**, and you have your app running anywhere, anytime!

---

## 🚀 Local Usage on Wi-Fi (Alternative)

### Step 1: Start the Local Server
From this project directory in your terminal, run:

```bash
python3 server.py
```

The terminal will display your machine's local Wi-Fi address, for example:
```
📱 ON YOUR PHONE (Same Wi-Fi network):
   👉 Open: http://192.168.1.15:8080

💻 ON THIS MAC:
   👉 Open: http://localhost:8080
```

### Step 2: Open & Install on Your Phone
Make sure your phone is connected to the same Wi-Fi network as your Mac.

#### 🍏 On iPhone / iOS (Safari):
1. Open Safari and go to the URL shown in your terminal (e.g., `http://192.168.1.15:8080`).
2. Tap the **Share** button (the square with an arrow pointing up at the bottom).
3. Scroll down and tap **"Add to Home Screen"**.
4. Hisaab will now appear on your home screen with its custom app icon and launch full-screen like a native iOS app!

#### 🤖 On Android (Chrome):
1. Open Google Chrome and navigate to the local URL.
2. Tap the three dots menu (**⋮**) in the top right corner.
3. Tap **"Install app"** or **"Add to Home screen"**.

---

## ⚙️ Configuration & Customization

Under the **Settings** tab in the app:
- **Flatmate Names**: Change names (e.g., "Shivam" & "Rahul"). All buttons, split calculations, and copy exports will update to use the configured names.
- **Currency**: Switch between `₹`, `$`, `€`, `£`, etc.
- **Static Monthly Templates**: Customize your monthly recurring templates, change their estimated amounts, or add new ones (e.g., Water Cans, Netflix, Newspaper, Cleaner, etc.).
- **Data Backup**: Export a JSON file of your expenses anytime, or restore from a previous backup.
