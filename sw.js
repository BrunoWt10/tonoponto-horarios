const CACHE_NAME = 'tonoponto-cache-v1'; // Nome do seu cache. Altere a versão para forçar atualização.
const urlsToCache = [
  '/', // A raiz do seu site
  '/index.html',
  '/style.css', // Se você tiver um arquivo CSS separado
  '/script.js', // Se você tiver um arquivo JS separado
  '/manifest.json',
  '/icon-192x192.png', // Seus ícones
  '/icon-512x512.png'
  // Adicione aqui todos os outros arquivos que seu site usa (imagens, fontes, etc.)
];

// Evento 'install': Instala o Service Worker e coloca os arquivos no cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Força o novo Service Worker a ativar mais rapidamente
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
    }).then(() => self.clients.claim()) // Permite que o Service Worker controle a página imediatamente
  );
});

// Evento 'fetch': Intercepta requisições de rede
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Se o arquivo estiver no cache, retorna-o
        if (response) {
          return response;
        }
        // Se não estiver no cache, tenta buscar na rede
        return fetch(event.request).then(
          (response) => {
            // Verifica se recebemos uma resposta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona a resposta (pois a resposta é um stream e só pode ser consumida uma vez)
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache); // Adiciona a resposta ao cache
              });

            return response;
          }
        ).catch(() => {
            // Se a rede falhar e o arquivo não estiver em cache, pode-se retornar uma página offline customizada
            // Por enquanto, não faremos isso, mas é uma opção avançada.
            console.log('Falha ao buscar e não há cache para:', event.request.url);
        });
      })
  );
});