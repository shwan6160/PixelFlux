import * as p from "three";
import { Controls as $, Vector3 as m, MOUSE as g, TOUCH as b, Quaternion as I, Spherical as U, Vector2 as _, Ray as q, Plane as Q, MathUtils as J } from "three";
const z = { type: "change" }, x = { type: "start" }, X = { type: "end" }, S = new q(), Z = new Q(), tt = Math.cos(70 * J.DEG2RAD), c = new m(), u = 2 * Math.PI, a = {
  NONE: -1,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_PAN: 4,
  TOUCH_DOLLY_PAN: 5,
  TOUCH_DOLLY_ROTATE: 6
}, R = 1e-6;
class et extends $ {
  /**
   * Constructs a new controls instance.
   *
   * @param {Object3D} object - The object that is managed by the controls.
   * @param {?HTMLDOMElement} domElement - The HTML element used for event listeners.
   */
  constructor(t, e = null) {
    super(t, e), this.state = a.NONE, this.target = new m(), this.cursor = new m(), this.minDistance = 0, this.maxDistance = 1 / 0, this.minZoom = 0, this.maxZoom = 1 / 0, this.minTargetRadius = 0, this.maxTargetRadius = 1 / 0, this.minPolarAngle = 0, this.maxPolarAngle = Math.PI, this.minAzimuthAngle = -1 / 0, this.maxAzimuthAngle = 1 / 0, this.enableDamping = !1, this.dampingFactor = 0.05, this.enableZoom = !0, this.zoomSpeed = 1, this.enableRotate = !0, this.rotateSpeed = 1, this.keyRotateSpeed = 1, this.enablePan = !0, this.panSpeed = 1, this.screenSpacePanning = !0, this.keyPanSpeed = 7, this.zoomToCursor = !1, this.autoRotate = !1, this.autoRotateSpeed = 2, this.keys = { LEFT: "ArrowLeft", UP: "ArrowUp", RIGHT: "ArrowRight", BOTTOM: "ArrowDown" }, this.mouseButtons = { LEFT: g.ROTATE, MIDDLE: g.DOLLY, RIGHT: g.PAN }, this.touches = { ONE: b.ROTATE, TWO: b.DOLLY_PAN }, this.target0 = this.target.clone(), this.position0 = this.object.position.clone(), this.zoom0 = this.object.zoom, this._domElementKeyEvents = null, this._lastPosition = new m(), this._lastQuaternion = new I(), this._lastTargetPosition = new m(), this._quat = new I().setFromUnitVectors(t.up, new m(0, 1, 0)), this._quatInverse = this._quat.clone().invert(), this._spherical = new U(), this._sphericalDelta = new U(), this._scale = 1, this._panOffset = new m(), this._rotateStart = new _(), this._rotateEnd = new _(), this._rotateDelta = new _(), this._panStart = new _(), this._panEnd = new _(), this._panDelta = new _(), this._dollyStart = new _(), this._dollyEnd = new _(), this._dollyDelta = new _(), this._dollyDirection = new m(), this._mouse = new _(), this._performCursorZoom = !1, this._pointers = [], this._pointerPositions = {}, this._controlActive = !1, this._onPointerMove = it.bind(this), this._onPointerDown = st.bind(this), this._onPointerUp = ot.bind(this), this._onContextMenu = dt.bind(this), this._onMouseWheel = ht.bind(this), this._onKeyDown = rt.bind(this), this._onTouchStart = lt.bind(this), this._onTouchMove = ct.bind(this), this._onMouseDown = nt.bind(this), this._onMouseMove = at.bind(this), this._interceptControlDown = pt.bind(this), this._interceptControlUp = ut.bind(this), this.domElement !== null && this.connect(this.domElement), this.update();
  }
  connect(t) {
    super.connect(t), this.domElement.addEventListener("pointerdown", this._onPointerDown), this.domElement.addEventListener("pointercancel", this._onPointerUp), this.domElement.addEventListener("contextmenu", this._onContextMenu), this.domElement.addEventListener("wheel", this._onMouseWheel, { passive: !1 }), this.domElement.getRootNode().addEventListener("keydown", this._interceptControlDown, { passive: !0, capture: !0 }), this.domElement.style.touchAction = "none";
  }
  disconnect() {
    this.domElement.removeEventListener("pointerdown", this._onPointerDown), this.domElement.removeEventListener("pointermove", this._onPointerMove), this.domElement.removeEventListener("pointerup", this._onPointerUp), this.domElement.removeEventListener("pointercancel", this._onPointerUp), this.domElement.removeEventListener("wheel", this._onMouseWheel), this.domElement.removeEventListener("contextmenu", this._onContextMenu), this.stopListenToKeyEvents(), this.domElement.getRootNode().removeEventListener("keydown", this._interceptControlDown, { capture: !0 }), this.domElement.style.touchAction = "auto";
  }
  dispose() {
    this.disconnect();
  }
  /**
   * Get the current vertical rotation, in radians.
   *
   * @return {number} The current vertical rotation, in radians.
   */
  getPolarAngle() {
    return this._spherical.phi;
  }
  /**
   * Get the current horizontal rotation, in radians.
   *
   * @return {number} The current horizontal rotation, in radians.
   */
  getAzimuthalAngle() {
    return this._spherical.theta;
  }
  /**
   * Returns the distance from the camera to the target.
   *
   * @return {number} The distance from the camera to the target.
   */
  getDistance() {
    return this.object.position.distanceTo(this.target);
  }
  /**
   * Adds key event listeners to the given DOM element.
   * `window` is a recommended argument for using this method.
   *
   * @param {HTMLDOMElement} domElement - The DOM element
   */
  listenToKeyEvents(t) {
    t.addEventListener("keydown", this._onKeyDown), this._domElementKeyEvents = t;
  }
  /**
   * Removes the key event listener previously defined with `listenToKeyEvents()`.
   */
  stopListenToKeyEvents() {
    this._domElementKeyEvents !== null && (this._domElementKeyEvents.removeEventListener("keydown", this._onKeyDown), this._domElementKeyEvents = null);
  }
  /**
   * Save the current state of the controls. This can later be recovered with `reset()`.
   */
  saveState() {
    this.target0.copy(this.target), this.position0.copy(this.object.position), this.zoom0 = this.object.zoom;
  }
  /**
   * Reset the controls to their state from either the last time the `saveState()`
   * was called, or the initial state.
   */
  reset() {
    this.target.copy(this.target0), this.object.position.copy(this.position0), this.object.zoom = this.zoom0, this.object.updateProjectionMatrix(), this.dispatchEvent(z), this.update(), this.state = a.NONE;
  }
  update(t = null) {
    const e = this.object.position;
    c.copy(e).sub(this.target), c.applyQuaternion(this._quat), this._spherical.setFromVector3(c), this.autoRotate && this.state === a.NONE && this._rotateLeft(this._getAutoRotationAngle(t)), this.enableDamping ? (this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor, this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor) : (this._spherical.theta += this._sphericalDelta.theta, this._spherical.phi += this._sphericalDelta.phi);
    let i = this.minAzimuthAngle, o = this.maxAzimuthAngle;
    isFinite(i) && isFinite(o) && (i < -Math.PI ? i += u : i > Math.PI && (i -= u), o < -Math.PI ? o += u : o > Math.PI && (o -= u), i <= o ? this._spherical.theta = Math.max(i, Math.min(o, this._spherical.theta)) : this._spherical.theta = this._spherical.theta > (i + o) / 2 ? Math.max(i, this._spherical.theta) : Math.min(o, this._spherical.theta)), this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi)), this._spherical.makeSafe(), this.enableDamping === !0 ? this.target.addScaledVector(this._panOffset, this.dampingFactor) : this.target.add(this._panOffset), this.target.sub(this.cursor), this.target.clampLength(this.minTargetRadius, this.maxTargetRadius), this.target.add(this.cursor);
    let n = !1;
    if (this.zoomToCursor && this._performCursorZoom || this.object.isOrthographicCamera)
      this._spherical.radius = this._clampDistance(this._spherical.radius);
    else {
      const r = this._spherical.radius;
      this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale), n = r != this._spherical.radius;
    }
    if (c.setFromSpherical(this._spherical), c.applyQuaternion(this._quatInverse), e.copy(this.target).add(c), this.object.lookAt(this.target), this.enableDamping === !0 ? (this._sphericalDelta.theta *= 1 - this.dampingFactor, this._sphericalDelta.phi *= 1 - this.dampingFactor, this._panOffset.multiplyScalar(1 - this.dampingFactor)) : (this._sphericalDelta.set(0, 0, 0), this._panOffset.set(0, 0, 0)), this.zoomToCursor && this._performCursorZoom) {
      let r = null;
      if (this.object.isPerspectiveCamera) {
        const l = c.length();
        r = this._clampDistance(l * this._scale);
        const d = l - r;
        this.object.position.addScaledVector(this._dollyDirection, d), this.object.updateMatrixWorld(), n = !!d;
      } else if (this.object.isOrthographicCamera) {
        const l = new m(this._mouse.x, this._mouse.y, 0);
        l.unproject(this.object);
        const d = this.object.zoom;
        this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), this.object.updateProjectionMatrix(), n = d !== this.object.zoom;
        const h = new m(this._mouse.x, this._mouse.y, 0);
        h.unproject(this.object), this.object.position.sub(h).add(l), this.object.updateMatrixWorld(), r = c.length();
      } else
        console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."), this.zoomToCursor = !1;
      r !== null && (this.screenSpacePanning ? this.target.set(0, 0, -1).transformDirection(this.object.matrix).multiplyScalar(r).add(this.object.position) : (S.origin.copy(this.object.position), S.direction.set(0, 0, -1).transformDirection(this.object.matrix), Math.abs(this.object.up.dot(S.direction)) < tt ? this.object.lookAt(this.target) : (Z.setFromNormalAndCoplanarPoint(this.object.up, this.target), S.intersectPlane(Z, this.target))));
    } else if (this.object.isOrthographicCamera) {
      const r = this.object.zoom;
      this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), r !== this.object.zoom && (this.object.updateProjectionMatrix(), n = !0);
    }
    return this._scale = 1, this._performCursorZoom = !1, n || this._lastPosition.distanceToSquared(this.object.position) > R || 8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > R || this._lastTargetPosition.distanceToSquared(this.target) > R ? (this.dispatchEvent(z), this._lastPosition.copy(this.object.position), this._lastQuaternion.copy(this.object.quaternion), this._lastTargetPosition.copy(this.target), !0) : !1;
  }
  _getAutoRotationAngle(t) {
    return t !== null ? u / 60 * this.autoRotateSpeed * t : u / 60 / 60 * this.autoRotateSpeed;
  }
  _getZoomScale(t) {
    const e = Math.abs(t * 0.01);
    return Math.pow(0.95, this.zoomSpeed * e);
  }
  _rotateLeft(t) {
    this._sphericalDelta.theta -= t;
  }
  _rotateUp(t) {
    this._sphericalDelta.phi -= t;
  }
  _panLeft(t, e) {
    c.setFromMatrixColumn(e, 0), c.multiplyScalar(-t), this._panOffset.add(c);
  }
  _panUp(t, e) {
    this.screenSpacePanning === !0 ? c.setFromMatrixColumn(e, 1) : (c.setFromMatrixColumn(e, 0), c.crossVectors(this.object.up, c)), c.multiplyScalar(t), this._panOffset.add(c);
  }
  // deltaX and deltaY are in pixels; right and down are positive
  _pan(t, e) {
    const i = this.domElement;
    if (this.object.isPerspectiveCamera) {
      const o = this.object.position;
      c.copy(o).sub(this.target);
      let n = c.length();
      n *= Math.tan(this.object.fov / 2 * Math.PI / 180), this._panLeft(2 * t * n / i.clientHeight, this.object.matrix), this._panUp(2 * e * n / i.clientHeight, this.object.matrix);
    } else this.object.isOrthographicCamera ? (this._panLeft(t * (this.object.right - this.object.left) / this.object.zoom / i.clientWidth, this.object.matrix), this._panUp(e * (this.object.top - this.object.bottom) / this.object.zoom / i.clientHeight, this.object.matrix)) : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."), this.enablePan = !1);
  }
  _dollyOut(t) {
    this.object.isPerspectiveCamera || this.object.isOrthographicCamera ? this._scale /= t : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), this.enableZoom = !1);
  }
  _dollyIn(t) {
    this.object.isPerspectiveCamera || this.object.isOrthographicCamera ? this._scale *= t : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), this.enableZoom = !1);
  }
  _updateZoomParameters(t, e) {
    if (!this.zoomToCursor)
      return;
    this._performCursorZoom = !0;
    const i = this.domElement.getBoundingClientRect(), o = t - i.left, n = e - i.top, r = i.width, l = i.height;
    this._mouse.x = o / r * 2 - 1, this._mouse.y = -(n / l) * 2 + 1, this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object).sub(this.object.position).normalize();
  }
  _clampDistance(t) {
    return Math.max(this.minDistance, Math.min(this.maxDistance, t));
  }
  //
  // event callbacks - update the object state
  //
  _handleMouseDownRotate(t) {
    this._rotateStart.set(t.clientX, t.clientY);
  }
  _handleMouseDownDolly(t) {
    this._updateZoomParameters(t.clientX, t.clientX), this._dollyStart.set(t.clientX, t.clientY);
  }
  _handleMouseDownPan(t) {
    this._panStart.set(t.clientX, t.clientY);
  }
  _handleMouseMoveRotate(t) {
    this._rotateEnd.set(t.clientX, t.clientY), this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const e = this.domElement;
    this._rotateLeft(u * this._rotateDelta.x / e.clientHeight), this._rotateUp(u * this._rotateDelta.y / e.clientHeight), this._rotateStart.copy(this._rotateEnd), this.update();
  }
  _handleMouseMoveDolly(t) {
    this._dollyEnd.set(t.clientX, t.clientY), this._dollyDelta.subVectors(this._dollyEnd, this._dollyStart), this._dollyDelta.y > 0 ? this._dollyOut(this._getZoomScale(this._dollyDelta.y)) : this._dollyDelta.y < 0 && this._dollyIn(this._getZoomScale(this._dollyDelta.y)), this._dollyStart.copy(this._dollyEnd), this.update();
  }
  _handleMouseMovePan(t) {
    this._panEnd.set(t.clientX, t.clientY), this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd), this.update();
  }
  _handleMouseWheel(t) {
    this._updateZoomParameters(t.clientX, t.clientY), t.deltaY < 0 ? this._dollyIn(this._getZoomScale(t.deltaY)) : t.deltaY > 0 && this._dollyOut(this._getZoomScale(t.deltaY)), this.update();
  }
  _handleKeyDown(t) {
    let e = !1;
    switch (t.code) {
      case this.keys.UP:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateUp(u * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, this.keyPanSpeed), e = !0;
        break;
      case this.keys.BOTTOM:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateUp(-u * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, -this.keyPanSpeed), e = !0;
        break;
      case this.keys.LEFT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateLeft(u * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(this.keyPanSpeed, 0), e = !0;
        break;
      case this.keys.RIGHT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateLeft(-u * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(-this.keyPanSpeed, 0), e = !0;
        break;
    }
    e && (t.preventDefault(), this.update());
  }
  _handleTouchStartRotate(t) {
    if (this._pointers.length === 1)
      this._rotateStart.set(t.pageX, t.pageY);
    else {
      const e = this._getSecondPointerPosition(t), i = 0.5 * (t.pageX + e.x), o = 0.5 * (t.pageY + e.y);
      this._rotateStart.set(i, o);
    }
  }
  _handleTouchStartPan(t) {
    if (this._pointers.length === 1)
      this._panStart.set(t.pageX, t.pageY);
    else {
      const e = this._getSecondPointerPosition(t), i = 0.5 * (t.pageX + e.x), o = 0.5 * (t.pageY + e.y);
      this._panStart.set(i, o);
    }
  }
  _handleTouchStartDolly(t) {
    const e = this._getSecondPointerPosition(t), i = t.pageX - e.x, o = t.pageY - e.y, n = Math.sqrt(i * i + o * o);
    this._dollyStart.set(0, n);
  }
  _handleTouchStartDollyPan(t) {
    this.enableZoom && this._handleTouchStartDolly(t), this.enablePan && this._handleTouchStartPan(t);
  }
  _handleTouchStartDollyRotate(t) {
    this.enableZoom && this._handleTouchStartDolly(t), this.enableRotate && this._handleTouchStartRotate(t);
  }
  _handleTouchMoveRotate(t) {
    if (this._pointers.length == 1)
      this._rotateEnd.set(t.pageX, t.pageY);
    else {
      const i = this._getSecondPointerPosition(t), o = 0.5 * (t.pageX + i.x), n = 0.5 * (t.pageY + i.y);
      this._rotateEnd.set(o, n);
    }
    this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const e = this.domElement;
    this._rotateLeft(u * this._rotateDelta.x / e.clientHeight), this._rotateUp(u * this._rotateDelta.y / e.clientHeight), this._rotateStart.copy(this._rotateEnd);
  }
  _handleTouchMovePan(t) {
    if (this._pointers.length === 1)
      this._panEnd.set(t.pageX, t.pageY);
    else {
      const e = this._getSecondPointerPosition(t), i = 0.5 * (t.pageX + e.x), o = 0.5 * (t.pageY + e.y);
      this._panEnd.set(i, o);
    }
    this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd);
  }
  _handleTouchMoveDolly(t) {
    const e = this._getSecondPointerPosition(t), i = t.pageX - e.x, o = t.pageY - e.y, n = Math.sqrt(i * i + o * o);
    this._dollyEnd.set(0, n), this._dollyDelta.set(0, Math.pow(this._dollyEnd.y / this._dollyStart.y, this.zoomSpeed)), this._dollyOut(this._dollyDelta.y), this._dollyStart.copy(this._dollyEnd);
    const r = (t.pageX + e.x) * 0.5, l = (t.pageY + e.y) * 0.5;
    this._updateZoomParameters(r, l);
  }
  _handleTouchMoveDollyPan(t) {
    this.enableZoom && this._handleTouchMoveDolly(t), this.enablePan && this._handleTouchMovePan(t);
  }
  _handleTouchMoveDollyRotate(t) {
    this.enableZoom && this._handleTouchMoveDolly(t), this.enableRotate && this._handleTouchMoveRotate(t);
  }
  // pointers
  _addPointer(t) {
    this._pointers.push(t.pointerId);
  }
  _removePointer(t) {
    delete this._pointerPositions[t.pointerId];
    for (let e = 0; e < this._pointers.length; e++)
      if (this._pointers[e] == t.pointerId) {
        this._pointers.splice(e, 1);
        return;
      }
  }
  _isTrackingPointer(t) {
    for (let e = 0; e < this._pointers.length; e++)
      if (this._pointers[e] == t.pointerId) return !0;
    return !1;
  }
  _trackPointer(t) {
    let e = this._pointerPositions[t.pointerId];
    e === void 0 && (e = new _(), this._pointerPositions[t.pointerId] = e), e.set(t.pageX, t.pageY);
  }
  _getSecondPointerPosition(t) {
    const e = t.pointerId === this._pointers[0] ? this._pointers[1] : this._pointers[0];
    return this._pointerPositions[e];
  }
  //
  _customWheelEvent(t) {
    const e = t.deltaMode, i = {
      clientX: t.clientX,
      clientY: t.clientY,
      deltaY: t.deltaY
    };
    switch (e) {
      case 1:
        i.deltaY *= 16;
        break;
      case 2:
        i.deltaY *= 100;
        break;
    }
    return t.ctrlKey && !this._controlActive && (i.deltaY *= 10), i;
  }
}
function st(s) {
  this.enabled !== !1 && (this._pointers.length === 0 && (this.domElement.setPointerCapture(s.pointerId), this.domElement.addEventListener("pointermove", this._onPointerMove), this.domElement.addEventListener("pointerup", this._onPointerUp)), !this._isTrackingPointer(s) && (this._addPointer(s), s.pointerType === "touch" ? this._onTouchStart(s) : this._onMouseDown(s)));
}
function it(s) {
  this.enabled !== !1 && (s.pointerType === "touch" ? this._onTouchMove(s) : this._onMouseMove(s));
}
function ot(s) {
  switch (this._removePointer(s), this._pointers.length) {
    case 0:
      this.domElement.releasePointerCapture(s.pointerId), this.domElement.removeEventListener("pointermove", this._onPointerMove), this.domElement.removeEventListener("pointerup", this._onPointerUp), this.dispatchEvent(X), this.state = a.NONE;
      break;
    case 1:
      const t = this._pointers[0], e = this._pointerPositions[t];
      this._onTouchStart({ pointerId: t, pageX: e.x, pageY: e.y });
      break;
  }
}
function nt(s) {
  let t;
  switch (s.button) {
    case 0:
      t = this.mouseButtons.LEFT;
      break;
    case 1:
      t = this.mouseButtons.MIDDLE;
      break;
    case 2:
      t = this.mouseButtons.RIGHT;
      break;
    default:
      t = -1;
  }
  switch (t) {
    case g.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseDownDolly(s), this.state = a.DOLLY;
      break;
    case g.ROTATE:
      if (s.ctrlKey || s.metaKey || s.shiftKey) {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(s), this.state = a.PAN;
      } else {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(s), this.state = a.ROTATE;
      }
      break;
    case g.PAN:
      if (s.ctrlKey || s.metaKey || s.shiftKey) {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(s), this.state = a.ROTATE;
      } else {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(s), this.state = a.PAN;
      }
      break;
    default:
      this.state = a.NONE;
  }
  this.state !== a.NONE && this.dispatchEvent(x);
}
function at(s) {
  switch (this.state) {
    case a.ROTATE:
      if (this.enableRotate === !1) return;
      this._handleMouseMoveRotate(s);
      break;
    case a.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseMoveDolly(s);
      break;
    case a.PAN:
      if (this.enablePan === !1) return;
      this._handleMouseMovePan(s);
      break;
  }
}
function ht(s) {
  this.enabled === !1 || this.enableZoom === !1 || this.state !== a.NONE || (s.preventDefault(), this.dispatchEvent(x), this._handleMouseWheel(this._customWheelEvent(s)), this.dispatchEvent(X));
}
function rt(s) {
  this.enabled !== !1 && this._handleKeyDown(s);
}
function lt(s) {
  switch (this._trackPointer(s), this._pointers.length) {
    case 1:
      switch (this.touches.ONE) {
        case b.ROTATE:
          if (this.enableRotate === !1) return;
          this._handleTouchStartRotate(s), this.state = a.TOUCH_ROTATE;
          break;
        case b.PAN:
          if (this.enablePan === !1) return;
          this._handleTouchStartPan(s), this.state = a.TOUCH_PAN;
          break;
        default:
          this.state = a.NONE;
      }
      break;
    case 2:
      switch (this.touches.TWO) {
        case b.DOLLY_PAN:
          if (this.enableZoom === !1 && this.enablePan === !1) return;
          this._handleTouchStartDollyPan(s), this.state = a.TOUCH_DOLLY_PAN;
          break;
        case b.DOLLY_ROTATE:
          if (this.enableZoom === !1 && this.enableRotate === !1) return;
          this._handleTouchStartDollyRotate(s), this.state = a.TOUCH_DOLLY_ROTATE;
          break;
        default:
          this.state = a.NONE;
      }
      break;
    default:
      this.state = a.NONE;
  }
  this.state !== a.NONE && this.dispatchEvent(x);
}
function ct(s) {
  switch (this._trackPointer(s), this.state) {
    case a.TOUCH_ROTATE:
      if (this.enableRotate === !1) return;
      this._handleTouchMoveRotate(s), this.update();
      break;
    case a.TOUCH_PAN:
      if (this.enablePan === !1) return;
      this._handleTouchMovePan(s), this.update();
      break;
    case a.TOUCH_DOLLY_PAN:
      if (this.enableZoom === !1 && this.enablePan === !1) return;
      this._handleTouchMoveDollyPan(s), this.update();
      break;
    case a.TOUCH_DOLLY_ROTATE:
      if (this.enableZoom === !1 && this.enableRotate === !1) return;
      this._handleTouchMoveDollyRotate(s), this.update();
      break;
    default:
      this.state = a.NONE;
  }
}
function dt(s) {
  this.enabled !== !1 && s.preventDefault();
}
function pt(s) {
  s.key === "Control" && (this._controlActive = !0, this.domElement.getRootNode().addEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function ut(s) {
  s.key === "Control" && (this._controlActive = !1, this.domElement.getRootNode().removeEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
const _t = "26.1-pre-3", F = `https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/${_t}/assets/minecraft`, K = {
  views: [],
  renderer: null,
  canvas: null,
  init() {
    this.renderer || (this.canvas = document.createElement("canvas"), this.canvas.style.position = "fixed", this.canvas.style.top = "0", this.canvas.style.left = "0", this.canvas.style.width = "100vw", this.canvas.style.height = "100vh", this.canvas.style.pointerEvents = "none", this.canvas.style.zIndex = "-1", document.body.appendChild(this.canvas), this.renderer = new p.WebGLRenderer({ canvas: this.canvas, antialias: !0, alpha: !0 }), this.renderer.setPixelRatio(window.devicePixelRatio), this.renderer.setScissorTest(!0), this.animate(), window.addEventListener("scroll", () => {
      this.render();
    }, { passive: !0 }), window.addEventListener("resize", () => {
      this.render();
    }, { passive: !0 }));
  },
  animate() {
    requestAnimationFrame(() => this.animate()), this.render();
  },
  render() {
    const s = window.innerWidth, t = window.innerHeight;
    (this.canvas.width !== s || this.canvas.height !== t) && this.renderer.setSize(s, t, !1), this.renderer.clear(), this.views.forEach((e) => {
      const i = e.container.getBoundingClientRect();
      if (i.bottom < 0 || i.top > t || i.right < 0 || i.left > s) return;
      const o = t - i.bottom, n = i.left;
      this.renderer.setViewport(n, o, i.width, i.height), this.renderer.setScissor(n, o, i.width, i.height), e.controls.update(), this.renderer.render(e.scene, e.camera);
    });
  }
};
function yt(s, t = 8900331) {
  K.init();
  const e = document.getElementById(s), i = new p.Scene();
  i.background = new p.Color(t);
  const o = new p.PerspectiveCamera(60, e.clientWidth / e.clientHeight, 0.1, 1e3);
  o.position.set(-2, 1.5, 2);
  const n = new et(o, e);
  n.enableDamping = !0;
  const r = new p.AmbientLight(16777215, 0.7);
  i.add(r);
  const l = new p.DirectionalLight(16777215, 0.8);
  l.position.set(5, 10, 5), i.add(l);
  const d = { container: e, scene: i, camera: o, controls: n };
  return K.views.push(d), d;
}
function H(s) {
  return new Promise((t) => {
    const e = new p.TextureLoader();
    e.setCrossOrigin("anonymous"), e.load(
      s,
      (i) => {
        i.magFilter = p.NearestFilter, i.minFilter = p.NearestFilter, i.colorSpace = p.SRGBColorSpace, t(i);
      },
      void 0,
      (i) => {
        console.warn(`텍스처를 불러올 수 없습니다: ${s}`), t(null);
      }
    );
  });
}
function W(s) {
  return s.includes(":") ? s.split(":")[1] : s;
}
async function mt(s, t) {
  let e = s, i = e.elements || null, o = { ...e.textures };
  for (; e.parent; ) {
    const n = W(e.parent);
    if (n.startsWith("builtin/")) break;
    const r = `${t}/models/${n}.json`, l = `${F}/models/${n}.json`;
    try {
      let d = await fetch(r);
      if (d.ok || (console.warn(`부모 모델 로드 실패, fallback 시도: ${l}`), d = await fetch(l)), !d.ok) throw new Error("Parent Model Fetch Failed");
      const h = await d.json();
      o = { ...h.textures, ...o }, !i && h.elements && (i = h.elements), e = h;
    } catch {
      console.warn(`부모 모델을 불러오는 중 오류 발생: ${r} / ${l}`);
      break;
    }
  }
  for (let n in o) {
    let r = 10;
    for (; o[n] && o[n].startsWith("#") && r > 0; ) {
      const l = o[n].substring(1);
      o[n] = o[l], r--;
    }
  }
  return {
    elements: i || [],
    textures: o
  };
}
async function bt(s) {
  const e = await (await fetch(s)).json(), i = s.split("/models")[0], { elements: o, textures: n } = await mt(e, i), r = {}, l = [];
  for (const [h, E] of Object.entries(n))
    if (E && !E.startsWith("#")) {
      const w = W(E), O = `${i}/textures/${w}.png`, D = `${F}/textures/${w}.png`;
      l.push(
        H(O).then((f) => f || (console.warn(`기본 텍스처 로드 실패, fallback 시도: ${D}`), H(D))).then((f) => {
          r[h] = f;
        })
      );
    }
  await Promise.all(l);
  const d = new p.Group();
  return o.forEach((h, E) => {
    const w = E * 1e-4, O = (h.to[0] - h.from[0]) / 16, D = (h.to[1] - h.from[1]) / 16, f = (h.to[2] - h.from[2]) / 16, L = new p.BoxGeometry(O, D, f), T = [], B = ["east", "west", "up", "down", "south", "north"], P = L.attributes.uv;
    B.forEach((k, V) => {
      if (h.faces && h.faces[k]) {
        const y = h.faces[k], G = y.texture.replace("#", ""), j = r[G];
        if (j) {
          if (T.push(new p.MeshLambertMaterial({
            map: j,
            transparent: !0,
            alphaTest: 0.1
          })), y.uv) {
            const C = y.uv[0] / 16, v = 1 - y.uv[1] / 16, N = y.uv[2] / 16, Y = 1 - y.uv[3] / 16, M = V * 4;
            P.setXY(M + 0, C, v), P.setXY(M + 1, N, v), P.setXY(M + 2, C, Y), P.setXY(M + 3, N, Y);
          }
        } else
          T.push(new p.MeshBasicMaterial({ color: 16711935 }));
      } else
        T.push(new p.MeshBasicMaterial({ visible: !1 }));
    }), P.needsUpdate = !0;
    const A = new p.Mesh(L, T);
    A.position.set(
      (h.from[0] + h.to[0]) / 32 - 0.5,
      (h.from[1] + h.to[1]) / 32 - 0.5 + w,
      (h.from[2] + h.to[2]) / 32 - 0.5
    ), d.add(A);
  }), d;
}
export {
  bt as createMinecraftBlockMesh,
  yt as initScene
};
