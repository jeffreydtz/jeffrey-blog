# Investigación pública — 10 de septiembre de 2026

Perfil proporcionado por el usuario: https://www.goodreads.com/user/show/128723960-jeffrey

## Verificación

Consultas directas sin login, cookies de sesión personal ni claves API:

- https://www.goodreads.com/review/list_rss/128723960?shelf=read — HTTP 200, RSS válido, 62 libros.
- https://www.goodreads.com/review/list_rss/128723960?shelf=to-read — HTTP 200, RSS válido, 51 libros.
- https://www.goodreads.com/review/list_rss/128723960?shelf=currently-reading — HTTP 200, RSS válido, cero libros. No inventar un libro actualmente en lectura.
- La página HTML /review/list/128723960?shelf=read redirige al login; el RSS funciona públicamente. No hace falta iniciar sesión.

El RSS lleva channel/title, channel/link, lastBuildDate, ttl=60 e item. Campos de item: title, link (reseña personal), book_id, author_name, user_rating, user_shelves, user_review, user_read_at, user_date_added, book_image_url, book_medium_image_url, book_large_image_url. Varias etiquetas contienen CDATA. average_rating es la media comunitaria y debe ignorarse; user_rating=0 significa sin valoración. En read, user_shelves puede estar vacío: el estado se verifica por el RSS específico solicitado. Los comentarios son texto del usuario, sin corregir ortografía ni inventar interpretación; no renderizar HTML arbitrario del feed.

La página pública destaca cuatro libros bajo “favorite books”, pero enlaza al estante read: no extrapolar favoritos a todos los leídos. RSS da evidencia mejor para estantes y valoraciones personales. El footer lib/now.ts aún dice que lee El lobo estepario: conservar su contenido manual, aunque RSS ya lo marque leído.

## Snapshot propuesto

Cinco leídos recientes y dos pendientes; URLs de reseña copiadas tal cual del RSS. Para la actualización manual puede aplicarse la misma cantidad editorial e incorporar actualmente leyendo si deja de estar vacío.

```json
[
  {
    "id": "43517789",
    "title": "Indigno de ser humano",
    "author": "Osamu Dazai",
    "url": "https://www.goodreads.com/review/show/8926489676?utm_medium=api&utm_source=rss",
    "shelf": "read",
    "sourceUrl": "https://www.goodreads.com/review/list_rss/128723960?shelf=read",
    "rating": 4,
    "comment": "y uno piensa que la pasa mal. “Bebe, que el tiempo es un enemigo implacable y goce que el hoy es lo más tuyo”"
  },
  {
    "id": "56484219",
    "title": "El mito de Sísifo",
    "author": "Albert Camus",
    "url": "https://www.goodreads.com/review/show/8926469532?utm_medium=api&utm_source=rss",
    "shelf": "read",
    "sourceUrl": "https://www.goodreads.com/review/list_rss/128723960?shelf=read",
    "rating": 3,
    "comment": "“De todas esas glorias, la menos falaz es la que se vive”"
  },
  {
    "id": "2139323",
    "title": "El lobo estepario",
    "author": "Hermann Hesse",
    "url": "https://www.goodreads.com/review/show/8879104533?utm_medium=api&utm_source=rss",
    "shelf": "read",
    "sourceUrl": "https://www.goodreads.com/review/list_rss/128723960?shelf=read",
    "rating": 4,
    "comment": "Excelente como retrata al hombre tan personal y solitario, como a veces uno puede sentirse fuera de época por ser racional. gran libro para explorar la dualidad."
  },
  {
    "id": "61439040",
    "title": "1984",
    "author": "George Orwell",
    "url": "https://www.goodreads.com/review/show/8796630321?utm_medium=api&utm_source=rss",
    "shelf": "read",
    "sourceUrl": "https://www.goodreads.com/review/list_rss/128723960?shelf=read",
    "rating": 4,
    "comment": "Este libro es increíble como hace tanto tiempo escrito aún puede ser considerado contemporáneo, orwell entiende a la perfección esa idea de ser controlado y sometido por el sistema."
  },
  {
    "id": "59186",
    "title": "La metamorfosis",
    "author": "Franz Kafka",
    "url": "https://www.goodreads.com/review/show/8659757637?utm_medium=api&utm_source=rss",
    "shelf": "read",
    "sourceUrl": "https://www.goodreads.com/review/list_rss/128723960?shelf=read",
    "rating": 3,
    "comment": "👍"
  },
  {
    "id": "56420157",
    "title": "La biblioteca de la medianoche (Universo de la medianoche, #1)",
    "author": "Matt Haig",
    "url": "https://www.goodreads.com/review/show/8893365950?utm_medium=api&utm_source=rss",
    "shelf": "to-read",
    "sourceUrl": "https://www.goodreads.com/review/list_rss/128723960?shelf=to-read"
  },
  {
    "id": "231301304",
    "title": "Always Remember: The Boy, the Mole, the Fox, the Horse and the Storm",
    "author": "Charlie Mackesy",
    "url": "https://www.goodreads.com/review/show/8347735274?utm_medium=api&utm_source=rss",
    "shelf": "to-read",
    "sourceUrl": "https://www.goodreads.com/review/list_rss/128723960?shelf=to-read"
  }
]
```

## Límites y tratamiento de errores

Esta verificación prueba el RSS en la fecha indicada; el servicio puede cambiar, denegar acceso o devolver HTML. Aceptar solo RSS con estructura válida y datos verificables; limitar tiempo/tamaño, omitir campos opcionales ausentes y conservar snapshot en errores. No representar un RSS vacío como caída de red; distinguirlo de XML malformado o página de login. La actualización es un comando manual; ni builds ni visitas consultan Goodreads. Mantener el snapshot versionado para builds y primera respuesta reproducibles. No almacenar cookies, XML del perfil completo ni datos personales ajenos a los libros.

Las URLs de portada también están presentes en las copias temporales de RSS, pero no son necesarias para modelos 3D sobrios con lomos tipográficos. No inventar rutas a imágenes de portadas.

Música y canal YouTube se verifican en el flujo de implementación; este documento no afirma que un preview o video concreto funcione.
