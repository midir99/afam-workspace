const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({ window: {} });
for (const file of ['tree-data.js', 'tree-layout.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
}
const data = context.window.FamilyTreeDemoData;
const build = context.window.FamilyTreeLayout.build;
const people = new Map(data.people.map(p => [p.id, p]));
let assertions = 0;
function check(condition, message) { assertions++; assert.ok(condition, message); }

function checkLayout(primary, ancestorDepth) {
  const scene = build(data, primary.id, {ancestorDepth});
  const nodes = scene.elements.filter(e => e.data.kind !== 'edge');
  const persons = nodes.filter(e => e.data.kind === 'person');
  const byId = new Map(nodes.map(n => [n.data.id, n]));
  const byPerson = id => persons.find(n => n.data.personId === id);
  const edges = scene.elements.filter(e => e.data.kind === 'edge');
  check(new Set(scene.elements.map(e => e.data.id)).size === scene.elements.length, 'IDs únicos');
  check(persons.filter(n => n.data.role === 'primary').length === 1, 'Una persona principal');
  check(byId.get(scene.primaryNodeId).position.x === 0, 'Persona principal alineada con la unión de sus padres');
  check(!nodes.some(n => n.data.kind === 'family' || n.data.kind === 'spacer'), 'Sin rectángulos de agrupación familiar');
  const cards = nodes.filter(n => n.data.kind === 'color-card');
  for (const card of cards) {
    const contents = persons.filter(n => n.data.parent === card.data.id);
    check(contents.length === 1 && contents[0].data.id === card.data.personNodeId, 'Cada contenedor tiene una sola persona');
    check(contents[0].data.level === card.data.level && contents[0].data.familyColor === card.data.familyColor, 'Contenedor y persona comparten nivel y color');
    check(!card.data.personId && !card.data.parent, 'El fondo es un contenedor visual independiente de los parentescos');
  }
  for (let i = 1; i < scene.levels.length; i++) check(scene.levels[i].top === scene.levels[i-1].bottom, 'Franjas consecutivas sin superposición');
  check(!scene.levels.some(l => l.text.includes('ambos padres')), 'Anotación de hermanos respeta el texto acordado');
  for (const node of persons) {
    check(Number.isFinite(node.position.x) && Number.isFinite(node.position.y), 'Coordenadas finitas');
    const level = scene.levels.find(l => l.id === node.data.level);
    const padding = node.data.parent ? 6 : 0;
    check(level && node.position.y - 36 - padding >= level.top && node.position.y + 90 + padding <= level.bottom, 'Persona y fondo dentro de su franja');
    if (node.data.parent) check(byId.get(node.data.parent).data.kind === 'color-card', 'Solo se permiten contenedores individuales de color');
    if (!node.data.generation) continue;
    check(node.data.generation <= ancestorDepth, 'Ascendencia limitada a la profundidad solicitada');
    check(node.data.ancestorSide === 'paternal' ? node.position.x < 0 : node.position.x > 0, 'Antepasados en el lado correcto');
    const parents = persons.filter(p => p.data.generation === node.data.generation + 1 &&
      p.data.ancestorSide === node.data.ancestorSide && (p.data.personId === node.data.fatherId || p.data.personId === node.data.motherId));
    if (parents.length === 2) {
      check(Math.abs(node.position.x - (parents[0].position.x + parents[1].position.x) / 2) < 0.001, 'Antepasado bajo el centro de sus progenitores');
      check(parents.find(p => p.data.personId === node.data.fatherId).position.x < parents.find(p => p.data.personId === node.data.motherId).position.x, 'Padre a la izquierda y madre a la derecha en cada rama ancestral');
    }
  }
  for (let i = 0; i < persons.length; i++) for (let j = i + 1; j < persons.length; j++) {
    const a = persons[i].position, b = persons[j].position;
    const extra = (persons[i].data.parent ? 6 : 0) + (persons[j].data.parent ? 6 : 0);
    check(Math.abs(a.x - b.x) >= 140 + extra || Math.abs(a.y - b.y) >= 126 + extra, 'Espacio suficiente entre personas, nombres y fondos');
  }
  for (const edge of edges) {
    check(byId.has(edge.data.source) && byId.has(edge.data.target), 'Extremos de conexiones válidos');
    if (!edge.classes.includes('arrow')) continue;
    const target = byId.get(edge.data.target);
    const child = people.get(target.data.personId);
    check(target.data.kind === 'person' && target.data.personId === edge.data.childId, 'Flecha hacia una persona hija');
    check(edge.data.parentIds.length && edge.data.parentIds.every(id => id === child.fatherId || id === child.motherId), 'Flechas solo de filiación biológica');
  }
  for (const node of persons.filter(n => n.data.role === 'partner' || n.data.role === 'parent-partner')) {
    check(!edges.some(e => e.data.target === node.data.id), 'Ninguna conexión desde la persona hacia sus parejas');
  }
  const central = persons.filter(n => n.data.role === 'primary' || n.data.role === 'sibling').sort((a,b) => a.position.x-b.position.x);
  check(central.every((n,i) => i === 0 || central[i-1].data.birthDate <= n.data.birthDate), 'Hermanos centrales por edad');
  for (const kind of ['paternal', 'maternal', 'descendant']) {
    const groups = scene.groups.filter(g => g.familyKind === kind);
    check(groups.every((g,i) => i === 0 || (groups[i-1].firstBirthDate <= g.firstBirthDate && groups[i-1].center > g.center)), 'Parejas de derecha a izquierda por primer hijo');
    for (const group of groups) {
      const children = group.childIds.map(byPerson);
      check(children.every((n,i) => i === 0 || children[i-1].position.x < n.position.x), 'Hijos de cada pareja de mayor a menor');
      if (kind === 'paternal') check(children.every(n => n.position.x < central[0].position.x), 'Medios hermanos paternos a la izquierda');
      if (kind === 'maternal') check(children.every(n => n.position.x > central[central.length-1].position.x), 'Medios hermanos maternos a la derecha');
    }
  }
  for (const child of persons.filter(n => n.data.role === 'child')) {
    const expected = data.people.filter(p => p.fatherId === child.data.personId || p.motherId === child.data.personId).sort((a,b) => a.birthDate.localeCompare(b.birthDate));
    const actual = expected.map(p => persons.find(n => n.data.personId === p.id && n.data.role === 'grandchild'));
    check(actual.every(n => n && n.position.x === child.position.x), 'Todos los nietos en la columna de su progenitor');
    check(actual.every((n,i) => i === 0 || actual[i-1].position.y < n.position.y), 'Nietos de mayor a menor de arriba abajo');
    for (const grandchild of actual) check(!edges.some(e => e.data.source === grandchild.data.id), 'Nietos sin formar cadenas generacionales');
  }
  const expectedColumns = persons.filter(n => n.data.role === 'grandchild').sort((a,b) => a.position.x-b.position.x || a.position.y-b.position.y)
    .filter(n => data.people.some(p => p.fatherId === n.data.personId || p.motherId === n.data.personId));
  const columns = scene.greatGrandchildGroups;
  assert.deepEqual(Array.from(columns,g=>g.progenitorNodeId),Array.from(expectedColumns,n=>n.data.id),'Columnas según la lectura visual de hijos y nietos');
  check(new Set(columns.map(g=>g.color)).size === columns.length, 'Color diferente por nieto con hijos');
  for (let i = 0; i < columns.length; i++) {
    const group = columns[i];
    const progenitor = byId.get(group.progenitorNodeId);
    const expected = data.people.filter(p=>p.fatherId===group.progenitorId || p.motherId===group.progenitorId).sort((a,b)=>a.birthDate.localeCompare(b.birthDate));
    assert.deepEqual(Array.from(group.childIds),Array.from(expected,p=>p.id),'Todos los hijos de cada nieto, de todas sus parejas');
    check(i === 0 || columns[i-1].x < group.x, 'Columnas de bisnietos de izquierda a derecha');
    check(progenitor.data.familyColor === group.color && progenitor.data.colorGroupId === progenitor.data.id, 'Nieto con hijos identificado por su color');
    group.childNodeIds.forEach((id,index)=>{
      const child = byId.get(id);
      check(child.data.role === 'great-grandchild' && child.position.x === group.x, 'Bisnieto dentro de la columna de su progenitor');
      check(child.data.familyColor === group.color && child.data.colorGroupId === progenitor.data.id, 'Bisnieto y progenitor comparten color');
      check(index === 0 || byId.get(group.childNodeIds[index-1]).position.y < child.position.y, 'Bisnietos por edad de arriba abajo');
      check(!edges.some(e=>e.data.source===id || e.data.target===id), 'Bisnietos relacionados mediante color, sin líneas');
    });
  }
  if (columns.length) check(columns[0].x + columns[columns.length-1].x === 0,'Conjunto de columnas de bisnietos centrado');
  for (const grandchild of persons.filter(n=>n.data.role==='grandchild')) {
    check(Boolean(grandchild.data.parent) === columns.some(g=>g.progenitorNodeId===grandchild.data.id),'Solo los nietos con hijos reciben fondo');
  }
  const children = persons.filter(n => n.data.role === 'child');
  if (!children.length) check(scene.levels[scene.levels.length-1].id === 'siblings', 'Sin hijos, termina en hermanos');
  const families = scene.groups.filter(g => g.familyKind === 'descendant');
  if (families.length === 1) check(families[0].center === 0, 'Una sola familia de descendencia centrada');
}
for (const primary of data.people) {
  for (const ancestorDepth of [2, 3]) checkLayout(primary, ancestorDepth);
}

const scene = build(data);
assert.equal(scene.stats.people, 54);
assert.equal(scene.stats.greatGrandparents, 8);
assert.equal(scene.stats.greatGrandchildren, 11);
assert.equal(scene.elements.filter(e=>e.data.kind==='color-card').length,17);
assert.equal(scene.levels.length, 8);
assert.deepEqual(Array.from(scene.levels, l => l.id), ['great-grandparents','grandparents','parents','siblings','partners','children','grandchildren','great-grandchildren']);
assert.deepEqual(Array.from(scene.greatGrandchildGroups,g=>g.progenitorId),['isabel','josefina','julian','jose','julieta','ramon']);
assert(!scene.elements.find(e=>e.data.personId==='enedina').data.parent);
assert(!scene.elements.find(e=>e.data.personId==='juan').data.parent);
const siblingLevel = scene.levels.find(l => l.id === 'siblings');
for (const text of [siblingLevel.text, siblingLevel.shortText]) {
  check(text.includes('centro') && text.includes('medios hermanos') && text.includes('paternos') && (text.includes('izquierda') || text.includes('izq.')) && text.includes('maternos') && (text.includes('derecha') || text.includes('der.')),
    'Las notas compactas conservan la posición de hermanos y medios hermanos');
}

const shallow = build(data, data.primaryId, {ancestorDepth:2});
assert.equal(shallow.stats.people, 46);
assert.equal(shallow.stats.greatGrandparents, 0);
assert.equal(shallow.levels.length, 7);
assert.deepEqual(Array.from(scene.greatGrandchildGroups,g=>g.color),Array.from(shallow.greatGrandchildGroups,g=>g.color),'Colores estables al cambiar ascendencia');
assert.equal(scene.elements.find(e => e.data.role === 'primary').position.y - shallow.elements.find(e => e.data.role === 'primary').position.y, 180);

for (const grandparent of scene.elements.filter(e => e.data.role === 'grandparent')) {
  const arrow = scene.elements.find(e => e.classes && e.classes.includes('arrow') && e.data.childId === grandparent.data.personId);
  assert(arrow, 'Cada abuelo recibe una flecha de sus progenitores');
  assert.deepEqual(Array.from(arrow.data.parentIds).sort(), [grandparent.data.fatherId, grandparent.data.motherId].sort());
}
const incomplete = build({...data, people:data.people.filter(p => p.id !== 'severo')});
assert.equal(incomplete.stats.greatGrandparents, 7);
assert(!incomplete.elements.some(e => e.data.personId === 'severo'), 'No se inventan personas para datos ausentes');
for (const ancestor of incomplete.elements.filter(e => e.data.generation)) {
  const original = scene.elements.find(e => e.data.personId === ancestor.data.personId && e.data.generation === ancestor.data.generation);
  assert.equal(ancestor.position.x, original.position.x, 'La ausencia de un progenitor conserva la posición de su rama');
}
const oneParentArrow = incomplete.elements.find(e => e.classes && e.classes.includes('arrow') && e.data.childId === 'urbano');
assert.deepEqual(Array.from(oneParentArrow.data.parentIds), ['carmen']);
const missingGrandparent = build({...data, people:data.people.filter(p => p.id !== 'urbano')});
assert.equal(missingGrandparent.stats.greatGrandparents, 6);
assert(!missingGrandparent.elements.some(e => ['severo','carmen'].includes(e.data.personId)), 'No se muestran ancestros sin una rama conocida que los conecte');
const juana = scene.elements.find(e => e.data.personId === 'juana');
for (const id of ['enedina', 'julieta', 'ramon']) {
  const grandchild = scene.elements.find(e => e.data.personId === id);
  check(grandchild.position.x === juana.position.x && grandchild.data.level === 'grandchildren', 'Nietos de diferentes uniones permanecen juntos');
}
const withoutGreatGrandchildren = build({...data,people:data.people.filter(p=>!scene.elements.some(e=>e.data.role==='great-grandchild' && e.data.personId===p.id))});
assert.equal(withoutGreatGrandchildren.stats.greatGrandchildren,0);
assert.equal(withoutGreatGrandchildren.levels[withoutGreatGrandchildren.levels.length-1].id,'grandchildren');
assert(!withoutGreatGrandchildren.elements.some(e=>e.data.kind==='color-card'));

// More than six progenitors must not silently reuse the initial palette.
const extended = {...data,people:[...data.people,{id:'extra-juan',name:'Ejemplo adicional',birthDate:'2030-01-01',fatherId:'juan'},
  {id:'extra-enedina',name:'Otro ejemplo',birthDate:'2026-01-01',motherId:'enedina'}]};
const extendedScene = build(extended);
assert.equal(extendedScene.greatGrandchildGroups.length,8);
assert.equal(new Set(extendedScene.greatGrandchildGroups.map(g=>g.color)).size,8);
console.log('Layout correcto: ' + assertions + ' comprobaciones, ' + data.people.length + ' personas como raíz a dos profundidades; ascendencia completa e incompleta.');
