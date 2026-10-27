// The flat data format SvelteKit uses for __data.json: the first entry is the root, and objects
// and arrays hold indexes into the entry list. Negative indexes are -1 undefined, -2 array hole,
// -3 NaN, -4 Infinity, -5 -Infinity, -6 -0. Only what Bible's loadout data needs is supported.
// docs/javascripts/bible-decode.js has its own reader for the browser; this copy is for tests
// and for building fixtures.
export function unflatten(values) {
  const special = new Map([[-1, undefined], [-3, NaN], [-4, Infinity], [-5, -Infinity], [-6, -0]]);
  const out = new Array(values.length);
  const done = new Array(values.length).fill(false);
  const get = (i) => {
    if (special.has(i)) return special.get(i);
    if (!Number.isInteger(i) || i < 0 || i >= values.length) throw new Error("bad reference " + i);
    if (done[i]) return out[i];
    done[i] = true;
    const v = values[i];
    if (v === null || typeof v !== "object") return (out[i] = v);
    if (Array.isArray(v)) {
      if (typeof v[0] === "string") {
        if (v[0] === "Date") return (out[i] = new Date(v[1]));
        throw new Error("unsupported data tag " + v[0]);
      }
      const arr = (out[i] = new Array(v.length));
      v.forEach((j, n) => { if (j !== -2) arr[n] = get(j); });
      return arr;
    }
    const o = (out[i] = {});
    for (const [k, j] of Object.entries(v)) o[k] = get(j);
    return o;
  };
  return get(0);
}

export function flatten(root) {
  const values = [];
  const primitives = new Map();
  const add = (v) => {
    if (v === undefined) return -1;
    if (v === null || typeof v !== "object") {
      if (typeof v === "number" && !Number.isFinite(v)) throw new Error("non-finite numbers are not supported");
      const key = typeof v + ":" + String(v);
      if (primitives.has(key)) return primitives.get(key);
      values.push(v);
      primitives.set(key, values.length - 1);
      return values.length - 1;
    }
    const i = values.length;
    values.push(null);
    if (Array.isArray(v)) values[i] = v.map(add);
    else {
      const o = {};
      for (const [k, x] of Object.entries(v)) o[k] = add(x);
      values[i] = o;
    }
    return i;
  };
  add(root);
  return values;
}

export function dataBody(layout, page) {
  return JSON.stringify({ type: "data", nodes: [{ type: "skip" }, { type: "data", data: flatten(layout) }, { type: "data", data: flatten(page) }] });
}
