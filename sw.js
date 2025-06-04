const CACHE_NAME = 'fuel-tracker-v1'; // Nome do cache para esta versão da aplicação
const urlsToCache = [
    '/', // A raiz da aplicação
    '/index.html', // O arquivo HTML principal
    'https://cdn.tailwindcss.com', // Tailwind CSS CDN
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' // Fonte Inter
    // Adicione aqui outros recursos estáticos que você queira cachear, como imagens de ícones
    // Ex: '/icon-192x192.png',
    // Ex: '/icon-512x512.png'
];

// Evento 'install': Cacheia os recursos estáticos quando o service worker é instalado
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache aberto');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Falha ao cachear recursos durante a instalação:', error);
            })
    );
});

// Evento 'fetch': Intercepta requisições de rede e serve recursos do cache, se disponíveis
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Se o recurso estiver no cache, retorne-o
                if (response) {
                    return response;
                }
                // Caso contrário, faça a requisição à rede
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Tenta cachear a resposta da rede para futuras requisições
                        return caches.open(CACHE_NAME).then((cache) => {
                            // Importante: clone a resposta, pois uma resposta de stream só pode ser consumida uma vez.
                            // Se a requisição não for GET ou for um recurso que não queremos cachear (ex: range requests),
                            // não o cacheamos.
                            if (networkResponse.ok && event.request.method === 'GET' && !event.request.url.includes('googletagmanager')) {
                                cache.put(event.request, networkResponse.clone());
                            }
                            return networkResponse;
                        });
                    })
                    .catch(() => {
                        // Se a requisição de rede falhar (ex: offline), você pode retornar uma página offline
                        // ou um fallback específico. Para este exemplo, apenas falhamos.
                        console.log('Requisição de rede falhou para:', event.request.url);
                        // Você pode adicionar um fallback para uma página offline aqui:
                        // return caches.match('/offline.html');
                    });
            })
    );
});

// Evento 'activate': Limpa caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deletando cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});