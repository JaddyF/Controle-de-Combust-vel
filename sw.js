const CACHE_NAME = 'fuel-tracker-v3'; // Aumente a versão do cache para forçar a atualização
const urlsToCache = [
    './', // A raiz da aplicação (o index.html)
    './index.html', // O arquivo HTML principal
    './manifest.json', // O arquivo manifest.json (caminho relativo)
    './sw.js', // O próprio service worker
    'https://cdn.tailwindcss.com', // Tailwind CSS CDN
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' // Fonte Inter
    // Adicione aqui outros recursos estáticos que você queira cachear, como imagens de ícones
];

// Evento 'install': Cacheia os recursos estáticos quando o service worker é instalado
self.addEventListener('install', (event) => {
    console.log('Service Worker: Instalando e cacheando recursos...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache aberto:', CACHE_NAME);
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
                        console.log('Requisição de rede falhou para:', event.request.url);
                        // Para um fallback offline, você precisaria de uma página offline.html no cache
                        // return caches.match('/offline.html');
                    });
            })
    );
});

// Evento 'activate': Limpa caches antigos e ativa o service worker imediatamente
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Ativando e limpando caches antigos...');
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
    // Garante que o service worker seja ativado imediatamente após a instalação
    event.waitUntil(self.clients.claim());
});
