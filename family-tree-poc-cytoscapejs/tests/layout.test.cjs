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

for (const primary of data.people) {
  const scene = build(data, primary.id);
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

const scene = build(data);
assert.equal(scene.stats.people, 35);
assert.equal(scene.levels.length, 6);
assert.deepEqual(Array.from(scene.levels, l => l.id), ['grandparents','parents','siblings','partners','children','grandchildren']);
for (const text of [scene.levels[2].text, scene.levels[2].shortText]) {
  check(text.includes('centro') && text.includes('medios hermanos') && text.includes('paternos') && text.includes('izquierda') && text.includes('maternos') && text.includes('derecha'),
    'Las notas compactas conservan la posición de hermanos y medios hermanos');
}
const juana = scene.elements.find(e => e.data.personId === 'juana');
for (const id of ['enedina', 'julieta', 'ramon']) {
  const grandchild = scene.elements.find(e => e.data.personId === id);
  check(grandchild.position.x === juana.position.x && grandchild.data.level === 'grandchildren', 'Nietos de diferentes uniones permanecen juntos');
}
console.log('Layout correcto: ' + assertions + ' comprobaciones, ' + data.people.length + ' personas como raíz.');
