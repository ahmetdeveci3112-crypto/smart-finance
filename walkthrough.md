# Smart Finance PWA Walkthrough

I have successfully built your Personal Finance Web Application. It is production-ready, scalable, and includes all the requested features.

## Features Implemented

### 1. Authentication & Security
- **Google Sign-In**: Integrated via Firebase Auth.
- **Demo Mode**: Test the app without API keys using simulated data and AI responses.
- **Protected Routes**: Users must be logged in to access the dashboard.
- **Data Isolation**: Each user has their own sub-collection `users/{uid}/transactions`.

### 2. Dashboard & Analytics
- **Real-time Updates**: Uses Firestore `onSnapshot` to update the UI instantly when data changes.
- **Financial Overview**: Calculates Total Balance, Income, and Expenses dynamically.
- **Interactive Charts**:
    - **Pie Chart**: Visualizes expenses by category.
    - **Bar Chart**: Compares monthly income vs expenses.
- **Transaction Management**: Add, view, and delete transactions.
- **Filtering/Sorting**: Transactions are sorted by date (newest first).

### 3. Özellikler ve Kullanım
- **Giriş (Login):** Google ile giriş yapın veya "Demo Modu"nu seçerek giriş yapmadan deneyin.
- **Genel Bakış (Dashboard):**
  - **Özet Kartları:** Toplam bakiye, gelir ve giderlerinizi anlık görün.
  - **Grafikler:** Harcamalarınızın kategori dağılımını ve gelir-gider dengesini inceleyin.
  - **İşlem Listesi:** Son işlemlerinizi takip edin, fiş görseli olanları görüntüleyin.
- **İşlem Ekleme:**
  - **Fiş Tarama:** "Fiş Tara" butonu ile fişinizin fotoğrafını çekin/yükleyin. Yapay zeka otomatik olarak bilgileri doldurur.
  - **Manuel Giriş:** Başlık, tutar, tarih ve kategori bilgilerini elle girin.
  - **Özel Kategori:** Listede olmayan bir kategori için "Özel Kategori Ekle" seçeneğini kullanın.
  - **Fiş Yükleme:** İşleme fiş görseli ekleyerek daha sonra detaylardan görüntüleyin.
- **Karanlık Mod (Dark Mode):** Cihazınızın temasına göre otomatik olarak koyu veya açık modda çalışır.

### 4. Demo Modu
Demo modu, Firebase bağlantısı olmadan uygulamanın özelliklerini test etmenizi sağlar.
- **Veri:** Tarayıcı hafızasında (in-memory) tutulur, sayfa yenilenince sıfırlanır.
- **Yapay Zeka:** Gerçek AI yerine simüle edilmiş yanıtlar verir (örneğin, her fiş "Starbucks" olarak okunur).
- **Görsel Yükleme:** Yüklenen görseller geçici olarak görüntülenir.

### 5. AI Integration (Gemini)
- **Receipt Scanner**: Upload a receipt image, and Gemini Vision extracts the Merchant, Amount, Date, and Category automatically.
- *Note: AI Chat has been removed to focus on visual analytics.*

### 6. UI/UX
- **Dark Mode**: Automatically adapts to your system's light/dark theme preference.
- **Modern Design**: "Apple-esque" aesthetic with Zinc/Indigo colors, rounded corners, and clean typography.
- **Animations**: Smooth transitions using Framer Motion.
- **Responsive**: Fully mobile-first design using Tailwind CSS.

## How to Run

1.  **Configure Environment Variables**:
    - Rename `.env.example` to `.env`.
    - Fill in your **Firebase Config** and **Gemini API Key**.
    ```bash
    cp .env.example .env
    # Edit .env with your keys
    ```

2.  **Start Development Server**:
    ```bash
    npm run dev
    ```

3.  **Build for Production**:
    ```bash
    npm run build
    ```

## Project Structure
- `src/lib/firebase.js`: Firebase configuration and exports.
- `src/lib/gemini.js`: Gemini AI integration logic.
- `src/context/AuthContext.jsx`: Global authentication state.
- `src/components/`: Reusable UI components (Dashboard, Forms, Chat).

## Next Steps
- Add more charts/graphs for visual analytics.
- Implement budget goals.
- Add PWA manifest for installability on mobile devices.
