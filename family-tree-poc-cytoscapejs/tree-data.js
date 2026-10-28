(function () {
  'use strict';

  // Datos de demostración: nombres y fechas ilustrativos, no un registro histórico.
  window.FamilyTreeDemoData = {
    primaryId: 'jorge',
    note: 'Ejemplo ficticio para probar la distribución; las fechas y relaciones no son datos históricos verificados.',
    people: [
      { id: 'urbano', name: 'Urbano Alarcón Bolívar', birthDate: '1908-03-18' },
      { id: 'esperanza', name: 'Esperanza Durán García', birthDate: '1912-08-09' },
      { id: 'porfirio-abuelo', name: 'Porfirio Álvarez Vázquez', birthDate: '1910-01-24' },
      { id: 'lucia-abuela', name: 'Lucía Santoyo Núñez', birthDate: '1915-06-12' },
      { id: 'jorge-padre', name: 'Jorge Alarcón Durán', birthDate: '1936-04-15', fatherId: 'urbano', motherId: 'esperanza' },
      { id: 'leticia', name: 'Leticia Álvarez Santoyo', birthDate: '1940-11-20', fatherId: 'porfirio-abuelo', motherId: 'lucia-abuela' },
      { id: 'mario-hermano', name: 'Mario Alarcón Álvarez', birthDate: '1959-02-17', fatherId: 'jorge-padre', motherId: 'leticia' },
      { id: 'jorge', name: 'Jorge Alarcón Álvarez', birthDate: '1962-07-10', fatherId: 'jorge-padre', motherId: 'leticia' },
      { id: 'lucia-hermana', name: 'Lucía Alarcón Álvarez', birthDate: '1966-09-03', fatherId: 'jorge-padre', motherId: 'leticia' },

      { id: 'teresa', name: 'Teresa Morales Vega', birthDate: '1935-05-28' },
      { id: 'andres', name: 'Andrés Alarcón Morales', birthDate: '1956-12-04', fatherId: 'jorge-padre', motherId: 'teresa' },
      { id: 'beatriz', name: 'Beatriz Alarcón Morales', birthDate: '1958-10-11', fatherId: 'jorge-padre', motherId: 'teresa' },
      { id: 'elena', name: 'Elena Cruz Ríos', birthDate: '1951-03-07' },
      { id: 'diego', name: 'Diego Alarcón Cruz', birthDate: '1976-08-22', fatherId: 'jorge-padre', motherId: 'elena' },
      { id: 'adriana', name: 'Adriana Alarcón Cruz', birthDate: '1980-01-13', fatherId: 'jorge-padre', motherId: 'elena' },

      { id: 'rafael', name: 'Rafael López Díaz', birthDate: '1938-09-14' },
      { id: 'ana', name: 'Ana López Álvarez', birthDate: '1957-12-01', fatherId: 'rafael', motherId: 'leticia' },
      { id: 'luis', name: 'Luis López Álvarez', birthDate: '1958-12-19', fatherId: 'rafael', motherId: 'leticia' },
      { id: 'manuel', name: 'Manuel Rojas Pérez', birthDate: '1946-02-05' },
      { id: 'rosa', name: 'Rosa Rojas Álvarez', birthDate: '1971-04-23', fatherId: 'manuel', motherId: 'leticia' },
      { id: 'hugo', name: 'Hugo Rojas Álvarez', birthDate: '1974-06-30', fatherId: 'manuel', motherId: 'leticia' },

      { id: 'frida', name: 'Frida Olmos Ortiz', birthDate: '1961-10-08' },
      { id: 'porfirio-hijo', name: 'Porfirio Alarcón Olmos', birthDate: '1982-05-26', fatherId: 'jorge', motherId: 'frida' },
      { id: 'juana', name: 'Juana Alarcón Olmos', birthDate: '1984-03-11', fatherId: 'jorge', motherId: 'frida' },
      { id: 'maria', name: 'María Bonilla Sape', birthDate: '1968-08-16' },
      { id: 'mario-hijo', name: 'Mario Alarcón Bonilla', birthDate: '1990-02-09', fatherId: 'jorge', motherId: 'maria' },
      { id: 'fernanda', name: 'Fernanda Alarcón Bonilla', birthDate: '1993-07-21', fatherId: 'jorge', motherId: 'maria' },

      { id: 'sofia', name: 'Sofía López Torres', birthDate: '1984-11-02' },
      { id: 'jose', name: 'José Alarcón López', birthDate: '2005-04-17', fatherId: 'porfirio-hijo', motherId: 'sofia' },
      { id: 'juan', name: 'Juan Alarcón López', birthDate: '2008-12-06', fatherId: 'porfirio-hijo', motherId: 'sofia' },
      { id: 'carlos', name: 'Carlos Acosta Rivas', birthDate: '1982-06-18' },
      { id: 'enedina', name: 'Enedina Acosta Alarcón', birthDate: '2004-09-25', fatherId: 'carlos', motherId: 'juana' },
      { id: 'julieta', name: 'Julieta Acosta Alarcón', birthDate: '2007-01-12', fatherId: 'carlos', motherId: 'juana' },
      { id: 'victor', name: 'Víctor Flores Nava', birthDate: '1980-08-04' },
      { id: 'ramon', name: 'Ramón Flores Alarcón', birthDate: '2012-05-19', fatherId: 'victor', motherId: 'juana' },
      { id: 'patricia', name: 'Patricia Mendoza Luna', birthDate: '1992-01-30' },
      { id: 'isabel', name: 'Isabel Alarcón Mendoza', birthDate: '2015-10-14', fatherId: 'mario-hijo', motherId: 'patricia' },
      { id: 'ernesto', name: 'Ernesto Zapata León', birthDate: '1991-04-05' },
      { id: 'josefina', name: 'Josefina Zapata Alarcón', birthDate: '2016-08-27', fatherId: 'ernesto', motherId: 'fernanda' },
      { id: 'pablo', name: 'Pablo Mendoza Sáenz', birthDate: '1990-12-23' },
      { id: 'julian', name: 'Julián Mendoza Alarcón', birthDate: '2020-02-08', fatherId: 'pablo', motherId: 'fernanda' }
    ]
  };
}());
