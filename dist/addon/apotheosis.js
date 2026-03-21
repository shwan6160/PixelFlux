import * as e from "three";
import { createMinecraftBlockMesh as m } from "../pixelflux.js";
const B = "1.21", u = `https://raw.githubusercontent.com/Shadows-of-Fire/Apotheosis/refs/heads/${B}/src/main/resources/assets/apotheosis`;
function z(n) {
  return n.includes("apotheosis");
}
async function S(n) {
  return n.includes("augmenting_table") ? await E() : n.includes("reforging_table") ? await y() : null;
}
async function E() {
  const n = u + "/models/item/star_cube.json", o = await m(n), t = new e.Vector3(1, 1, 1).normalize(), c = new e.Vector3(0, 1, 0), s = new e.Quaternion().setFromUnitVectors(t, c);
  return o.quaternion.copy(s), o.position.y = 1.2, o;
}
async function y() {
  const n = u + "/models/item/hammer.json", o = await m(n), t = new e.Box3().setFromObject(o), c = new e.Vector3(0, -0.5, 0);
  t.getCenter(c), o.children.forEach((a) => a.position.sub(c));
  const s = new e.Vector3();
  t.getSize(s), o.children.forEach((a) => a.position.z -= s.z * 0.5);
  const r = new e.Vector3(0.25, 0.5, 0.25), p = new e.Vector3(0, 0.25, 0), d = new e.Vector3(0.5, 0.25, 0.5), w = new e.Vector3(0, 0, 1), b = new e.Vector3(1, 0, 0), i = p.clone().sub(r).normalize(), V = d.clone().sub(r).normalize(), l = new e.Quaternion().setFromUnitVectors(w, i), f = b.clone().applyQuaternion(l), g = V.clone().projectOnPlane(i).normalize(), h = new e.Quaternion().setFromUnitVectors(f, g);
  return o.quaternion.copy(h).multiply(l), o.position.copy(r), o;
}
export {
  S as addEBM,
  z as isApotheosisNamespace
};
