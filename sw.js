const CACHE_NAME = 'mock-test-cache-v1';
// যে ফাইলগুলি অফলাইনে সেভ করে রাখতে হবে তার তালিকা
const urlsToCache = [
    '/',
    'index.html',
    'test_list.html',
    'quiz.html',
    'style.css',
    'quiz_script.js',
    
    // --- *** পরিবর্তন এখানে *** ---
    // 'icons/' ফোল্ডারের পাথ আবার যোগ করা হলো
    'icons/icon-192x192.png',
    'icons/icon-512x512.png',
    
    // --- *** পরিবর্তন এখানে *** ---
    // 'data/' ফোল্ডারের পাথ আবার যোগ করা হলো
    'data/wbp_math_percent_1.json',
    'data/wbp_gk_history_1.json',
    'data/gk_set_1.json'
];

// ১. অ্যাপ ইন্সটল করার সময় (Install event)
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache).catch(error => {
                    console.error('Failed to cache files:', error);
                });
            })
    );
});

// ২. কোনো ফাইল রিকোয়েস্ট হলে (Fetch event)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(
                    networkResponse => {
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return networkResponse;
                    }
                );
            }
        )
    );
});

// ৩. পুরনো ক্যাশ পরিষ্কার করা (Activate event)
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});