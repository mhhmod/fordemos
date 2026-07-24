import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeTenant } from "../lib/normalize";

test("an empty record still yields a composed page", () => {
  const t = normalizeTenant("acme-co", {});
  assert.equal(t.brand.name, "Acme Co");
  assert.equal(t.locale.dir, "ltr");
  assert.equal(t.hero.headline, "Acme Co");
  assert.equal(t.about, undefined);
  assert.equal(t.services, undefined);
});

test("malformed input never throws", () => {
  for (const bad of [
    null,
    undefined,
    42,
    "str",
    [],
    { sections: 7 },
    { sections: { breakdown: { rows: {} } } },
    { sections: { cta: { actions: "no" } } },
    { sections: { stats: { items: "no" } } },
  ]) {
    assert.doesNotThrow(() => normalizeTenant("x", bad));
  }
});

test("unsafe hrefs are dropped from hero ctas", () => {
  const t = normalizeTenant("x", {
    sections: {
      hero: {
        headline: "Hi",
        ctas: [
          { label: "bad", href: "javascript:alert(1)" },
          { label: "good", href: "https://example.com" },
        ],
      },
    },
  });
  assert.equal(t.hero.ctas.length, 1);
  assert.equal(t.hero.ctas[0].label, "good");
});

test("stats keeps valid items and drops incomplete ones", () => {
  const t = normalizeTenant("x", {
    sections: {
      stats: {
        title: "At a glance",
        items: [
          { label: "Unavailable", value: "82%", note: "of size options" },
          { label: "Brands", value: "50", emphasis: true },
          { label: "No value here" },
          { value: "no label" },
          "junk",
        ],
      },
    },
  });
  assert.equal(t.stats?.title, "At a glance");
  assert.equal(t.stats?.items.length, 2);
  assert.equal(t.stats?.items[0].note, "of size options");
  assert.equal(t.stats?.items[0].emphasis, false);
  assert.equal(t.stats?.items[1].emphasis, true);
});

test("stats vanishes when no item is complete", () => {
  const t = normalizeTenant("x", { sections: { stats: { items: [{ label: "x" }] } } });
  assert.equal(t.stats, undefined);
});

test("findings keeps titled items and auto-numbers missing ranks", () => {
  const t = normalizeTenant("x", {
    sections: {
      findings: {
        title: "What we found",
        items: [
          { title: "First", detail: "Because.", action: "Do this" },
          { title: "Second", rank: "B" },
          { detail: "no title" },
        ],
      },
    },
  });
  assert.equal(t.findings?.items.length, 2);
  assert.equal(t.findings?.items[0].rank, "01");
  assert.equal(t.findings?.items[0].action, "Do this");
  assert.equal(t.findings?.items[1].rank, "B");
});

test("findings vanishes with no titled item", () => {
  const t = normalizeTenant("x", { sections: { findings: { items: [{ detail: "x" }] } } });
  assert.equal(t.findings, undefined);
});

test("breakdown keeps numeric rows and derives max", () => {
  const t = normalizeTenant("x", {
    sections: {
      breakdown: {
        title: "By size",
        note: "Measured 25 Jul",
        rows: [
          { label: "White / XL", value: 85 },
          { label: "Black / L", value: "74", caption: "62 of 84" },
          { label: "bad", value: "abc" },
          { label: "negative", value: -5 },
          { value: 10 },
        ],
      },
    },
  });
  assert.equal(t.breakdown?.rows.length, 2);
  assert.equal(t.breakdown?.max, 85);
  assert.equal(t.breakdown?.rows[1].value, 74);
  assert.equal(t.breakdown?.rows[1].caption, "62 of 84");
  assert.equal(t.breakdown?.note, "Measured 25 Jul");
});

test("breakdown honours an explicit max", () => {
  const t = normalizeTenant("x", {
    sections: { breakdown: { max: 100, rows: [{ label: "a", value: 50 }] } },
  });
  assert.equal(t.breakdown?.max, 100);
});

test("breakdown vanishes when every value is zero or unusable", () => {
  for (const rows of [[{ label: "a", value: 0 }], [{ label: "a", value: "x" }], []]) {
    const t = normalizeTenant("x", { sections: { breakdown: { rows } } });
    assert.equal(t.breakdown, undefined);
  }
});

test("cta keeps safe actions and drops unsafe ones", () => {
  const t = normalizeTenant("x", {
    sections: {
      cta: {
        title: "Want the rest?",
        body: "Reply and it's yours.",
        actions: [
          { label: "Reply", href: "https://instagram.com/example" },
          { label: "Bad", href: "javascript:alert(1)" },
          { label: "No href" },
        ],
      },
    },
  });
  assert.equal(t.cta?.actions.length, 1);
  assert.equal(t.cta?.actions[0].label, "Reply");
  assert.equal(t.cta?.title, "Want the rest?");
});

test("cta survives on copy alone but vanishes when wholly empty", () => {
  assert.ok(normalizeTenant("x", { sections: { cta: { body: "Just words" } } }).cta);
  assert.equal(normalizeTenant("x", { sections: { cta: { actions: [] } } }).cta, undefined);
});

test("breakdown never lets a row exceed the scale", () => {
  const t = normalizeTenant("x", {
    sections: { breakdown: { max: 10, rows: [{ label: "a", value: 85 }] } },
  });
  assert.equal(t.breakdown?.max, 85);
});

test("breakdown vanishes when all rows are zero even with a declared max", () => {
  const t = normalizeTenant("x", {
    sections: { breakdown: { max: 100, rows: [{ label: "a", value: 0 }] } },
  });
  assert.equal(t.breakdown, undefined);
});

test("blank strings are not numbers", () => {
  const t = normalizeTenant("x", {
    sections: { breakdown: { rows: [{ label: "a", value: "  " }, { label: "b", value: 5 }] } },
  });
  assert.equal(t.breakdown?.rows.length, 1);
  assert.equal(t.breakdown?.rows[0].label, "b");
});

test("numbers are accepted where a display string is expected", () => {
  const t = normalizeTenant("x", {
    sections: {
      stats: { items: [{ label: "Brands", value: 50 }] },
      findings: { items: [{ title: "T", rank: 3 }] },
    },
  });
  assert.equal(t.stats?.items[0].value, "50");
  assert.equal(t.findings?.items[0].rank, "03");
});

test("cta and hero action lists are both capped at three", () => {
  const four = [1, 2, 3, 4].map((n) => ({ label: `a${n}`, href: "https://e.com" }));
  const t = normalizeTenant("x", {
    sections: { hero: { headline: "h", ctas: four }, cta: { body: "b", actions: four } },
  });
  assert.equal(t.hero.ctas.length, 3);
  assert.equal(t.cta?.actions.length, 3);
});

test("a cta with only a title carries no ask and vanishes", () => {
  assert.equal(normalizeTenant("x", { sections: { cta: { title: "Only" } } }).cta, undefined);
});

test("an inherited object key cannot become a social label", () => {
  const t = normalizeTenant("x", {
    sections: { contact: { socials: [{ type: "constructor", href: "https://a.com" }] } },
  });
  assert.equal(typeof t.contact?.socials[0].label, "string");
  assert.equal(t.contact?.socials[0].label, "Constructor");
});
