# Tecnologías y decisiones del proyecto

Proyecto: archivo histórico y genealógico de San Andrés de la Cal, Tepoztlán, Morelos, México.

Actualizado: 2026-11-18.

## Elecciones oficiales

| Tecnología | Responsabilidad | Criterio |
| --- | --- | --- |
| [PostgreSQL](https://www.postgresql.org/docs/current/) | Base de datos principal y fuente de verdad. | Guardar personas, filiaciones, parejas, historias y referencias a fuentes y archivos mediante un modelo relacional. Permite consultas recursivas para recorrer generaciones. |
| [Cloudflare R2](https://developers.cloudflare.com/r2/) | Almacenar medios y servir los archivos estáticos del sitio. | Conservar originales, versiones para la web y recursos del software fuera del VPS, con buckets y ciclos de vida separados para medios y estáticos. PostgreSQL guardará las claves y metadatos de los medios. |
| [Django](https://docs.djangoproject.com/en/stable/) | Framework del backend y renderizado de HTML con sus plantillas. | Modelos, ORM, migraciones, consultas, validación, formularios, autenticación y permisos; administración interna y vistas propias para el sitio público. |
| [Gunicorn](https://gunicorn.org/) | Servidor de aplicación que ejecutará Django dentro de su contenedor. | Madurez, configuración sencilla y supervisión de procesos de trabajo; opciones de procesos e hilos para ajustar concurrencia y memoria. |
| [WSGI](https://docs.djangoproject.com/en/stable/howto/deployment/wsgi/) | Interfaz estándar entre Gunicorn y la aplicación Django. | Modelo de peticiones y respuestas adecuado para búsqueda, fichas, edición y respuestas HTML utilizadas por HTMX. |
| [HTMX](https://htmx.org/docs/) | Actualizar fragmentos HTML de la interfaz pública y los formularios. | Buscador, resultados y ficha de persona coordinados con las respuestas de Django, conservando JavaScript propio para el árbol. |
| [Bulma](https://bulma.io/documentation/) | Base de estilos para la interfaz pública y los formularios propios. | Componentes y clases declarativas legibles para reducir el CSS que debemos escribir y mantener; se complementará con CSS propio para identidad visual y distribución específica. |
| [Cytoscape.js](https://js.cytoscape.org/) | Dibujo e interacción del árbol en el frontend. | Nodos de personas, etiquetas con nombre y años, conexiones de filiación, fondos de color, zoom y desplazamiento. Licencia MIT; no requiere un framework de interfaz específico. |
| [Caddy](https://caddyserver.com/docs/automatic-https) | Servidor web y proxy inverso HTTPS frente a Django. | Obtener y renovar certificados automáticamente, redirigir HTTP a HTTPS y reenviar solicitudes a la aplicación con una configuración pequeña, adecuada para un solo operador. |
| [Podman](https://docs.podman.io/en/stable/) | Construir y ejecutar los contenedores en modo rootless. | Una cuenta dedicada del VPS ejecutará aplicación, PostgreSQL y proxy sin privilegios de administrador del host, con imágenes versionadas y almacenamiento persistente separado. |
| [Quadlet + systemd](https://docs.podman.io/en/stable/markdown/podman-systemd.unit.5.html) | Definir y administrar los servicios de contenedores. | Archivos declarativos `.container`, `.network` y `.volume`; systemd gestionará arranque, dependencias, reinicios y registros mediante sus unidades de usuario. |
| [Ansible](https://docs.ansible.com/projects/ansible/latest/getting_started/introduction.html) | Aprovisionar los recursos de Vultr y configurar la VM. | Playbooks YAML para ambas tareas, adecuados para una sola persona operando un VPS; acceso mediante API y SSH, sin agente permanente en el servidor. |
| [Vultr](https://www.vultr.com/) | Proveedor del VPS Linux inicial. | Una sola máquina para aplicación y PostgreSQL, buscando un coste inicial bajo; medios y estáticos se entregarán desde R2. La contratación y el despliegue siguen pendientes. |

Django generará el HTML y HTMX actualizará los fragmentos correspondientes. JavaScript propio coordinará la ficha y los elementos de Cytoscape.js al cambiar la persona principal, conservando la instancia del dibujo. La integración cuidará su ciclo de vida cuando HTMX cambie contenido y al navegar con el historial del navegador.

El acomodo del árbol se calcula con código propio siguiendo [reglas-arbol-v2.md](reglas-arbol-v2.md); Cytoscape.js recibe las coordenadas mediante `preset`. Los fondos rectangulares son contenedores visuales individuales (*compound nodes*) para cada nieto con hijos y cada bisnieto. Un nieto y sus hijos comparten color; no hay flechas entre estas dos franjas. El contenedor visual no representa una filiación biológica.

La prueba local está en [family-tree-poc-cytoscapejs](family-tree-poc-cytoscapejs/index.html), con Cytoscape.js 3.34.4 incluido. Actualmente muestra el dibujo con datos ilustrativos; la conexión con datos persistentes y la navegación entre personas se implementarán posteriormente.

Las divisorias y anotaciones por niveles ya usan capas SVG propias sincronizadas con la API pública de Cytoscape.js, sin otra biblioteca. Las notas permanecen en el margen derecho y dentro de la parte visible de su franja al hacer zoom o desplazarse; el texto ajusta su tamaño y redacción para conservar legibilidad. Estas capas externas no se incluyen en una exportación directa con `cy.png()`. La investigación está en [cytoscape-level-annotations.md](cytoscape-level-annotations.md) y el comportamiento implementado, en el [README del POC](family-tree-poc-cytoscapejs/README.md).

## Estilos de la interfaz

**Bulma es la tecnología oficial de estilos.** Aportará botones, formularios, tarjetas, navegación y componentes comunes. Se usará una versión fijada de su CSS precompilado, publicada en R2 junto con los demás archivos estáticos del proyecto.

El CSS propio se concentrará en la identidad visual y la distribución particular del buscador, los resultados, la ficha y el área del árbol. Los componentes se reutilizarán mediante plantillas de Django para evitar repetir HTML. HTMX actualizará fragmentos que conservarán las clases de Bulma; las interacciones que lo requieran usarán HTML nativo o JavaScript propio.

Los nodos, etiquetas y conexiones del árbol se estilizarán mediante Cytoscape.js; Bulma cubrirá la interfaz que lo rodea. La elección de Bulma está confirmada y su integración sigue pendiente.

## Hechos y criterios para los datos

- Cada persona tiene un identificador estable y se registra una sola vez, aunque aparezca en diferentes ramas o vistas.
- Se guardan los vínculos directos entre progenitores e hijos. Abuelos, hermanos, medios hermanos y nietos se deducen de esos vínculos.
- Una pareja con hijos en común no implica que haya existido matrimonio. Los hijos deben quedar vinculados a sus progenitores correspondientes.
- La genealogía puede tener antepasados compartidos entre ramas; su almacenamiento debe admitir esa estructura de grafo mediante relaciones entre registros.
- Los niveles visibles del árbol no limitan las generaciones que podemos guardar. PostgreSQL ofrece [consultas recursivas](https://www.postgresql.org/docs/current/queries-with.html) para explorar ascendencia y descendencia.
- Cada consulta de persona recuperará el subárbol visible: bisabuelos, abuelos, padres y sus parejas, hermanos y medios hermanos, parejas propias, hijos, nietos y bisnietos. PostgreSQL sigue siendo la elección para esta consulta acotada a tres generaciones en cada dirección, además de las relaciones laterales.
- Se consultarán personas y vínculos por conjuntos, con índices para recorrer las filiaciones en ambos sentidos, evitando una consulta por familiar y un único `JOIN` que multiplique todas las ramas. Se usarán consultas por generación o recursivas según convenga, junto con `select_related` y `prefetch_related` del ORM de Django cuando correspondan.
- El árbol recibirá datos ligeros de personas, relaciones y referencias a fotografías; las historias completas se cargarán para la ficha seleccionada. El rendimiento se comprobará con árboles representativos y `EXPLAIN ANALYZE` en el VPS elegido, sin presuponer una capacidad por el número de usuarios registrados.
- El modelo debe admitir progenitores desconocidos, fechas incompletas o aproximadas y fuentes que respalden los datos y testimonios.
- Las coordenadas y los rectángulos se calculan para la persona principal seleccionada; no son hechos genealógicos persistidos.
- Al pulsar otra persona, su ficha y el árbol deben actualizarse de forma coherente para mostrarla como principal. El clic derecho podrá abrir opciones contextuales.

## Almacenamiento de medios con Cloudflare R2

**Cloudflare R2 es la elección oficial para almacenar las fotos y los documentos del proyecto.** Los originales y las versiones optimizadas para fichas y nodos se guardarán como objetos en R2. PostgreSQL conservará sus claves y metadatos: persona o historia relacionada, descripción, procedencia y estado de publicación.

La integración prevista con Django usa su API de almacenamiento y el backend S3 de `django-storages`, basado en `boto3`, con el endpoint y las credenciales de R2. Las credenciales se suministrarán fuera del repositorio. [Integración de django-storages con R2](https://django-storages.readthedocs.io/en/latest/backends/s3_compatible/cloudflare-r2.html).

La organización prevista separa originales y documentos privados de las versiones publicadas. Los archivos públicos podrán entregarse directamente desde R2 mediante un dominio de medios configurado en Cloudflare; el navegador no tendrá que descargarlos a través del VPS. Los originales privados se accederán mediante autorización de la aplicación y enlaces temporales. El dominio y la configuración de buckets quedan pendientes. [Acceso público](https://developers.cloudflare.com/r2/buckets/public-buckets/), [enlaces temporales](https://developers.cloudflare.com/r2/api/s3/presigned-urls/).

El VPS no mantendrá una copia permanente del conjunto de medios ni un volumen local dedicado al archivo histórico. Las subidas y el procesamiento de imágenes pueden usar memoria y archivos temporales: se limitarán tamaños y concurrencia y se limpiarán esos temporales al terminar o fallar una tarea. Para archivos grandes se podrá evaluar la subida directa a R2 mediante enlaces firmados, con validación antes de publicarlos. [Subidas en Django](https://docs.djangoproject.com/en/stable/topics/http/file-uploads/).

R2 como almacenamiento principal no sustituye el respaldo del archivo. La copia con historial y retención de los objetos se diseñará por separado, sin descargar el archivo completo al disco del VPS. La integración y los respaldos de medios siguen pendientes de implementación.

## Archivos estáticos con Cloudflare R2

**R2 es también la elección oficial para servir los estáticos del sitio:** Bulma, HTMX, Cytoscape.js, CSS y JavaScript propios, fuentes, iconos y demás recursos del software. Se usará un bucket público de estáticos separado de los buckets de medios, con permisos, publicación y limpieza independientes.

La distribución prevista usa dominios propios, pendientes de configurar:

| Dirección de ejemplo | Contenido | Servicio |
| --- | --- | --- |
| `san-andres-tenextitla.mx` | Páginas y respuestas de Django/HTMX. | Caddy y Gunicorn en el VPS. |
| `static.san-andres-tenextitla.mx` | Recursos estáticos de la aplicación. | R2 mediante Cloudflare. |
| `media.san-andres-tenextitla.mx` | Fotografías y documentos publicados. | R2 mediante Cloudflare. |

Django configurará por separado los almacenamientos `default` para medios y `staticfiles` para estáticos en `STORAGES`, mediante backends compatibles con S3 y R2. La publicación de estáticos se automatizará como parte de cada despliegue. [Despliegue de estáticos de Django](https://docs.djangoproject.com/en/stable/howto/static-files/deployment/).

1. Ejecutar `collectstatic` con soporte de manifiesto y nombres que incluyan un hash del contenido, conservando el manifiesto correspondiente a la versión de la aplicación.
2. Publicar los recursos en R2 antes de activar la nueva versión de Django. Las plantillas resolverán sus URLs mediante el sistema de estáticos de Django.
3. Configurar caché prolongada para los recursos con hash: un cambio de contenido generará una URL distinta. Conservar temporalmente los estáticos de versiones anteriores para atender páginas ya abiertas y permitir volver a una versión previa.

La entrega pública y la caché usarán el dominio propio configurado en Cloudflare. Los recursos podrán seguir formando parte del código o las imágenes de la aplicación; servirlos desde R2 reduce las descargas atendidas por el VPS, pero no elimina todas sus copias locales de construcción. La configuración de buckets, manifiestos, caché y automatización sigue pendiente de implementación. [Acceso público y caché de R2](https://developers.cloudflare.com/r2/buckets/public-buckets/), [manifiestos de Django](https://docs.djangoproject.com/en/stable/ref/contrib/staticfiles/#manifeststaticfilesstorage).

## Interfaces editorial y pública

La separación acordada es entre dos interfaces de una misma aplicación, bajo un mismo dominio. No requiere dos proyectos, dos bases de datos ni dos servidores.

**Wagtail sigue en evaluación como CMS sobre Django** para editar historias, imágenes y documentos, con borradores, revisiones y aprobación configurables. Personas y parentescos usarán modelos relacionales propios, enlazados con las historias; el árbol de páginas del CMS no representa genealogía. Los detalles de esta opción editorial están en la [comparación de backend](backend-options.md#complemento-editorial-posible-wagtail).

| Ruta de ejemplo | Público | Responsabilidad |
| --- | --- | --- |
| `san-andres-tenextitla.mx/administration/` | Editores con cuenta y permisos. | Capturar datos, redactar historias, agregar imágenes y documentos, guardar borradores, revisar y publicar. Si se adopta Wagtail, aquí se montaría su panel editorial. |
| `san-andres-tenextitla.mx/people/` | Visitantes. | Buscar personas y consultar la cuadrícula de resultados. |
| `san-andres-tenextitla.mx/people/jorge-alarcon-alvarez/` | Visitantes. | Consultar la ficha, historias publicadas y árbol de la persona; navegar seleccionando otros familiares. |

El acceso editorial se controla con autenticación y permisos; la ruta no sustituye esos controles. Ambas interfaces comparten los mismos registros de PostgreSQL. La publicación determina qué contenido se muestra al público. Wagtail también puede generar las páginas públicas de las historias mediante plantillas; Django, HTMX y Cytoscape coordinarán buscador, ficha y árbol.

Wagtail permite [configurar la ruta de su administrador e integrarlo en Django](https://docs.wagtail.org/en/stable/getting_started/integrating_into_django.html). Su administrador y el de Django son interfaces distintas que pueden convivir. Esta organización define el diseño esperado; el backend y sus rutas todavía no están implementados.

## Despliegue en un solo VPS

Se acuerda usar **un VPS Linux de Vultr con Podman rootless y Quadlet**, alojando aplicación y PostgreSQL; fotos, documentos y la entrega de estáticos usarán Cloudflare R2. El escenario inicial es de hasta unos 50 usuarios, probablemente con poca concurrencia. La referencia inicial de **1 vCPU, 2 GB de RAM y 55 GB SSD** se validará con carga real y procesamiento de imágenes.

El disco alojará sistema, imágenes de contenedores, base, registros, certificados y temporales de subidas, procesamiento y respaldos, con límites y limpieza para cuidar su capacidad. El operador asumirá el mantenimiento del sistema, PostgreSQL, actualizaciones y comprobación de respaldos. Los tamaños y costes de referencia se detallan más adelante.

### Aprovisionamiento y configuración con Ansible

**Ansible es la elección oficial para ambas tareas.** Se ejecutará desde la computadora del operador, manteniendo un solo proyecto de automatización para el único VPS. Los playbooks y las plantillas se versionarán en el repositorio; las credenciales de la API, llaves privadas y secretos se suministrarán fuera de él.

La organización prevista permite ejecutar estas tareas por separado:

| Playbook previsto | Responsabilidad |
| --- | --- |
| `provision.yml` | Administrar mediante la [colección `vultr.cloud`](https://docs.ansible.com/projects/ansible/latest/collections/vultr/cloud/index.html) la llave SSH pública, el firewall de Vultr y el VPS: región, plan, imagen de Linux y respaldo de la instancia. Obtener su IP e incorporarla al inventario para la configuración posterior. |
| `configure.yml` | Conectarse por SSH, instalar los paquetes necesarios y Podman, preparar la cuenta rootless y sus rangos de UID/GID, habilitar lingering, distribuir los Quadlets y configurar servicios, permisos, registros y tareas de respaldo. |

Ansible usará elevación de privilegios para los cambios del sistema que la requieran; los contenedores seguirán ejecutándose como el usuario dedicado sin privilegios de administrador. Las tareas comprobarán el estado existente y aplicarán los cambios necesarios, usando módulos adecuados para poder repetir la configuración sin duplicar recursos.

El acceso inicial seguirá este flujo:

1. Crear el VPS con una imagen que admita nuestra llave SSH y esperar a que termine su preparación inicial y permita conectarse.
2. Comprobar que exista una versión de Python compatible con Ansible; si falta, instalarla mediante [`ansible.builtin.raw`](https://docs.ansible.com/projects/ansible/latest/collections/ansible/builtin/raw_module.html), que puede ejecutar comandos por SSH sin Python en la VM.
3. Ejecutar la configuración de Linux, Podman y Quadlet. Las ejecuciones posteriores de `configure.yml` permitirán mantener la VM sin repetir el aprovisionamiento.

**No se requiere una configuración propia de cloud-init para el despliegue inicial.** La imagen de Vultr puede utilizarlo internamente para preparar red y acceso SSH; aprovecharemos esa preparación predeterminada. Solo se añadiría configuración personalizada si la imagen elegida necesita ajustes previos a la conexión de Ansible.

La automatización está decidida; la implementación de los playbooks y su ejecución sobre infraestructura real siguen pendientes.

### Servicios y operación

| Servicio | Uso previsto | Estado |
| --- | --- | --- |
| Proxy HTTPS | Caddy recibirá visitas en los puertos públicos 80/443, gestionará los certificados y su renovación y dirigirá las solicitudes a la aplicación. | Caddy confirmado, en un contenedor de Podman administrado por Quadlet. |
| Aplicación | Gunicorn ejecutará Django mediante WSGI dentro del mismo contenedor. Wagtail, si se elige, formará parte de esta misma aplicación. | Django, Gunicorn y WSGI confirmados; Wagtail en evaluación. |
| PostgreSQL | Guardar personas, vínculos, historias y referencias a archivos. Solo accesible desde la red de contenedores de Podman, sin publicar su puerto en el host. | Base de datos y ejecución con Podman + Quadlet acordadas. |

- Una cuenta dedicada ejecutará Podman rootless. Los Quadlets se instalarán en `~/.config/containers/systemd/`; la red se definirá con un archivo `.network` y cada servicio con su propio `.container`.
- El arranque al encender el VPS se declarará con `[Install] WantedBy=default.target`. Se habilitará lingering para esa cuenta mediante `loginctl enable-linger NOMBRE_DEL_USUARIO`, de modo que su gestor de servicios funcione sin una sesión abierta.
- Las unidades usarán `[Service] Restart=on-failure` y `RestartSec=5s`. Los cambios de Quadlet se aplicarán con `systemctl --user daemon-reload` y el reinicio del servicio afectado; sus registros se consultarán con `journalctl --user -u NOMBRE.service`.
- Las dependencias de arranque se declararán con `Wants` y `After`. PostgreSQL tendrá healthcheck y `Notify=healthy` para comunicar su disponibilidad inicial; la aplicación deberá gestionar reconexiones durante la operación.
- La publicación de los puertos web 80/443 se configurará expresamente para el despliegue rootless. Se usará un sistema Linux con systemd y cgroup v2, compatible con los Quadlets elegidos.
- El código y sus dependencias irán en imágenes versionadas. Se controlarán las versiones, evitando `latest`; un cambio de versión mayor de PostgreSQL requerirá una actualización planificada de los datos.
- PostgreSQL y el estado de certificados de Caddy tendrán volúmenes persistentes separados. Los medios y los estáticos publicados residirán en R2; se controlará el espacio local ocupado por temporales, imágenes de contenedores, registros y exportaciones de la base.
- Las credenciales se suministrarán fuera del repositorio. La aplicación tendrá su propio usuario de base de datos; se ajustarán procesos, consumo de memoria y rotación de logs al tamaño del VPS.

### Proxy HTTPS con Caddy

**Caddy es la elección oficial para el acceso web público.** Se ejecutará como otro contenedor rootless, definido en `san-andres-proxy.container` y conectado a la misma red de Podman que Django. Un `Caddyfile` versionado definirá el dominio y el destino `reverse_proxy app:8000`; Ansible distribuirá la configuración y los Quadlets.

El visitante se conectará por HTTPS a Caddy, que reenviará las peticiones por HTTP dentro de la red de contenedores a Gunicorn. Este ejecutará Django mediante WSGI. Django reconocerá el HTTPS original mediante las cabeceras establecidas por el proxy; el puerto de Gunicorn y el de PostgreSQL no se publicarán en el host.

Para publicar el servicio rootless, el esquema previsto es que Ansible configure el firewall y el reenvío de los puertos públicos **80 → 8080** y **443 → 8443**. Podman publicará `8080:80` y `8443:443`, de modo que Caddy reciba el tráfico en sus puertos habituales dentro del contenedor y los visitantes utilicen las direcciones web estándar.

Caddy obtendrá y renovará los certificados del dominio y redirigirá HTTP a HTTPS. Esto requiere que el DNS apunte al VPS, que los puertos públicos lleguen a Caddy y que su almacenamiento sea escribible y persistente. La automatización está integrada en Caddy, sin una herramienta adicional de certificados para este esquema. [HTTPS automático](https://caddyserver.com/docs/automatic-https).

El archivo `san-andres-caddy-data.volume` declarará el volumen `san_andres_caddy_data`, montado en `/data`, para conservar certificados, claves y estado entre recreaciones del contenedor. El `Caddyfile` se montará en `/etc/caddy/Caddyfile` en modo de solo lectura. Su estado sensible se incluirá en los respaldos cifrados necesarios para recuperar el despliegue.

El Quadlet incorporará `ReloadCmd` para aplicar cambios del `Caddyfile` con `systemctl --user reload san-andres-proxy.service`; los registros se consultarán con `journalctl --user -u san-andres-proxy.service`. La elección está confirmada; esta configuración HTTPS de producción sigue pendiente de implementación.

### Servidor de aplicación: Gunicorn y WSGI

**Gunicorn y WSGI son elecciones oficiales.** Gunicorn se ejecutará en primer plano dentro del contenedor de Django, definido por `san-andres-app.container`, y atenderá HTTP en el puerto interno 8000. Cargará el punto de entrada WSGI del proyecto, como `config.wsgi:application`; WSGI es la interfaz con Django, no un servicio adicional.

Gunicorn supervisará sus procesos de trabajo; systemd, mediante Quadlet, supervisará el servicio del contenedor. Para el alcance actual, las peticiones HTTP convencionales cubren buscador, fichas, edición y actualizaciones de HTMX.

La configuración inicial propuesta para medir en el VPS pequeño combina el worker `gthread` con dos procesos y dos hilos por proceso:

```bash
gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --worker-class gthread \
    --workers 2 \
    --threads 2 \
    --access-logfile - \
    --error-logfile -
```

El módulo WSGI se ajustará al nombre real del proyecto. Los procesos e hilos son un punto de partida para validar con carga y consumo de memoria, compartida con PostgreSQL; no representan el número de usuarios. Los registros irán a la salida del contenedor y se consultarán mediante journald. La implementación del backend y su despliegue siguen pendientes.

### Persistencia de PostgreSQL

Se usará un **volumen nombrado de Podman**, con nombre estable `san_andres_pgdata`, declarado mediante `san-andres-pgdata.volume`:

```ini
[Volume]
VolumeName=san_andres_pgdata
```

El Quadlet `san-andres-db.container` lo referenciará para que systemd asegure la existencia del volumen antes de iniciar PostgreSQL. Fragmento de referencia para la imagen oficial de PostgreSQL 18:

```ini
[Container]
Image=docker.io/library/postgres:18
EnvironmentFile=%h/.config/san-andres/postgres.env
Volume=san-andres-pgdata.volume:/var/lib/postgresql

[Service]
Restart=on-failure
RestartSec=5s
TimeoutStartSec=300

[Install]
WantedBy=default.target
```

El archivo `postgres.env` contendrá las variables de inicialización y credenciales, fuera del repositorio. Estos fragmentos documentan la persistencia; el servicio completo incorporará también red y healthcheck. Los [ejemplos de Podman y Quadlet](container-comparison/podman-w-quadlet/quadlet/) ilustran esa organización; son material de comparación, todavía sin desplegar.

En la [imagen oficial de PostgreSQL](https://hub.docker.com/_/postgres), desde la versión 18 se monta `/var/lib/postgresql`; las versiones 17 y anteriores usan por defecto `/var/lib/postgresql/data`. El ejemplo fija la versión mayor 18; al desplegar se registrará la versión concreta utilizada.

Al reiniciar, actualizar o recrear el contenedor con una versión compatible y el mismo volumen, la base se conserva. La inicialización de la imagen solo se ejecuta cuando el directorio de datos está vacío.

Detener o recrear el servicio no elimina el volumen nombrado. Los datos pertenecen al almacenamiento de Podman de la cuenta de despliegue y siguen en el disco del VPS: borrar el volumen manualmente o perder ese disco puede destruirlos. El volumen no sustituye los respaldos. Las referencias de la base apuntarán a fotos y documentos almacenados en R2.

### Respaldos y recuperación

Se mantendrán dos capas: respaldo de la máquina en Vultr y **copias con historial y retención de la base, la configuración y los medios fuera del VPS y de Vultr**. R2 está confirmado para medios y estáticos; Restic y un repositorio en R2 Standard siguen como propuesta para los respaldos de base y configuración. La herramienta y el destino de la copia histórica de los objetos de medios quedan por definir.

#### Recuperación de la máquina

Activar el respaldo automático diario de Vultr. Según su [guía oficial](https://docs.vultr.com/vps-automatic-backups), consultada en la investigación del 2026-10-26, conserva dos copias en el mismo centro de datos y sobre almacenamiento separado. Permite recuperar el servidor completo; no incluye volúmenes Block Storage adjuntos ni los objetos de R2. Se captura con la máquina encendida, por lo que se complementará con respaldos específicos de PostgreSQL y medios.

#### Recuperación de datos y archivos fuera de Vultr

Procedimiento diario propuesto para la instalación inicial:

1. Exportar PostgreSQL con `pg_dump -Fc`, un formato comprimido restaurable con `pg_restore`, y conservar los roles globales con `pg_dumpall --globals-only`. La exportación de la base es consistente aunque haya actividad concurrente. [Respaldo lógico](https://www.postgresql.org/docs/current/backup-dump.html), [roles globales](https://www.postgresql.org/docs/current/app-pg-dumpall.html).
2. Conservar la configuración de recuperación cifrada, incluido el estado sensible de Caddy, y referencias a las versiones del código, dependencias e imágenes. Respaldar también originales y demás objetos de medios en R2; un respaldo de PostgreSQL no los incluye.
3. Coordinar la captura de base y objetos en una ventana sin cambios editoriales. La consistencia de PostgreSQL no sincroniza por sí sola R2; el procedimiento debe contemplar altas, sustituciones y borrados de objetos.
4. Mantener los respaldos separados de los datos activos, con credenciales y retención propias. Para base y configuración siguen propuestos [Restic](https://restic.net/) y un repositorio cifrado en R2 Standard. El procedimiento para medios evitará descargar el archivo completo al disco del VPS; Restic no se presupone como lector directo de los buckets. Conservar las credenciales y contraseñas de recuperación fuera del servidor.
5. Retención inicial propuesta: **14 copias diarias, 8 semanales y 12 mensuales**, con limpieza periódica y aviso si falla una tarea de respaldo.
6. Probar una restauración mensual en un entorno separado, recuperando base y medios y abriendo una ficha con sus fotos y documentos. Registrar versiones compatibles y el tiempo real de recuperación.

Una copia diaria permite recuperar hasta el último respaldo correcto, con una pérdida potencial de aproximadamente 24 horas de cambios si las tareas se completan según lo previsto. Un objetivo de menor pérdida requiere otra frecuencia o una estrategia de recuperación a un instante concreto. PostgreSQL distingue [exportaciones, respaldos físicos y archivado continuo](https://www.postgresql.org/docs/current/backup.html); se revisará la estrategia si cambian el volumen de datos o las exigencias de recuperación.

La aplicación y PostgreSQL comparten recursos y fallos en una sola máquina. Los respaldos permiten recuperar el servicio, pero no ofrecen alta disponibilidad inmediata. La contratación, el despliegue y la configuración de respaldos siguen pendientes.

### Presupuesto de referencia

**Importes consultados el 2026-10-26**, en USD, para la instalación inicial. Se comprobarán de nuevo al contratar; no son una medición de capacidad ni un presupuesto cerrado de la arquitectura actual.

#### VPS y respaldo de Vultr

Planes Regular Performance (`vc2`), con precios recurrentes sin promociones, obtenidos de la [API oficial de planes](https://api.vultr.com/v2/plans?type=vc2&per_page=100):

| Plan | vCPU | RAM | SSD | VPS/mes | Respaldo automático (+20%) | Subtotal/mes |
| --- | --- | --- | --- | --- | --- | --- |
| `vc2-1c-1gb` | 1 | 1 GB | 25 GB | US$5 | US$1 | US$6 |
| `vc2-1c-2gb` | 1 | 2 GB | 55 GB | US$10 | US$2 | **US$12** |
| `vc2-2c-4gb` | 2 | 4 GB | 80 GB | US$20 | US$4 | US$24 |

El recargo de respaldo procede de la [tarifa oficial](https://docs.vultr.com/support/platform/billing/how-much-does-it-cost-to-enable-automatic-backups). Los tres planes incluían `mex` en el catálogo consultado; la [API de regiones](https://api.vultr.com/v2/regions?per_page=100) identifica esa ubicación como Ciudad de México. El catálogo no garantiza capacidad inmediata; el precio y la disponibilidad se comprobarán para la región seleccionada.

Valoración inicial: 1 GB sería una opción ajustada para pruebas; 2 GB es el inicio económico propuesto; 4 GB aporta margen para procesamiento de imágenes, importaciones y concurrencia. No son requisitos oficiales ni garantías de rendimiento de Django o Wagtail.

Los subtotales excluyen R2, otras copias externas, impuestos, dominio, exceso de transferencia y servicios adicionales. La facturación del VPS es por horas con un máximo mensual según sus condiciones; [detenerlo no elimina su facturación](https://docs.vultr.com/support/platform/billing/how-am-i-billed-for-my-servers).

#### Almacenamiento y operaciones de R2

En la consulta, R2 Standard incluía mensualmente **10 GB-mes**, un millón de operaciones A y diez millones B gratuitos; después, el almacenamiento costaba **US$0.015/GB-mes** y las operaciones que excedieran las cuotas se cobraban aparte. La salida de datos no tenía cargo en R2. Estas condiciones corresponden a Standard. [Precios oficiales](https://developers.cloudflare.com/r2/pricing/).

Al presupuestar se sumarán originales, versiones optimizadas, estáticos de las versiones retenidas y cualquier repositorio de respaldos alojado en R2, junto con sus operaciones. El destino de la copia histórica de medios puede añadir un coste separado.

Ejemplos con los precios consultados, suponiendo que las cuotas gratuitas están disponibles, las operaciones permanecen dentro de ellas y el volumen se conserva durante el mes:

| Volumen total almacenado en R2 Standard | R2/mes | VPS de 2 GB + respaldo Vultr + R2 |
| --- | --- | --- |
| Hasta 10 GB | US$0 | US$12 |
| 50 GB | US$0.60 | US$12.60 |
| 100 GB | US$1.35 | US$13.35 |

La estimación inicial de **US$12–15/mes antes de impuestos y dominio** contemplaba un repositorio pequeño de respaldos de hasta aproximadamente 100 GB, contando todas sus versiones retenidas. Para la arquitectura actual debe incluirse también el archivo activo de medios, los estáticos y la estrategia de copia que se adopte. Los redondeos, operaciones y crecimiento pueden modificar la factura.

## Neo4j: posibilidad remota para investigación

[Neo4j](https://neo4j.com/docs/cypher-manual/current/patterns/) queda documentado únicamente como una alternativa futura para investigaciones de parentesco: antepasados comunes, caminos entre personas o patrones familiares de profundidad desconocida.

No forma parte de la arquitectura inicial ni sustituye a PostgreSQL como fuente de verdad. Su incorporación solo se evaluaría ante necesidades concretas de investigación y mediciones con consultas y datos representativos; no se presupone una ventaja de rendimiento.
