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
  check(!nodes.some(n => n.data.parent || n.data.kind === 'family' || n.data.kind === 'spacer'), 'Sin rectángulos familiares o guías como nodos');
  check(!scene.levels.some(l => l.text.includes('ambos padres')), 'Anotación de hermanos respeta el texto acordado');
  for (const node of persons) {
    check(Number.isFinite(node.position.x) && Number.isFinite(node.position.y), 'Coordenadas finitas');
    const level = scene.levels.find(l => l.id === node.data.level);
    check(level && node.position.y - 36 >= level.top && node.position.y + 90 <= level.bottom, 'Persona dentro de su franja');
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
    check(Math.abs(a.x - b.x) >= 140 || Math.abs(a.y - b.y) >= 126, 'Espacio suficiente entre personas y sus nombres');
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
  const children = persons.filter(n => n.data.role === 'child');
  if (!children.length) check(scene.levels[scene.levels.length-1].id === 'siblings', 'Sin hijos, termina en hermanos');
  const families = scene.groups.filter(g => g.familyKind === 'descendant');
  if (families.length === 1) check(families[0].center === 0, 'Una sola familia de descendencia centrada');
}
for (const primary of data.people) {
  for (const ancestorDepth of [2, 3]) checkLayout(primary, ancestorDepth);
}

const scene = build(data);
assert.equal(scene.stats.people, 43);
assert.equal(scene.stats.greatGrandparents, 8);
assert.equal(scene.levels.length, 7);
assert.deepEqual(Array.from(scene.levels, l => l.id), ['great-grandparents','grandparents','parents','siblings','partners','children','grandchildren']);
const siblingLevel = scene.levels.find(l => l.id === 'siblings');
for (const text of [siblingLevel.text, siblingLevel.shortText]) {
  check(text.includes('centro') && text.includes('medios hermanos') && text.includes('paternos') && text.includes('izquierda') && text.includes('maternos') && text.includes('derecha'),
    'Las notas compactas conservan la posición de hermanos y medios hermanos');
}

const shallow = build(data, data.primaryId, {ancestorDepth:2});
assert.equal(shallow.stats.people, 35);
assert.equal(shallow.stats.greatGrandparents, 0);
assert.equal(shallow.levels.length, 6);
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
console.log('Layout correcto: ' + assertions + ' comprobaciones, ' + data.people.length + ' personas como raíz a dos profundidades; ascendencia completa e incompleta.');
