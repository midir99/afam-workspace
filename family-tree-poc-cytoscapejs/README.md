# Prueba de árbol genealógico con Cytoscape.js

Abre `index.html` en un navegador. Todos los recursos están incluidos en esta carpeta: no necesita instalación, compilación ni conexión a Internet.

Al abrir la página, la vista comienza al 100 % y centrada en la persona principal en todas las pantallas. Después puedes arrastrar el fondo para desplazarte y utilizar la rueda, el gesto de pinza o los controles para acercarte. «Ver todo» encuadra el árbol y «Centrar» vuelve a la persona principal al 100 %.

El selector «Ascendencia» permite mostrar hasta abuelos o bisabuelos, conservando el zoom y la posición de la persona principal en pantalla. La vista inicial incluye ocho bisabuelos de ejemplo.

La distribución sigue `../reglas-arbol-v2.md` y extiende `../farbol-v6.png` con bisabuelos: ocho franjas con divisorias horizontales discontinuas.

1. Bisabuelos: paternos a la izquierda y maternos a la derecha; cada pareja sobre su hijo o hija en la franja de abuelos.
2. Abuelos: paternos a la izquierda y maternos a la derecha; abuelo antes que abuela dentro de cada pareja.
3. Padres y sus respectivas parejas: padre y sus parejas a la izquierda; madre y sus parejas a la derecha.
4. Persona principal resaltada y hermanos al centro, por edad de izquierda a derecha; medios hermanos paternos a la izquierda y maternos a la derecha.
5. Parejas de la persona principal, alineadas sobre sus hijos.
6. Hijos de cada pareja, de mayor a menor de izquierda a derecha.
7. Nietos en la columna de su progenitor, de mayor a menor de arriba abajo, incluidos los de distintas uniones. Cada uno recibe su propia flecha desde el progenitor.
8. Bisnietos en una columna por cada nieto con hijos, de mayor a menor de arriba abajo. Las columnas recorren las ramas de los hijos de izquierda a derecha y los nietos de cada rama de arriba abajo. El color relaciona cada nieto con sus hijos, sin líneas entre estas dos franjas.

Las alturas se calculan a partir de la lista de niveles, con 180 píxeles por franja salvo las de nietos y bisnietos, que crecen según sus columnas. La franja de bisnietos empieza después de la altura completa de la de nietos. El ancho de la ascendencia se calcula antes de posicionarla: cada descendiente queda bajo el punto medio de sus progenitores, con el padre a la izquierda y la madre a la derecha. Si falta un dato, se reserva su posición y se muestran únicamente los antepasados conocidos. Las otras parejas de los padres y los medios hermanos se separan del grupo central según el ancho resultante.

Cada nieto con hijos y cada bisnieto tiene un contenedor compuesto individual de Cytoscape, de tipo `color-card`. Su fondo rectangular se ajusta al círculo y al nombre mediante `compound-sizing-wrt-labels: include`. Cada nieto con hijos comparte un color con todos sus hijos; los nietos sin hijos conservan el fondo normal y no generan columna. El conjunto de columnas de bisnietos se centra respecto de la persona principal. La paleta se amplía cuando hay más de seis grupos y conserva sus asignaciones al cambiar la ascendencia.

Los contenedores son elementos visuales: `data.parent` identifica el contenedor; `fatherId` y `motherId` describen el parentesco biológico. Personas, recuentos y conexiones se identifican mediante `kind: person`; las flechas apuntan a sus círculos. Los contenedores dejan pasar los gestos y «Ver todo» considera también su tamaño real.

Los grupos de cada lado y las parejas de la persona principal se ordenan por el nacimiento de su primer hijo común: los primeros a la derecha y los últimos a la izquierda. Las flechas representan únicamente descendencia biológica. No hay conexiones entre parejas; para los medios hermanos, el progenitor compartido se identifica por el lado y la anotación. Los padres se conectan con la persona principal y sus hermanos.

Las divisorias y las notas son capas SVG propias sincronizadas mediante la API pública de Cytoscape. Las notas permanecen en el margen derecho y dentro de la parte visible de su franja al hacer zoom o desplazarse. El texto se ajusta entre 14 y 22 píxeles; primero se compacta la tarjeta y después se usa una redacción breve que conserva las relaciones y los lados. Si solo queda una pequeña porción de la franja, su nota se oculta para evitar superposiciones. Las capas dejan pasar los gestos al árbol. Una exportación directa con `cy.png()` no incluye estas capas externas.

- `tree-data.js`: personas y relaciones de ejemplo; las fechas determinan el orden.
- `tree-layout.js`: calcula las franjas, las posiciones, las rutas de filiación y los grupos de color. `build(data, selectedId, { ancestorDepth: 2 | 3 })` selecciona la profundidad; por defecto es 3 (bisabuelos). `greatGrandchildGroups` describe las columnas de bisnietos y sus progenitores.
- `level-annotations.js`: divisorias, fondos y anotaciones SVG que acompañan el zoom y el desplazamiento.
- `app.js`: dibujo con Cytoscape.js, estilos del grafo y controles de acercamiento.
- `styles.css`: presentación de la página.
- `vendor/`: Cytoscape.js 3.34.4 y su licencia MIT.
- `tests/layout.test.cjs`: comprueba parentescos, orden, franjas, espacio entre personas y fondos, conexiones y colores tomando a cada persona de ejemplo como raíz a ambas profundidades; incluye ascendencia incompleta y ausencia de bisnietos. Ejecutar con `node tests/layout.test.cjs` desde esta carpeta.

La vista muestra solamente el árbol. Los nombres y vínculos son datos ilustrativos y no representan un registro genealógico verificado. Las fechas de los bisnietos incluyen ejemplos futuros para conservar edades coherentes con los progenitores del conjunto original. La selección de otra persona y el menú contextual quedan fuera de esta prueba de dibujo.
