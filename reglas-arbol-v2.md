# Reglas de presentación del árbol genealógico — versión 2

Este documento reúne la distribución por franjas de `farbol-v5.png`, la incorporación de bisabuelos y la representación de bisnietos de `farbol-v6.png`. Las reglas describen el diseño acordado; la selección de otra persona todavía está pendiente de implementar en el POC. Las propuestas que requieren confirmación se reúnen al final.

## 1. Conceptos y reglas generales

- **Persona principal:** es la referencia para todos los parentescos, lados y anotaciones del árbol.
- **Distribución de la página:** buscador y ficha de la persona a la izquierda; árbol a la derecha, ocupando la mayor parte de la pantalla. La ficha puede incluir foto, nombre, fechas e historia.
- **Personas:** cada una se representa con un círculo y su nombre completo debajo. Se reserva espacio para que círculos, nombres y conexiones se distingan con claridad.
- **Años de vida:** se colocan en una línea debajo del nombre: `1999-2021` para una persona con nacimiento y fallecimiento registrados; `1999` para una persona viva con nacimiento registrado. Se conservan las fechas completas como datos y se muestran únicamente sus años.
- **Fechas incompletas:** si solo se conoce el nacimiento, se muestra ese año; si solo se conoce el fallecimiento, se usa `?-2021`; si faltan ambas fechas, se omite la línea. La falta de una fecha de fallecimiento no confirma el estado vital de una persona.
- **Etiqueta completa:** nombre y años comparten el estilo de una etiqueta nativa. Los fondos de color abarcan también los años; las alturas, separaciones y puntos de salida de las conexiones consideran todo el bloque de texto.
- **Parentescos:** la ascendencia y la descendencia representadas corresponden a vínculos de sangre. Se incluyen las relaciones procedentes de distintas parejas o matrimonios.
- **Parejas:** se utiliza este término para las relaciones con o sin matrimonio. Las agrupaciones aquí descritas se basan en los hijos en común.
- **Agrupación visual:** las familias se distinguen por su posición, separación y conexiones; se sustituyen los recuadros familiares de la primera versión por franjas horizontales.
- **Flechas:** se reservan exclusivamente para la filiación biológica y apuntan hacia el hijo o hija. Las líneas procedentes de ambos progenitores pueden confluir en una ruta común hacia sus hijos.
- **Relaciones de pareja:** la ubicación y las anotaciones las identifican; no se dibujan flechas ni enlaces directos desde una persona hacia sus parejas.
- **Colores de parentesco:** en la relación entre nietos y bisnietos, el fondo compartido identifica al progenitor y a sus hijos. Este uso se distingue del resaltado de la persona principal.

## 2. Niveles y anotaciones

### 2.1. Orden de los niveles

Cada nivel ocupa una franja propia en el eje vertical. El orden completo, de arriba abajo, es el siguiente. En las anotaciones, `[nombre]` se sustituye por el nombre de la persona principal usado en las leyendas, por ejemplo, «Jorge».

| Orden | Nivel | Anotación |
| --- | --- | --- |
| 1 | Bisabuelos | Bisabuelos de [nombre]: paternos a la izquierda; maternos a la derecha. |
| 2 | Abuelos | Abuelos de [nombre]: paternos a la izquierda; maternos a la derecha. |
| 3 | Padres y sus parejas | Padres de [nombre] y sus respectivas parejas: padre y sus parejas a la izquierda; madre y sus parejas a la derecha. |
| 4 | Persona principal, hermanos y medios hermanos | [nombre] y sus hermanos al centro; medios hermanos paternos a la izquierda y maternos a la derecha. |
| 5 | Parejas de la persona principal | Parejas de [nombre]. |
| 6 | Hijos | Hijos de [nombre]. |
| 7 | Nietos | Nietos de [nombre]. |
| 8 | Bisnietos | Bisnietos de [nombre]: el color los relaciona con su padre o madre. |

### 2.2. Franjas y divisorias

- Las franjas se separan mediante líneas horizontales discontinuas que abarcan el ancho visible del área del árbol.
- Las personas de cada fila comparten altura, salvo los nietos y bisnietos, que se distribuyen en columnas dentro de su propia franja.
- La altura de una franja se amplía cuando lo requieren sus columnas, manteniendo todos sus integrantes dentro del nivel correspondiente.
- La franja de parejas expresa una relación con la persona principal; su posición inferior no significa descendencia.

### 2.3. Presentación de las anotaciones

- Se colocan en el extremo derecho de cada franja, con un margen reservado para evitar cubrir personas y nombres.
- Todas usan consistentemente el nombre de la persona principal. En la anotación del grupo central se utiliza «hermanos»; no se añade «de ambos padres».
- Su posición vertical acompaña al árbol al hacer zoom o desplazarse; horizontalmente permanecen en el margen derecho visible.
- Si el inicio de una franja queda fuera de pantalla, su nota permanece dentro de la parte visible de esa franja.
- El texto mantiene un tamaño legible y se ajusta al espacio disponible. La tarjeta puede compactarse y la redacción abreviarse conservando el parentesco y las indicaciones de lado.
- Si la porción visible es demasiado pequeña para alojar la nota, esta se oculta para evitar superposiciones.
- Las divisorias y las anotaciones permiten interactuar con el árbol situado debajo.

