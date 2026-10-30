(function () {
  "use strict";

  const C = {
    pitch: 155, groupGap: 80, personHalfWidth: 70,
    levelHeight: 180, nodeOffset: 85, busOffset: 18, cardPadding: 6, verticalGap: 16
  };

  const LABEL_STYLE = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 15, lineHeight: 1.25, maxWidth: 132, marginY: 10
  };

  const FAMILY_COLORS = ["#e1d4ec", "#d1e8d0", "#ffefc7", "#f9cccc", "#d5e5ff", "#ffe4cd"];

  function familyColor(index) {
    // Extend the palette rather than cycling back to an already assigned colour.
    return FAMILY_COLORS[index] || "hsl(" + ((index * 137.508) % 360).toFixed(2) + ", 55%, 85%)";
  }

  function yearOf(date) {
    const match = String(date || "").match(/^(\d{4})(?:-|$)/);
    return match ? match[1] : "";
  }

  function lifeYearsFor(person) {
    const birth = yearOf(person.birthDate);
    const death = yearOf(person.deathDate);
    return death ? (birth || "?") + "-" + death : birth;
  }

  function labelFor(person, isPrimary, measureText) {
    const lines = [""];
    String(person.name || "").trim().split(/\s+/).forEach(function (word) {
      const last = lines.length - 1;
      const candidate = lines[last] + (lines[last] ? " " : "") + word;
      const tooWide = measureText ? measureText(candidate, isPrimary) > LABEL_STYLE.maxWidth - 2 : candidate.length > 18;
      if (lines[last] && tooWide) lines.push(word);
      else lines[last] += (lines[last] ? " " : "") + word;
    });
    const years = lifeYearsFor(person);
    if (years) lines.push(years);
    return lines.join("\n");
  }

  function byAge(a, b) {
    return String(a.birthDate || "9999").localeCompare(String(b.birthDate || "9999")) || a.id.localeCompare(b.id);
  }

  function build(data, selectedId, options) {
    const people = new Map(data.people.map(function (person) { return [person.id, person]; }));
    const primary = people.get(selectedId || data.primaryId);
    if (!primary) throw new Error("No existe la persona principal.");
    const measureText = options && options.measureText;
    const textBlocks = new Map();
    function textBlock(person, isPrimary) {
      const key = person.id + (isPrimary ? ":primary" : ":person");
      if (!textBlocks.has(key)) {
        const label = labelFor(person, isPrimary, measureText);
        const bottom = Math.ceil((isPrimary ? 33 : 27) + LABEL_STYLE.marginY +
          label.split("\n").length * LABEL_STYLE.fontSize * LABEL_STYLE.lineHeight + 3);
        textBlocks.set(key, { label: label, top: isPrimary ? 36 : 30, bottom: bottom });
      }
      return textBlocks.get(key);
    }
    // Reserve space for the complete label, including the years and card padding.
    // In the browser, native canvas text metrics use the same font as Cytoscape.
    let maxBottom = 0;
    data.people.forEach(function (person) {
      maxBottom = Math.max(maxBottom, textBlock(person, person.id === primary.id).bottom);
    });
    const levelHeight = Math.ceil(Math.max(C.levelHeight,
      C.nodeOffset + maxBottom + C.cardPadding + C.verticalGap) / 10) * 10;
    const columnPitch = Math.ceil((36 + maxBottom + 2 * C.cardPadding + C.verticalGap) / 10) * 10;
    const ancestorDepth = options && options.ancestorDepth === 2 ? 2 : 3;
    const name = primary.name.trim().split(/\s+/)[0];
    const levels = [
      { id: "great-grandparents",
        text: "Bisabuelos de " + name + ": paternos a la izquierda; maternos a la derecha.",
        shortText: "Bisabuelos de " + name + ": paternos a la izquierda; maternos a la derecha." },
      { id: "grandparents",
        text: "Abuelos de " + name + ": paternos a la izquierda; maternos a la derecha.",
        shortText: "Abuelos de " + name + ": paternos a la izquierda; maternos a la derecha." },
      { id: "parents",
        text: "Padres de " + name + " y sus respectivas parejas: padre y sus parejas a la izquierda; madre y sus parejas a la derecha.",
        shortText: "Padres de " + name + " y sus parejas: padre a la izquierda; madre a la derecha." },
      { id: "siblings",
        text: name + " y sus hermanos al centro; medios hermanos paternos a la izquierda y maternos a la derecha.",
        shortText: name + " y hermanos al centro; medios hermanos: paternos izq.; maternos der." },
      { id: "partners", text: "Parejas de " + name + ".", shortText: "Parejas de " + name + "." },
      { id: "children", text: "Hijos de " + name + ".", shortText: "Hijos de " + name + "." },
      { id: "grandchildren", text: "Nietos de " + name + ".", shortText: "Nietos de " + name + "." },
      { id: "great-grandchildren", text: "Bisnietos de " + name + ": el color los relaciona con su padre o madre.",
        shortText: "Bisnietos de " + name + ": el color los relaciona con su padre o madre." }
    ].filter(function (level) { return ancestorDepth === 3 || level.id !== "great-grandparents"; });
    const levelById = new Map();
    const y = {};
    levels.forEach(function (level, index) {
      level.top = index * levelHeight;
      level.bottom = level.top + levelHeight;
      levelById.set(level.id, level);
      y[level.id] = level.top + C.nodeOffset;
    });
    function busY(levelId) { return levelById.get(levelId).top + C.busOffset; }

    const elements = [], cards = [], groups = [], greatGrandchildGroups = [];
    const occurrences = new Map(), nodes = new Map(), childrenIndex = new Map();
    const bounds = { x1: Infinity, y1: 0, x2: -Infinity, y2: levels[levels.length - 1].bottom };
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
      bounds.y1 = Math.min(bounds.y1, y - (person ? person.topExtent : 1));
      bounds.y2 = Math.max(bounds.y2, y + (person ? person.bottomExtent : 1));
    }

    function addPerson(person, x, y, role, level, relation, familyId) {
      if (!person) return null;
      const count = occurrences.get(person.id) || 0;
      occurrences.set(person.id, count + 1);
      const id = person.id + (count ? "--occurrence-" + count : "");
      const block = textBlock(person, role === "primary");
      const node = {
        data: {
          id: id, personId: person.id, kind: "person", name: person.name, label: block.label,
          lifeYears: lifeYearsFor(person), deathDate: person.deathDate,
          initials: person.name.split(/\s+/).slice(0, 2).map(function (word) { return word[0]; }).join(""),
          role: role, level: level, relation: relation, birthDate: person.birthDate,
          fatherId: person.fatherId, motherId: person.motherId, familyId: familyId || "",
          topExtent: block.top, bottomExtent: block.bottom, sourceOffset: block.bottom + 8
        },
        position: { x: x, y: y }
      };
      elements.push(node);
      nodes.set(id, node);
      include(x, y, node.data);
      return id;
    }

    function addColorCard(nodeId, color, progenitorNodeId) {
      const node = nodes.get(nodeId);
      const cardId = "__color-card-" + nodeId;
      cards.push({ data: {
        id: cardId, kind: "color-card", familyColor: color, colorGroupId: progenitorNodeId,
        personNodeId: nodeId, level: node.data.level
      } });
      node.data.parent = cardId;
      node.data.familyColor = color;
      node.data.colorGroupId = progenitorNodeId;
      // Compounds size themselves from the person's body and label in Cytoscape.
      // Reserve their padding in the model bounds used by the overview.
      bounds.x1 = Math.min(bounds.x1, node.position.x - C.personHalfWidth - C.cardPadding);
      bounds.x2 = Math.max(bounds.x2, node.position.x + C.personHalfWidth + C.cardPadding);
      bounds.y1 = Math.min(bounds.y1, node.position.y - node.data.topExtent - C.cardPadding);
      bounds.y2 = Math.max(bounds.y2, node.position.y + node.data.bottomExtent + C.cardPadding);
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
      return addPerson(person, (index - primaryIndex) * C.pitch, y.siblings,
        person.id === primary.id ? "primary" : "sibling", "siblings",
        person.id === primary.id ? "Persona principal" : "Hermano/a");
    });
    const primaryNodeId = siblingNodes[primaryIndex];

    // Measure before positioning. Equal halves keep a descendant under the midpoint
    // of their parents, reserving the missing parent's slot when ancestry is incomplete.
    function ancestryWidth(personId, generation) {
      const person = people.get(personId);
      if (!person || generation === ancestorDepth) return C.pitch;
      return 2 * Math.max(ancestryWidth(person.fatherId, generation + 1),
        ancestryWidth(person.motherId, generation + 1));
    }

    const ancestorLevels = [null, "parents", "grandparents", "great-grandparents"];
    const ancestorRoles = [null, "parent", "grandparent", "great-grandparent"];
    function addAncestor(personId, generation, x, width, side, isFather) {
      const person = people.get(personId);
      if (!person) return null;
      const level = ancestorLevels[generation];
      const title = isFather ? [null, "Padre", "Abuelo", "Bisabuelo"][generation] :
        [null, "Madre", "Abuela", "Bisabuela"][generation];
      const relation = title + (generation > 1 ? " por parte " + (side === "paternal" ? "del padre" : "de la madre") : "");
      const nodeId = addPerson(person, x, y[level], ancestorRoles[generation], level, relation);
      nodes.get(nodeId).data.generation = generation;
      nodes.get(nodeId).data.ancestorSide = side;
      if (generation < ancestorDepth) {
        const father = addAncestor(person.fatherId, generation + 1, x - width / 4, width / 2, side, true);
        const mother = addAncestor(person.motherId, generation + 1, x + width / 4, width / 2, side, false);
        connectFamily([father, mother], [nodeId], busY(level),
          [person.fatherId, person.motherId].filter(function (id) { return people.has(id); }));
      }
      return nodeId;
    }

    const ancestorWidth = ancestryWidth(primary.id, 0);
    const fatherX = -ancestorWidth / 4, motherX = ancestorWidth / 4;
    const fatherNode = addAncestor(primary.fatherId, 1, fatherX, ancestorWidth / 2, "paternal", true);
    const motherNode = addAncestor(primary.motherId, 1, motherX, ancestorWidth / 2, "maternal", false);
    connectFamily([fatherNode, motherNode], siblingNodes, busY("siblings"), [primary.fatherId, primary.motherId].filter(Boolean));
    const centralLeft = Math.min(-primaryIndex * C.pitch - C.personHalfWidth, fatherX - C.personHalfWidth);
    const centralRight = Math.max((fullSiblings.length - primaryIndex - 1) * C.pitch + C.personHalfWidth, motherX + C.personHalfWidth);

    function addHalfSiblingFamilies(parentId, kind) {
      if (!parentId || !people.has(parentId)) return;
      const families = familiesOf(parentId, centralIds);
      const total = families.reduce(function (sum, family) { return sum + familyWidth(family); }, 0) + Math.max(0, families.length - 1) * C.groupGap;
      // Read chronological groups left to right on either side of the central family.
      let left = kind === "paternal" ? centralLeft - C.groupGap - total : centralRight + C.groupGap;
      families.forEach(function (family, index) {
        const right = left + familyWidth(family);
        const group = groupFor(family, kind, left, right, parentId, index);
        const partnerNode = addPerson(family.partner, group.center, y.parents, "parent-partner", "parents",
          "Otra pareja del " + (kind === "paternal" ? "padre" : "madre"), group.id);
        const childNodes = family.children.map(function (child, childIndex) {
          return addPerson(child, left + C.personHalfWidth + childIndex * C.pitch, y.siblings,
            "half-sibling", "siblings", "Medio hermano/a por parte " + (kind === "paternal" ? "del padre" : "de la madre"), group.id);
        });
        // The common parent is identified by the side and annotation, as in v5.
        connectFamily([partnerNode], childNodes, busY("siblings"), [parentId, family.partnerId].filter(Boolean));
        left = right + C.groupGap;
      });
    }
    addHalfSiblingFamilies(primary.fatherId, "paternal");
    addHalfSiblingFamilies(primary.motherId, "maternal");

    const descendantFamilies = familiesOf(primary.id);
    const descendantWidth = descendantFamilies.reduce(function (sum, family) { return sum + familyWidth(family); }, 0) + Math.max(0, descendantFamilies.length - 1) * C.groupGap;
    let left = -descendantWidth / 2;
    let maxGrandchildren = 0;
    const grandchildEntries = [];
    descendantFamilies.forEach(function (family, index) {
      const right = left + familyWidth(family);
      const group = groupFor(family, "descendant", left, right, primary.id, index);
      const partnerNode = addPerson(family.partner, group.center, y.partners, "partner", "partners", "Pareja de la persona principal", group.id);
      const childNodes = family.children.map(function (child, childIndex) {
        return addPerson(child, left + C.personHalfWidth + childIndex * C.pitch, y.children, "child", "children", "Hijo/a", group.id);
      });
      connectFamily([partnerNode], childNodes, busY("children"), [primary.id, family.partnerId].filter(Boolean));
      family.children.forEach(function (child, childIndex) {
        const grandchildren = childrenOf(child.id);
        maxGrandchildren = Math.max(maxGrandchildren, grandchildren.length);
        if (!grandchildren.length) return;
        const childNode = nodes.get(childNodes[childIndex]);
        const x = childNode.position.x, trunkX = x - 75;
        let previous = junction(trunkX, y.children);
        edge(childNode.data.id, previous, false, [child.id], null, { "source-endpoint": "-26 0" });
        grandchildren.forEach(function (grandchild, grandchildIndex) {
          const grandchildY = y.grandchildren + grandchildIndex * columnPitch;
          const fork = junction(trunkX, grandchildY);
          edge(previous, fork, false, [child.id]);
          const grandchildNode = addPerson(grandchild, x, grandchildY, "grandchild", "grandchildren", "Nieto/a por " + child.name, group.id);
          edge(fork, grandchildNode, true, [child.id], grandchild.id);
          grandchildEntries.push({ person: grandchild, nodeId: grandchildNode, parentX: x, y: grandchildY });
          previous = fork;
        });
      });
      left = right + C.groupGap;
    });

    const grandchildrenLevel = levelById.get("grandchildren");
    grandchildrenLevel.bottom = Math.max(grandchildrenLevel.bottom,
      y.grandchildren + Math.max(0, maxGrandchildren - 1) * columnPitch + maxBottom + C.cardPadding + C.verticalGap);

    // Read the finished diagram left to right, then top to bottom, to obtain
    // the order of great-grandchild columns.
    const fertileGrandchildren = grandchildEntries.slice().sort(function (a, b) {
      return a.parentX - b.parentX || a.y - b.y || a.nodeId.localeCompare(b.nodeId);
    }).map(function (entry) {
      return Object.assign({}, entry, { children: childrenOf(entry.person.id) });
    }).filter(function (entry) { return entry.children.length > 0; });

    const greatGrandchildrenLevel = levelById.get("great-grandchildren");
    greatGrandchildrenLevel.top = grandchildrenLevel.bottom;
    y["great-grandchildren"] = greatGrandchildrenLevel.top + C.nodeOffset;
    let maxGreatGrandchildren = 0;
    fertileGrandchildren.forEach(function (entry, columnIndex) {
      const color = familyColor(columnIndex);
      const x = (columnIndex - (fertileGrandchildren.length - 1) / 2) * C.pitch;
      const group = { progenitorId: entry.person.id, progenitorNodeId: entry.nodeId,
        color: color, x: x, childIds: [], childNodeIds: [] };
      addColorCard(entry.nodeId, color, entry.nodeId);
      entry.children.forEach(function (child, childIndex) {
        const nodeId = addPerson(child, x, y["great-grandchildren"] + childIndex * columnPitch,
          "great-grandchild", "great-grandchildren", "Bisnieto/a por " + entry.person.name, nodes.get(entry.nodeId).data.familyId);
        addColorCard(nodeId, color, entry.nodeId);
        group.childIds.push(child.id);
        group.childNodeIds.push(nodeId);
      });
      greatGrandchildGroups.push(group);
      maxGreatGrandchildren = Math.max(maxGreatGrandchildren, entry.children.length);
    });
    greatGrandchildrenLevel.bottom = Math.max(greatGrandchildrenLevel.top + levelHeight,
      y["great-grandchildren"] + Math.max(0, maxGreatGrandchildren - 1) * columnPitch + maxBottom + C.cardPadding + C.verticalGap);
    const lastLevel = !descendantFamilies.length ? "siblings" : !maxGrandchildren ? "children" :
      !maxGreatGrandchildren ? "grandchildren" : "great-grandchildren";
    levels.splice(levels.findIndex(function (level) { return level.id === lastLevel; }) + 1);
    bounds.y1 = 0;
    bounds.y2 = levels[levels.length - 1].bottom;
    return {
      elements: cards.concat(elements), levels: levels, bounds: bounds, groups: groups,
      greatGrandchildGroups: greatGrandchildGroups,
      geometry: { levelHeight: levelHeight, columnPitch: columnPitch },
      primaryId: primary.id, primaryNodeId: primaryNodeId, ancestorDepth: ancestorDepth,
      stats: {
        people: elements.filter(function (element) { return element.data.kind === "person"; }).length,
        greatGrandparents: elements.filter(function (element) { return element.data.role === "great-grandparent"; }).length,
        families: groups.length, siblings: fullSiblings.length - 1,
        halfSiblings: elements.filter(function (element) { return element.data.role === "half-sibling"; }).length,
        children: childrenOf(primary.id).length,
        grandchildren: elements.filter(function (element) { return element.data.role === "grandchild"; }).length,
        greatGrandchildren: elements.filter(function (element) { return element.data.role === "great-grandchild"; }).length
      }
    };
  }

  window.FamilyTreeLayout = { build: build, lifeYearsFor: lifeYearsFor, labelStyle: LABEL_STYLE };
}());
