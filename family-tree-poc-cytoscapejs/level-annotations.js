(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const clamp = function (min, value, max) { return Math.max(min, Math.min(max, value)); };

  function svgElement(tag, attributes) {
    const element = document.createElementNS(NS, tag);
    Object.keys(attributes || {}).forEach(function (key) { element.setAttribute(key, attributes[key]); });
    return element;
  }

  function attach(cy, levels, background, labels) {
    const bands = levels.map(function (level, index) {
      const rect = svgElement("rect", { class: "level-fill " + (index % 2 ? "alternate" : "") });
      background.appendChild(rect);
      return rect;
    });
    const boundaries = levels.map(function (level) { return level.top; });
    boundaries.push(levels[levels.length - 1].bottom);
    const lines = boundaries.map(function () {
      const line = svgElement("line", { class: "level-boundary" });
      background.appendChild(line);
      return line;
    });
    const notes = levels.map(function (level) {
      const group = svgElement("g", { class: "level-note", "data-level": level.id,
        role: "img", "aria-label": level.text });
      const title = svgElement("title");
      title.textContent = level.text;
      const rect = svgElement("rect", { class: "level-note-card", rx: 4 });
      const text = svgElement("text", { class: "level-note-text", "dominant-baseline": "hanging" });
      group.append(title, rect, text);
      labels.appendChild(group);
      return { group: group, rect: rect, text: text, lastText: "" };
    });
    const measure = svgElement("text", { visibility: "hidden", class: "level-note-text", "aria-hidden": "true" });
    labels.appendChild(measure);
    const wrapCache = new Map();
    let frame = null;
    let destroyed = false;

    function wrap(text, width, fontSize) {
      const key = fontSize + "|" + width + "|" + text;
      if (wrapCache.has(key)) return wrapCache.get(key);
      measure.setAttribute("font-size", fontSize);
      const result = [];
      let current = "";
      text.split(/\s+/).forEach(function (word) {
        const candidate = current ? current + " " + word : word;
        measure.textContent = candidate;
        if (current && measure.getComputedTextLength() > width) {
          result.push(current);
          current = word;
        } else current = candidate;
      });
      if (current) result.push(current);
      if (wrapCache.size > 250) wrapCache.clear();
      wrapCache.set(key, result);
      return result;
    }

    function render() {
      frame = null;
      if (destroyed || cy.destroyed()) return;
      const area = background.parentElement;
      const width = area.clientWidth;
      const height = area.clientHeight;
      if (!width || !height) return;
      [background, labels].forEach(function (svg) {
        svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      });
      const zoom = cy.zoom();
      const panY = cy.pan().y;
      const margin = width < 640 ? 8 : 14;
      const noteWidth = Math.max(80, width - cy.width() - 2 * margin);
      const noteX = width - noteWidth - margin;
      const paddingX = 10;
      const preferredFont = Math.round(clamp(14, 16 * zoom, 22) * 10) / 10;

      boundaries.forEach(function (boundary, index) {
        const y = boundary * zoom + panY;
        lines[index].setAttribute("x1", 0);
        lines[index].setAttribute("x2", width);
        lines[index].setAttribute("y1", y);
        lines[index].setAttribute("y2", y);
      });

      levels.forEach(function (level, index) {
        const top = level.top * zoom + panY;
        const bottom = level.bottom * zoom + panY;
        const band = bands[index];
        band.setAttribute("x", 0);
        band.setAttribute("y", top);
        band.setAttribute("width", width);
        band.setAttribute("height", bottom - top);

        const note = notes[index];
        const visibleTop = Math.max(0, top);
        const visibleBottom = Math.min(height, bottom);
        // Compress the card before abbreviating, keeping the relationship and side in every variant.
        const candidates = [
          { text: level.text, font: preferredFont, padding: 10, gap: margin, variant: "full" },
          { text: level.text, font: preferredFont, padding: 6, gap: 5, variant: "full" },
          { text: level.shortText, font: preferredFont, padding: 6, gap: 5, variant: "short" },
          { text: level.shortText, font: 14, padding: 6, gap: 5, variant: "short" },
          { text: level.text, font: 14, padding: 2, gap: 2, variant: "full" },
          { text: level.shortText, font: 14, padding: 2, gap: 2, variant: "short" }
        ];
        let chosen = null;
        for (const candidate of candidates) {
          const wrapped = wrap(candidate.text, noteWidth - 2 * paddingX, candidate.font);
          const height = wrapped.length * candidate.font * 1.25 + 2 * candidate.padding;
          if (height + 2 * candidate.gap <= visibleBottom - visibleTop) {
            chosen = Object.assign({}, candidate, { wrapped: wrapped, height: height });
            break;
          }
        }
        if (!chosen) {
          note.group.style.display = "none";
          note.group.setAttribute("data-visible", "false");
          return;
        }

        // Stay inside the visible portion even when the original top is off screen.
        const y = clamp(visibleTop + chosen.gap, top + chosen.gap, visibleBottom - chosen.height - chosen.gap);
        note.group.style.display = "";
        note.group.setAttribute("data-visible", "true");
        note.group.setAttribute("data-variant", chosen.variant);
        note.group.setAttribute("data-text", chosen.text);
        note.group.setAttribute("data-top", visibleTop);
        note.group.setAttribute("data-bottom", visibleBottom);
        note.rect.setAttribute("x", noteX);
        note.rect.setAttribute("y", y);
        note.rect.setAttribute("width", noteWidth);
        note.rect.setAttribute("height", chosen.height);
        note.text.setAttribute("font-size", chosen.font);
        const textKey = chosen.wrapped.join("\n") + "|" + chosen.font;
        if (textKey !== note.lastText) {
          note.text.replaceChildren.apply(note.text, chosen.wrapped.map(function (line) {
            const span = svgElement("tspan");
            span.textContent = line;
            return span;
          }));
          note.lastText = textKey;
        }
        Array.from(note.text.children).forEach(function (span, lineIndex) {
          span.setAttribute("x", noteX + paddingX);
          span.setAttribute("y", y + chosen.padding + lineIndex * chosen.font * 1.25);
        });
      });
    }

    function schedule() {
      if (!destroyed && frame === null) frame = requestAnimationFrame(render);
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      if (frame !== null) cancelAnimationFrame(frame);
      cy.off("viewport resize", schedule);
      cy.off("destroy", destroy);
      background.replaceChildren();
      labels.replaceChildren();
      wrapCache.clear();
    }

    cy.on("viewport resize", schedule);
    cy.one("destroy", destroy);
    schedule();
    return { render: render, schedule: schedule, destroy: destroy };
  }

  window.FamilyTreeAnnotations = { attach: attach };
}());
