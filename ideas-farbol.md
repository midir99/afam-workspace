Me gustaria que se pudiesen crear distintos arboles familiares

En ese caso, por ejemplo, si una persona desea crear su arbol, puede hacerlo, y en el sitio existirian diferentes arboles

En nuestro caso, al arbol familiar le llamaremos arbol

Quiza para modelar esto podriamos utilizar una tabla llamada arbol, que tenga informacion del arbol y de su autor, por ejemplo

Arbol
------
id
nombre
descripcion
usuario_id

Usuario
-------
id
nombre
apellido

Y cada persona que registremos tendria su propio usuario, dicha persona podria ver los otros arboles de las otras personas

Un arbol no estaria limitado a una persona, la persona le podria poner "El Arbol de San Andres", y ahi documentaria a toda la gente que conoce de san andres y sus relaciones familiares

Para modelar a las personas del arbol, se me ocurre que podriamos hacer algo como lo siguiente

Persona
-------
id
nombre
apellido
arbol_id

Con ese arbol_id podriamos mapear que persona pertenece a que arbol

Este proyecto no pienso hacerlo tan estricto para verificar que tal persona es hija de tal, si algun usuario desea ser riguroso con su arbol el podria serlo, y su arbol se volveria popular en el sitio por ser riguroso

Pienso en que este proyecto sea como la historia, multiples fuentes, algunas coinciden, otras no

Imaginate que algun dia el municipio toma el proyecto y crea su propio arbol, con la rigurosidad que ellos quieran

Que opinas de estas ideas?


Otra idea que tengo es que haya usuario que ayuden al creador del arbol a editarlo, y que estos usuarios tengan permisos, por ejemplo

Yo usuario Jorge creo el arbol y soy el administrador, tengo todos los permisos
Lucia es una editora, ella tiene permisos de modificar el arbol, ella puede borrar, crear, etc

Quiza debido a esto debamos usar una relacion diferente, quizas una tabla intermedia entre el arbol y los usuarios, por ejemplo

EditoresArbol
-------------
usuario_id
arbol_id
rol (owner, editor, reader, etc)