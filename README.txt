Przypominajka v1006

Zmiany:
- automatyczna aktualizacja z GitHub Pages / serwera,
- nowy cache v1006 i usuwanie starszych cache,
- Service Worker używa network-first, aby telefon nie trzymał starej wersji,
- po wykryciu nowego Service Workera aplikacja automatycznie przełącza się na nową wersję i odświeża,
- pliki CSS/JS/manifest mają numer wersji w adresie, aby ominąć stary cache,
- widoczny numer wersji v1006.

Pliki do podmiany: index.html, app.js, sw.js, README.txt.
