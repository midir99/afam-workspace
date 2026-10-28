# Prueba de árbol genealógico con Cytoscape.js

Abre `index.html` en un navegador. Todos los recursos están incluidos en esta carpeta: no necesita instalación, compilación ni conexión a Internet.

Arrastra el fondo para desplazarte y utiliza la rueda, el gesto de pinza o los controles para acercarte. «Ver todo» encuadra el árbol y «Centrar» vuelve a la persona principal al 100 %. En pantallas pequeñas la vista comienza centrada en ella.

El selector «Ascendencia» permite mostrar hasta abuelos o bisabuelos, conservando el zoom y la posición de la persona principal en pantalla. La vista inicial incluye ocho bisabuelos de ejemplo.

La distribución extiende `../farbol-v5.png` con siete franjas y divisorias horizontales discontinuas:

1. Bisabuelos: paternos a la izquierda y maternos a la derecha; cada pareja sobre su hijo o hija en la franja de abuelos.
2. Abuelos: paternos a la izquierda y maternos a la derecha; abuelo antes que abuela dentro de cada pareja.
3. Padres y sus respectivas parejas: padre y sus parejas a la izquierda; madre y sus parejas a la derecha.
4. Persona principal resaltada y hermanos al centro, por edad de izquierda a derecha; medios hermanos paternos a la izquierda y maternos a la derecha.
5. Parejas de la persona principal, alineadas sobre sus hijos.
6. Hijos de cada pareja, de mayor a menor de izquierda a derecha.
7. Nietos en la columna de su progenitor, de mayor a menor de arriba abajo, incluidos los de distintas uniones. Cada uno recibe su propia flecha desde el progenitor.

Las alturas se calculan a partir de la lista de niveles, con 180 píxeles por franja salvo la de nietos, que crece según su cantidad. El ancho de la ascendencia se calcula antes de posicionarla: cada descendiente queda bajo el punto medio de sus progenitores, con el padre a la izquierda y la madre a la derecha. Si falta un dato, se reserva su posición y se muestran únicamente los antepasados conocidos. Las otras parejas de los padres y los medios hermanos se separan del grupo central según el ancho resultante.

Los grupos de cada lado y las parejas de la persona principal se ordenan por el nacimiento de su primer hijo común: los primeros a la derecha y los últimos a la izquierda. Las flechas representan únicamente descendencia biológica. No hay conexiones entre parejas; para los medios hermanos, el progenitor compartido se identifica por el lado y la anotación. Los padres se conectan con la persona principal y sus hermanos.

Las divisorias y las notas son capas SVG propias sincronizadas mediante la API pública de Cytoscape. Las notas permanecen en el margen derecho y dentro de la parte visible de su franja al hacer zoom o desplazarse. El texto se ajusta entre 14 y 22 píxeles; primero se compacta la tarjeta y después se usa una redacción breve que conserva las relaciones y los lados. Si solo queda una pequeña porción de la franja, su nota se oculta para evitar superposiciones. Las capas dejan pasar los gestos al árbol. Una exportación directa con `cy.png()` no incluye estas capas externas.

- `tree-data.js`: personas y relaciones de ejemplo; las fechas determinan el orden.
- `tree-layout.js`: calcula las franjas, las posiciones y las rutas de filiación. `build(data, selectedId, { ancestorDepth: 2 | 3 })` selecciona la profundidad; por defecto es 3 (bisabuelos).
- `level-annotations.js`: divisorias, fondos y anotaciones SVG que acompañan el zoom y el desplazamiento.
- `app.js`: dibujo con Cytoscape.js, estilos del grafo y controles de acercamiento.
- `styles.css`: presentación de la página.
- `vendor/`: Cytoscape.js 3.34.4 y su licencia MIT.
- `tests/layout.test.cjs`: comprueba parentescos, orden, franjas, espacio entre personas y conexiones tomando a cada persona de ejemplo como raíz a ambas profundidades; incluye ascendencia incompleta. Ejecutar con `node tests/layout.test.cjs` desde esta carpeta.

La vista muestra solamente el árbol. Los nombres y vínculos son datos ilustrativos y no representan un registro genealógico verificado. La selección de otra persona y el menú contextual quedan fuera de esta prueba de dibujo.
