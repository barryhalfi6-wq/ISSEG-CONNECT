const CACHE_NAME = "isseg-connect-v3";

const APP_FILES = [
"./",
"./index.html",
"./manifest.json",
"./Css/style.css",
"./Js/app.js",
"./Assets/icons/isseg-logo.png"
];

// INSTALLATION
self.addEventListener("install", (event) => {
event.waitUntil(
caches.open(CACHE_NAME)
.then(async (cache) => {
for (const file of APP_FILES) {
try {
await cache.add(file);
} catch (error) {
console.warn("Fichier non mis en cache :", file);
}
}
})
.then(() => self.skipWaiting())
);
});

// ACTIVATION
self.addEventListener("activate", (event) => {
event.waitUntil(
caches.keys().then((names) =>
Promise.all(
names
.filter((name) =>
name.startsWith("isseg-connect-") &&
name !== CACHE_NAME
)
.map((name) => caches.delete(name))
)
).then(() => self.clients.claim())
);
});

// REQUÊTES
self.addEventListener("fetch", (event) => {
if (event.request.method !== "GET") return;

const url = new URL(event.request.url);

if (url.origin !== self.location.origin) return;

event.respondWith(
    fetch(event.request)
        .then((response) => {
            if (response.ok) {
                const copy = response.clone();
                caches.open(CACHE_NAME)
                    .then((cache) => cache.put(event.request, copy));
            }
            return response;
        })
        .catch(async () => {
            const cached = await caches.match(event.request);

            if (cached) return cached;

            if (event.request.mode === "navigate") {
                return caches.match("./index.html");
            }

            return new Response("Ressource indisponible hors connexion.", {
                status: 503
            });
        })
);

});