## 3. Reglas de ascendencia

### 3.1. Bisabuelos

- Se sitúan en la franja superior, agrupados por el abuelo o abuela de quien son progenitores.
- Los de la rama del padre de la persona principal quedan a la izquierda; los de la rama de la madre, a la derecha.
- Dentro de cada pareja ancestral, el padre va a la izquierda y la madre a la derecha. Su hijo o hija queda debajo del punto medio entre ambos.
- Las conexiones de cada pareja confluyen y terminan con una flecha hacia el abuelo o abuela correspondiente.

### 3.2. Abuelos

- Los abuelos paternos se sitúan sobre el padre, a la izquierda; los maternos sobre la madre, a la derecha.
- Dentro de cada pareja, el abuelo va a la izquierda y la abuela a la derecha.
- Cada progenitor de la persona principal queda debajo del punto medio de sus respectivos padres, con las conexiones dirigidas hacia él o ella.

### 3.3. Padres y sus otras parejas

- El padre se sitúa a la izquierda y la madre a la derecha de la unión que conduce a la persona principal.
- Las otras parejas del padre se extienden hacia la izquierda; las otras parejas de la madre, hacia la derecha, dentro de la misma franja de padres.
- Cada otra pareja se coloca sobre el grupo de hijos que comparte con ese progenitor.
- Dentro de cada lado, estas familias se ordenan **de izquierda a derecha** según el nacimiento del primer hijo en común: el primer hijo más antiguo sitúa su grupo más a la izquierda de ese lado. La fecha de matrimonio no determina este orden.
- El ancho de las ramas ancestrales se calcula antes de colocar los nodos. Se da espacio a sus nombres y conexiones y se separan de ellas las otras parejas de los padres.

## 4. Persona principal, hermanos y medios hermanos

### 4.1. Persona principal

- Permanece debajo de la unión de sus padres y se distingue mediante un resaltado visual propio.
- Junto con sus hermanos forma el grupo central de esta franja.
- Su posición sirve de referencia para distribuir a sus hermanos y las familias laterales.

### 4.2. Hermanos del grupo central

- Comparten padre y madre con la persona principal.
- Todos, incluida la persona principal, se ordenan de mayor a menor de izquierda a derecha, independientemente de su sexo.
- Los mayores quedan a la izquierda de la persona principal y los menores a su derecha.
- Los padres se conectan mediante flechas con todos sus hijos de este grupo, incluida la persona principal.

### 4.3. Medios hermanos

- Comparten únicamente padre o madre con la persona principal. En el documento y la presentación se utiliza el término «medios hermanos».
- Los paternos van a la izquierda del grupo central y los maternos a la derecha. Esta separación tiene prioridad sobre la comparación de edades entre grupos.
- Se incluyen los hijos de todas las otras parejas de cada progenitor, agrupados por el otro padre o madre que comparten. La persona principal y sus hermanos del grupo central no se repiten en estas agrupaciones.
- Cada grupo queda debajo de la otra pareja del progenitor correspondiente y se ordena de mayor a menor de izquierda a derecha, independientemente del sexo.
- El orden entre grupos sigue el primer hijo en común de cada pareja, como se establece en 3.3.
- Cada otra pareja se conecta mediante flechas con sus hijos. El progenitor compartido con la persona principal se identifica por el lado del árbol y la anotación; no se añaden conexiones largas desde ese progenitor hacia los grupos laterales.

## 5. Reglas de descendencia

### 5.1. Parejas de la persona principal

- Ocupan la franja inmediatamente inferior a la persona principal; cada pareja queda centrada sobre los hijos que tuvo con ella.
- Las familias se ordenan **de izquierda a derecha** según la fecha de nacimiento del primer hijo en común. La pareja cuyo primer hijo nació antes queda más a la izquierda y las posteriores hacia la derecha.
- La persona principal no se conecta con sus parejas. La anotación de la franja identifica esa relación.
- Cada pareja se conecta mediante flechas con los hijos de sangre que comparte con la persona principal.

### 5.2. Hijos

- Se muestran únicamente los hijos de sangre de la persona principal, agrupados por la pareja con la que los tuvo.
- Dentro de cada grupo se colocan horizontalmente de mayor a menor, con el mayor a la izquierda, independientemente del sexo.
- Debajo de cada hijo o hija se reserva la columna de sus propios hijos, que son los nietos de la persona principal.

### 5.3. Nietos

