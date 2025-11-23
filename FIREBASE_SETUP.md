# Firebase Kurulum ve Ayar Kılavuzu

Uygulamanızın "Kaydet" aşamasında takılı kalmasının en muhtemel sebebi **Firebase Storage** (Dosya Depolama) servisinin etkinleştirilmemiş olması veya yazma izinlerinin kapalı olmasıdır.

Lütfen aşağıdaki adımları Firebase Console üzerinde uygulayın:

## 1. Firebase Storage'ı Etkinleştirin
1. [Firebase Console](https://console.firebase.google.com/) adresine gidin.
2. Projenizi seçin.
3. Sol menüden **Build** > **Storage** seçeneğine tıklayın.
4. **"Get Started"** (Başlayın) butonuna tıklayın.
5. **"Start in production mode"** (Üretim modunda başlat) seçeneğini seçin ve ilerleyin.
6. Cloud Storage konumunu (Location) seçin (örneğin `eur3` veya size en yakın olan) ve **Done** deyin.

## 2. Storage Kurallarını Güncelleyin (ÖNEMLİ)
Storage sekmesindeyken **Rules** (Kurallar) sekmesine geçin ve şu kuralları yapıştırıp **Publish** (Yayınla) deyin:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
*Bu kural, sadece giriş yapmış kullanıcıların dosya yüklemesine izin verir.*

## 3. Firestore Database Kurallarını Kontrol Edin
Sol menüden **Build** > **Firestore Database** > **Rules** sekmesine gidin. Şu şekilde olduğundan emin olun:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 4. CORS Ayarları (Opsiyonel ama Önerilir)
Eğer hala sorun yaşıyorsanız, tarayıcı konsolunda "CORS" hatası görüyor olabilirsiniz. Bu durumda Google Cloud Console üzerinden CORS ayarı yapılması gerekebilir, ancak genellikle yukarıdaki adımlar yeterlidir.

## 5. .env Dosyası Kontrolü
`.env` dosyanızda `VITE_FIREBASE_STORAGE_BUCKET` değişkeninin dolu olduğundan emin olun. Bu değer Firebase Console > Project Settings > General kısmında `storageBucket` olarak yazar (örn: `proje-id.firebasestorage.app`).
