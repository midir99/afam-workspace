(function () {
  "use strict";

  const errorMessage = document.getElementById("load-error");

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  }

  if (!window.cytoscape || !window.FamilyTreeLayout || !window.FamilyTreeDemoData || !window.FamilyTreeAnnotations) {
    showError("No se pudo cargar el árbol. Comprueba que todos los archivos de la carpeta estén juntos.");
    return;
  }

  // SVG local: iniciales dentro del círculo, sin fotografías ni recursos externos.
  function avatar(initials, primary) {
    const safeText = String(initials || "?").replace(/[&<>"']/g, "");
    const color = primary ? "#8d492f" : "#56634f";
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">' +
      '<text x="30" y="31" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" font-weight="500" fill="' + color + '">' + safeText + "</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  try {
    const labelStyle = window.FamilyTreeLayout.labelStyle;
    const textContext = document.createElement("canvas").getContext("2d");
    const textWidths = new Map();
    function measureLabel(text, isPrimary) {
      const key = (isPrimary ? "600|" : "400|") + text;
      if (!textWidths.has(key)) {
        textContext.font = (isPrimary ? "600 " : "400 ") + labelStyle.fontSize + "px " + labelStyle.fontFamily;
        textWidths.set(key, textContext.measureText(text).width);
      }
      return textWidths.get(key);
    }
    function addAvatars(scene) {
      scene.elements.forEach(function (element) {
        if (element.data.kind === "person") {
          element.data.avatar = avatar(element.data.initials, element.data.role === "primary");
        }
      });
      return scene;
    }
    let scene = addAvatars(window.FamilyTreeLayout.build(window.FamilyTreeDemoData, undefined,
      { measureText: measureLabel }));

    const primary = window.FamilyTreeDemoData.people.find(function (person) {
      return person.id === window.FamilyTreeDemoData.primaryId;
    });
    if (primary) document.getElementById("person-name").textContent = primary.name;

    const cy = window.cytoscape({
      container: document.getElementById("tree"),
      elements: scene.elements,
      layout: { name: "preset", fit: false },
      minZoom: 0.08,
      maxZoom: 2.5,
      wheelSensitivity: 0.18,
      autoungrabify: true,
      autounselectify: true,
      boxSelectionEnabled: false,
      style: [
        {
          selector: 'node[kind = "color-card"]',
          style: {
            shape: "rectangle", "background-color": "data(familyColor)", "background-opacity": 1,
            "border-width": 0, padding: 6, "compound-sizing-wrt-labels": "include",
            label: "", events: "no", "z-compound-depth": "bottom", "z-index": 0
          }
        },
        {
          selector: 'node[kind = "person"]',
          style: {
            shape: "ellipse", width: 52, height: 52,
            "background-color": "#ffffff",
            "background-image": "data(avatar)",
            "background-fit": "contain",
            "border-width": 1.5, "border-color": "#7d8b76",
            label: "data(label)", color: "#303a34",
            "font-family": labelStyle.fontFamily,
            "font-size": labelStyle.fontSize, "font-weight": 400,
            "text-wrap": "wrap", "text-max-width": labelStyle.maxWidth,
            "text-valign": "bottom", "text-halign": "center",
            "text-margin-y": labelStyle.marginY, "line-height": labelStyle.lineHeight,
            "z-index": 5, "z-compound-depth": "top"
          }
        },
        {
          selector: 'node[role = "primary"]',
          style: {
            width: 62, height: 62,
            "border-width": 4, "border-color": "#a45a3b",
            "background-color": "#fff1e7", "font-weight": 600
          }
        },
        {
          selector: 'node[kind = "junction"]',
          style: { width: 1, height: 1, opacity: 0, label: "", events: "no" }
        },
        {
          selector: "edge",
          style: {
            width: 1.6, "line-color": "#697665",
            "curve-style": "straight",
            "source-arrow-shape": "none", "target-arrow-shape": "none",
            "z-index": 2, "z-compound-depth": "top",
            events: "no"
          }
        },
        {
          selector: "edge.arrow",
          style: { "target-arrow-shape": "triangle", "target-arrow-color": "#697665", "arrow-scale": 0.85 }
        }
      ]
    });

    let annotations = window.FamilyTreeAnnotations.attach(cy, scene.levels,
      document.getElementById("level-background"), document.getElementById("level-labels"));

    const zoomLevel = document.getElementById("zoom-level");
    const zoomIn = document.getElementById("zoom-in");
    const zoomOut = document.getElementById("zoom-out");

    function updateZoom() {
      zoomLevel.textContent = Math.round(cy.zoom() * 100) + " %";
      zoomIn.disabled = cy.zoom() >= cy.maxZoom() - 0.001;
      zoomOut.disabled = cy.zoom() <= cy.minZoom() + 0.001;
    }

    function changeZoom(factor) {
      cy.zoom({
        level: Math.max(cy.minZoom(), Math.min(cy.maxZoom(), cy.zoom() * factor)),
        renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 }
      });
    }

    function fitTree() {
      const padding = cy.width() < 640 ? 18 : 36;
      const graphBounds = cy.elements().boundingBox({ includeLabels: true, includeOverlays: false, includeUnderlays: false });
      const bounds = {
        x1: Math.min(scene.bounds.x1, graphBounds.x1), x2: Math.max(scene.bounds.x2, graphBounds.x2),
        y1: Math.min(scene.bounds.y1, graphBounds.y1), y2: Math.max(scene.bounds.y2, graphBounds.y2)
      };
      const zoom = Math.max(cy.minZoom(), Math.min(cy.maxZoom(),
        (cy.width() - 2 * padding) / (bounds.x2 - bounds.x1),
        (cy.height() - 2 * padding) / (bounds.y2 - bounds.y1)));
      cy.viewport({ zoom: zoom, pan: {
        x: cy.width() / 2 - (bounds.x1 + bounds.x2) / 2 * zoom,
        y: cy.height() / 2 - (bounds.y1 + bounds.y2) / 2 * zoom
      } });
      updateZoom();
    }

    function focusPerson() {
      const position = cy.getElementById(scene.primaryNodeId).position();
      cy.viewport({ zoom: 1, pan: {
        x: cy.width() / 2 - position.x,
        y: cy.height() / 2 - position.y
      } });
    }

    function changeAncestorDepth(depth) {
      if (depth === scene.ancestorDepth) return;
      const zoom = cy.zoom();
      const reference = cy.getElementById(scene.primaryNodeId).renderedPosition();
      const next = addAvatars(window.FamilyTreeLayout.build(window.FamilyTreeDemoData, scene.primaryId,
        { ancestorDepth: depth, measureText: measureLabel }));
      annotations.destroy();
      cy.batch(function () {
        cy.elements().remove();
        cy.add(next.elements);
      });
      scene = next;
      annotations = window.FamilyTreeAnnotations.attach(cy, scene.levels,
        document.getElementById("level-background"), document.getElementById("level-labels"));
      const position = cy.getElementById(scene.primaryNodeId).position();
      cy.viewport({ zoom: zoom, pan: {
        x: reference.x - position.x * zoom,
        y: reference.y - position.y * zoom
      } });
    }

    function initialView() {
      focusPerson();
    }

    zoomIn.addEventListener("click", function () { changeZoom(1.25); });
    zoomOut.addEventListener("click", function () { changeZoom(0.8); });
    document.getElementById("fit-tree").addEventListener("click", fitTree);
    document.getElementById("focus-person").addEventListener("click", focusPerson);
    document.getElementById("focus-person").title = "Centrar en " + primary.name;
    document.getElementById("ancestor-depth").addEventListener("change", function (event) {
      changeAncestorDepth(Number(event.target.value));
    });
    cy.on("zoom", updateZoom);

    let previousSize = { width: cy.width(), height: cy.height() };
    const resizeObserver = new ResizeObserver(function () {
      const rect = document.getElementById("tree").getBoundingClientRect();
      if (rect.width === previousSize.width && rect.height === previousSize.height) return;
      const zoom = cy.zoom();
      const pan = cy.pan();
      const center = { x: (previousSize.width / 2 - pan.x) / zoom,
        y: (previousSize.height / 2 - pan.y) / zoom };
      cy.resize();
      previousSize = { width: cy.width(), height: cy.height() };
      cy.viewport({ zoom: zoom, pan: { x: cy.width() / 2 - center.x * zoom,
        y: cy.height() / 2 - center.y * zoom } });
      annotations.schedule();
    });
    resizeObserver.observe(document.getElementById("tree"));
    cy.one("destroy", function () { resizeObserver.disconnect(); });
    initialView();

    // Acceso desde la consola para inspeccionar la geometría de esta prueba.
    window.familyTreePoc = { cy: cy, get scene() { return scene; }, data: window.FamilyTreeDemoData,
      get annotations() { return annotations; }, fitTree: fitTree, focusPerson: focusPerson };
  } catch (error) {
    console.error(error);
    showError("No se pudo dibujar el árbol genealógico.");
  }
}());
