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
  for (const bad of [null, undefined, 42, "str", [], { sections: 7 }]) {
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
