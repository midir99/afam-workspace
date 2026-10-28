(function () {
  "use strict";

  const C = {
    pitch: 155, groupGap: 80, personHalfWidth: 70,
    grandparentY: 85, parentY: 265, primaryY: 445,
    partnerY: 625, childY: 805, grandchildY: 985, grandchildPitch: 140
  };

  function labelFor(name) {
    const lines = [""];
    String(name).split(/\s+/).forEach(function (word) {
      const last = lines.length - 1;
      if (lines[last] && (lines[last] + " " + word).length > 18) lines.push(word);
      else lines[last] += (lines[last] ? " " : "") + word;
    });
    return lines.join("\n");
  }

  function byAge(a, b) {
    return String(a.birthDate || "9999").localeCompare(String(b.birthDate || "9999")) || a.id.localeCompare(b.id);
  }

  function build(data, selectedId) {
    const people = new Map(data.people.map(function (person) { return [person.id, person]; }));
    const primary = people.get(selectedId || data.primaryId);
    if (!primary) throw new Error("No existe la persona principal.");
    const elements = [], groups = [];
    const occurrences = new Map(), nodes = new Map(), childrenIndex = new Map();
    const bounds = { x1: Infinity, y1: 0, x2: -Infinity, y2: 1080 };
    let sequence = 0;

    data.people.forEach(function (person) {
      new Set([person.fatherId, person.motherId].filter(Boolean)).forEach(function (parentId) {
        if (!childrenIndex.has(parentId)) childrenIndex.set(parentId, []);
        childrenIndex.get(parentId).push(person);
      });
    });
    childrenIndex.forEach(function (children) { children.sort(byAge); });

    function include(x, y, person) {
      const radius = person ? C.personHalfWidth : 1;
      bounds.x1 = Math.min(bounds.x1, x - radius);
      bounds.x2 = Math.max(bounds.x2, x + radius);
      bounds.y1 = Math.min(bounds.y1, y - (person ? 36 : 1));
      bounds.y2 = Math.max(bounds.y2, y + (person ? 90 : 1));
    }

    function addPerson(person, x, y, role, level, relation, familyId) {
      if (!person) return null;
      const count = occurrences.get(person.id) || 0;
      occurrences.set(person.id, count + 1);
      const id = person.id + (count ? "--occurrence-" + count : "");
      const label = labelFor(person.name);
      const node = {
        data: {
          id: id, personId: person.id, kind: "person", name: person.name, label: label,
          initials: person.name.split(/\s+/).slice(0, 2).map(function (word) { return word[0]; }).join(""),
          role: role, level: level, relation: relation, birthDate: person.birthDate,
          fatherId: person.fatherId, motherId: person.motherId, familyId: familyId || "",
          sourceOffset: Math.max(80, 26 + 10 + label.split("\n").length * 18.75 + 8)
        },
        position: { x: x, y: y }
      };
      elements.push(node);
      nodes.set(id, node);
      include(x, y, true);
      return id;
    }

    function junction(x, y) {
      const id = "__junction-" + (++sequence);
      elements.push({ data: { id: id, kind: "junction" }, position: { x: x, y: y } });
      include(x, y, false);
      return id;
    }

    function edge(source, target, arrow, parentIds, childId, style) {
      if (!source || !target || source === target) return;
      const item = {
        data: { id: "__edge-" + (++sequence), kind: "edge", source: source, target: target,
          parentIds: parentIds || [], childId: childId || null },
        classes: "lineage" + (arrow ? " arrow" : "")
      };
      if (style) item.style = style;
      elements.push(item);
    }

    // Shared route for biological parents and children, never a connection between partners.
    function connectFamily(parentNodes, childNodes, busY, parentIds) {
      const knownParents = parentNodes.filter(Boolean);
      if (!knownParents.length || !childNodes.length) return;
      const xs = Array.from(new Set(knownParents.concat(childNodes).map(function (id) {
        return nodes.get(id).position.x;
      }))).sort(function (a, b) { return a - b; });
      const bus = new Map(xs.map(function (x) { return [x, junction(x, busY)]; }));
      xs.forEach(function (x, index) {
        if (index) edge(bus.get(xs[index - 1]), bus.get(x), false, parentIds);
      });
      knownParents.forEach(function (id) {
        const node = nodes.get(id);
        edge(id, bus.get(node.position.x), false, parentIds, null,
          { "source-endpoint": "0 " + node.data.sourceOffset });
      });
      childNodes.forEach(function (id) {
        const node = nodes.get(id);
        edge(bus.get(node.position.x), id, true, parentIds, node.data.personId);
      });
    }

    function childrenOf(personId) { return childrenIndex.get(personId) || []; }

    function familiesOf(personId, excludedPeople) {
      const families = new Map();
      childrenOf(personId).forEach(function (child) {
        if (excludedPeople && excludedPeople.has(child.id)) return;
        const partnerId = child.fatherId === personId ? child.motherId : child.fatherId;
        const key = partnerId || "__unknown";
        if (!families.has(key)) families.set(key, { partnerId: partnerId, partner: people.get(partnerId), children: [] });
        families.get(key).children.push(child);
      });
      return Array.from(families.values()).sort(function (a, b) { return byAge(a.children[0], b.children[0]); });
    }

    function familyWidth(family) { return (family.children.length - 1) * C.pitch + 2 * C.personHalfWidth; }

    function groupFor(family, kind, left, right, sharedParentId, index) {
      const group = {
        id: "family-" + kind + "-" + index, familyKind: kind,
        partnerId: family.partnerId, sharedParentId: sharedParentId,
        firstBirthDate: family.children[0].birthDate,
        childIds: family.children.map(function (child) { return child.id; }),
        left: left, right: right, center: (left + right) / 2
      };
      groups.push(group);
      return group;
    }

    const fullSiblings = data.people.filter(function (person) {
      return person.id === primary.id || (primary.fatherId && primary.motherId &&
        person.fatherId === primary.fatherId && person.motherId === primary.motherId);
    }).sort(byAge);
    const primaryIndex = fullSiblings.findIndex(function (person) { return person.id === primary.id; });
    const centralIds = new Set(fullSiblings.map(function (person) { return person.id; }));
    const siblingNodes = fullSiblings.map(function (person, index) {
      return addPerson(person, (index - primaryIndex) * C.pitch, C.primaryY,
        person.id === primary.id ? "primary" : "sibling", "siblings",
        person.id === primary.id ? "Persona principal" : "Hermano/a");
    });
    const primaryNodeId = siblingNodes[primaryIndex];

    function addAncestry(parentId, x, side) {
      const parent = people.get(parentId);
      if (!parent) return null;
      const parentNode = addPerson(parent, x, C.parentY, "parent", "parents", side === "paternal" ? "Padre" : "Madre");
      const ancestors = [
        { person: people.get(parent.fatherId), x: x - 95, relation: "Abuelo" },
        { person: people.get(parent.motherId), x: x + 95, relation: "Abuela" }
      ];
      const ancestorNodes = ancestors.map(function (ancestor) {
        return addPerson(ancestor.person, ancestor.x, C.grandparentY, "grandparent", "grandparents",
          ancestor.relation + (side === "paternal" ? " por parte del padre" : " por parte de la madre"));
      });
      connectFamily(ancestorNodes, [parentNode], 198,
        ancestors.filter(function (ancestor) { return ancestor.person; }).map(function (ancestor) { return ancestor.person.id; }));
      return parentNode;
    }

    const fatherX = -190, motherX = 190;
    const fatherNode = addAncestry(primary.fatherId, fatherX, "paternal");
    const motherNode = addAncestry(primary.motherId, motherX, "maternal");
    connectFamily([fatherNode, motherNode], siblingNodes, 378, [primary.fatherId, primary.motherId].filter(Boolean));
    const centralLeft = Math.min(-primaryIndex * C.pitch - C.personHalfWidth, fatherX - C.personHalfWidth);
    const centralRight = Math.max((fullSiblings.length - primaryIndex - 1) * C.pitch + C.personHalfWidth, motherX + C.personHalfWidth);

    function addHalfSiblingFamilies(parentId, kind) {
      if (!parentId || !people.has(parentId)) return;
      const families = familiesOf(parentId, centralIds);
      const total = families.reduce(function (sum, family) { return sum + familyWidth(family); }, 0) + Math.max(0, families.length - 1) * C.groupGap;
      let right = kind === "paternal" ? centralLeft - C.groupGap : centralRight + C.groupGap + total;
      families.forEach(function (family, index) {
        const left = right - familyWidth(family);
        const group = groupFor(family, kind, left, right, parentId, index);
        const partnerNode = addPerson(family.partner, group.center, C.parentY, "parent-partner", "parents",
          "Otra pareja del " + (kind === "paternal" ? "padre" : "madre"), group.id);
        const childNodes = family.children.map(function (child, childIndex) {
          return addPerson(child, left + C.personHalfWidth + childIndex * C.pitch, C.primaryY,
            "half-sibling", "siblings", "Medio hermano/a por parte " + (kind === "paternal" ? "del padre" : "de la madre"), group.id);
        });
        // The common parent is identified by the side and annotation, as in v5.
        connectFamily([partnerNode], childNodes, 378, [parentId, family.partnerId].filter(Boolean));
        right = left - C.groupGap;
      });
    }
    addHalfSiblingFamilies(primary.fatherId, "paternal");
    addHalfSiblingFamilies(primary.motherId, "maternal");

    const descendantFamilies = familiesOf(primary.id);
    const descendantWidth = descendantFamilies.reduce(function (sum, family) { return sum + familyWidth(family); }, 0) + Math.max(0, descendantFamilies.length - 1) * C.groupGap;
    let right = descendantWidth / 2;
    let maxGrandchildren = 0;
    descendantFamilies.forEach(function (family, index) {
      const left = right - familyWidth(family);
      const group = groupFor(family, "descendant", left, right, primary.id, index);
      const partnerNode = addPerson(family.partner, group.center, C.partnerY, "partner", "partners", "Pareja de la persona principal", group.id);
      const childNodes = family.children.map(function (child, childIndex) {
        return addPerson(child, left + C.personHalfWidth + childIndex * C.pitch, C.childY, "child", "children", "Hijo/a", group.id);
      });
      connectFamily([partnerNode], childNodes, 738, [primary.id, family.partnerId].filter(Boolean));
      family.children.forEach(function (child, childIndex) {
        const grandchildren = childrenOf(child.id);
        maxGrandchildren = Math.max(maxGrandchildren, grandchildren.length);
        if (!grandchildren.length) return;
        const childNode = nodes.get(childNodes[childIndex]);
        const x = childNode.position.x, trunkX = x - 75;
        let previous = junction(trunkX, C.childY);
        edge(childNode.data.id, previous, false, [child.id], null, { "source-endpoint": "-26 0" });
        grandchildren.forEach(function (grandchild, grandchildIndex) {
          const y = C.grandchildY + grandchildIndex * C.grandchildPitch;
          const fork = junction(trunkX, y);
          edge(previous, fork, false, [child.id]);
          const grandchildNode = addPerson(grandchild, x, y, "grandchild", "grandchildren", "Nieto/a por " + child.name, group.id);
          edge(fork, grandchildNode, true, [child.id], grandchild.id);
          previous = fork;
        });
      });
      right = left - C.groupGap;
    });

    const name = primary.name.trim().split(/\s+/)[0];
    const grandchildrenBottom = Math.max(1080, C.grandchildY + Math.max(0, maxGrandchildren - 1) * C.grandchildPitch + 100);
    let levels = [
      { id: "grandparents", top: 0, bottom: 180,
        text: "Abuelos de " + name + ": paternos a la izquierda; maternos a la derecha.",
        shortText: "Abuelos de " + name + ": paternos a la izquierda; maternos a la derecha." },
      { id: "parents", top: 180, bottom: 360,
        text: "Padres de " + name + " y sus respectivas parejas: padre y sus parejas a la izquierda; madre y sus parejas a la derecha.",
        shortText: "Padres de " + name + " y sus parejas: padre a la izquierda; madre a la derecha." },
      { id: "siblings", top: 360, bottom: 540,
        text: name + " y sus hermanos al centro; medios hermanos paternos a la izquierda y maternos a la derecha.",
        shortText: name + " y hermanos al centro; medios hermanos paternos a la izquierda; maternos a la derecha." },
      { id: "partners", top: 540, bottom: 720, text: "Parejas de " + name + ".", shortText: "Parejas de " + name + "." },
      { id: "children", top: 720, bottom: 900, text: "Hijos de " + name + ".", shortText: "Hijos de " + name + "." },
      { id: "grandchildren", top: 900, bottom: grandchildrenBottom, text: "Nietos de " + name + ".", shortText: "Nietos de " + name + "." }
    ];
    if (!descendantFamilies.length) levels = levels.slice(0, 3);
    else if (!maxGrandchildren) levels = levels.slice(0, 5);
    bounds.y1 = 0;
    bounds.y2 = levels[levels.length - 1].bottom;
    return {
      elements: elements, levels: levels, bounds: bounds, groups: groups,
      primaryId: primary.id, primaryNodeId: primaryNodeId,
      stats: {
        people: elements.filter(function (element) { return element.data.kind === "person"; }).length,
        families: groups.length, siblings: fullSiblings.length - 1,
        halfSiblings: elements.filter(function (element) { return element.data.role === "half-sibling"; }).length,
        children: childrenOf(primary.id).length,
        grandchildren: elements.filter(function (element) { return element.data.role === "grandchild"; }).length
      }
    };
  }

  window.FamilyTreeLayout = { build: build };
}());