- Debajo de cada hijo o hija se colocan todos sus hijos de sangre, aunque provengan de distintas parejas o matrimonios.
- Ocupan una columna alineada con su progenitor y se ordenan de mayor a menor, con el mayor arriba.
- Los integrantes de una columna son hermanos o medios hermanos; sus diferentes alturas no representan generaciones sucesivas.
- Una ruta lateral parte del progenitor y se ramifica con una flecha hacia cada nieto. Los nietos no se conectan unos con otros como si fueran progenitor e hijo.

### 5.4. Bisnietos

- Ocupan una franja debajo de los nietos. Cada nieto con hijos genera una columna propia, que incluye todos sus hijos de sangre, de todas sus parejas.
- **Orden de las columnas:** se recorren las ramas de los hijos de la persona principal de izquierda a derecha. Dentro de cada rama, se recorren los nietos de arriba abajo, del mayor al menor; sus columnas de hijos se colocan siguiendo ese orden, de izquierda a derecha.
- Se conserva primero el orden de las ramas familiares; no se hace una ordenación global por edad entre nietos de distintas ramas.
- Los nietos sin hijos conservan el fondo normal y no generan una columna ni un espacio reservado en la franja de bisnietos.
- Cada nieto con hijos recibe un color de fondo diferente dentro de la vista; todos sus hijos reciben ese mismo color. El fondo se coloca detrás del círculo, del nombre y de los años.
- Los fondos se representan mediante contenedores compuestos individuales de Cytoscape, ajustados al círculo, al nombre y a los años de cada persona.
- La relación entre un nieto y sus hijos se identifica mediante ese color compartido, sin líneas ni flechas entre estas dos franjas.
- Las columnas se distribuyen consecutivamente según el orden anterior; el color permite reconocer al progenitor aunque su columna de hijos no coincida con su posición horizontal.
- Dentro de cada columna, los bisnietos se ordenan de mayor a menor, con el mayor arriba.

**Ejemplos de lectura de `farbol-v6.png`:**

- En la rama de Fernanda, Josefina es mayor que Julián: la columna de Mauricio, hijo de Josefina, queda a la izquierda de la de Fabricio, hijo de Julián.
- En la rama de Juana, Enedina es la mayor y no tiene hijos: conserva el fondo normal y no genera columna. Después aparece la columna de María Milagros, hija de Julieta, y más a la derecha la de los hijos de Ramón, el menor.

## 6. Vista inicial y navegación

### 6.1. Vista y controles

- Al abrir la página, el zoom comienza al **100 %** y el nodo principal queda centrado horizontal y verticalmente en el área de dibujo, excluyendo la ficha y el margen de anotaciones.
- Esta configuración se aplica una sola vez al entrar. Después, el usuario puede ajustar libremente el zoom y el desplazamiento sin que la vista se restablezca sola.
- **Centrar:** devuelve el nodo principal al centro del área de dibujo y establece el zoom al 100 %.
- **Ver todo:** ajusta el encuadre para mostrar el árbol completo.
- **Ascendencia:** permite alternar entre mostrar hasta abuelos o bisabuelos. El cambio conserva el zoom y la posición de la persona principal en pantalla; la vista inicial incluye la franja de bisabuelos.
- Al cambiar el tamaño de la ventana se conserva el zoom y el punto del árbol que se estaba observando.

### 6.2. Selección de otra persona — comportamiento previsto

- Al hacer clic sobre otra persona del árbol, esta pasa a ser la persona principal.
- Se actualiza su ficha a la izquierda y se sustituye el árbol por el correspondiente a esa persona.
- Los parentescos, lados, agrupaciones y nombres de las anotaciones se recalculan tomando a la nueva persona principal como referencia.

## 7. Casos particulares

- **Persona principal sin hijos:** el árbol termina en la franja de la persona principal, sus hermanos y medios hermanos. Se mantienen la ascendencia y las familias laterales de medios hermanos que correspondan.
- **Una sola pareja con hijos:** la pareja y su grupo de descendencia se centran debajo de la persona principal; se conserva la separación por franjas y la ausencia de un enlace directo entre la persona principal y su pareja.
- **Persona principal mayor o menor entre sus hermanos:** si es la mayor, sus hermanos del grupo central quedan a la derecha; si es la menor, a la izquierda. Las reglas de los medios hermanos se mantienen por lado.
- **Distintas uniones:** se incluyen todos los nietos o bisnietos que sean hijos de sangre del progenitor de su columna, aunque tengan otro padre o madre diferente.
- **Descendencia incompleta:** si hay hijos pero no nietos, el árbol termina en hijos; si hay nietos pero no bisnietos, termina en nietos.
- **Ascendencia incompleta:** se muestran únicamente los antepasados conocidos y se reserva la posición de los datos faltantes para mantener la estructura de las ramas. Un progenitor conocido conserva su conexión con su hijo o hija.

## 8. Propuestas pendientes de confirmación

Estas propuestas se distinguen de las reglas acordadas:

- **Etiquetas de apoyo para los colores:** añadir una leyenda breve como «Hijos de Julieta» a cada columna de bisnietos, como complemento del color compartido.
