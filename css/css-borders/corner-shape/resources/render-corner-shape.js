class Vector2D {
  /** @type {number} */
  x;
  /** @type {number} */
  y;
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   *
   * @param {number} s
   * @returns {Vector2D}
   */
  scale(s) {
    return new Vector2D(this.x * s, this.y * s);
  }

  length() {
    return Math.hypot(this.x, this.y);
  }

  normalized() {
    const length = this.length();
    return length ? this.scale(1 / length) : this;
  }

  perpendicular() {
    return new Vector2D(-this.y, this.x);
  }

  /**
   *
   * @param {Vector2D} v1
   * @param {Vector2D} v2
   *
   * @returns {number}
   */
  static crossLength(v1, v2) {
    return v1.x * v2.y - v1.y * v2.x;
  }

  /**
   *
   * @param {DOMPointReadOnly} p1
   * @param {DOMPointReadOnly} p2
   * @returns {Vector2D}
   */
  static fromPoints(p1, p2) {
    return new Vector2D(p2.x - p1.x, p2.y - p1.y);
  }

  /**
   *
   * @param  {...Vector2D} v
   * @returns {Vector2D}
   */
  static concat(...v) {
    return new Vector2D(
      v.reduce((acc, v) => acc + v.x, 0), v.reduce((acc, v) => acc + v.y, 0));
  }
}

/**
 *
 * @param {DOMPointReadOnly} point
 * @param  {...Vector2D} vectors
 *
 * @return {DOMPointReadOnly}
 */
function extend_point(point, ...vectors) {
  const vector = Vector2D.concat(...vectors);
  return new DOMPointReadOnly(point.x + vector.x, point.y + vector.y);
}

/**
 * Calculates the intersection point of two infinite lines.
 *
 * @param {[DOMPointReadOnly, DOMPointReadOnly]} lineA - The first line [A0, A1].
 * @param {[DOMPointReadOnly, DOMPointReadOnly]} lineB - The second line [B0, B1].
 * @returns {DOMPointReadOnly|null} The intersection point, or null
 */
function lineIntersection([a0, a1], [b0, b1]) {
  const a_length = Vector2D.fromPoints(a0, a1);
  const b_length = Vector2D.fromPoints(b0, b1);
  const denom = Vector2D.crossLength(a_length, b_length);
  if (Math.abs(denom) < 1e-6) {
    return null;
  }

  const a_scale = Vector2D.crossLength(Vector2D.fromPoints(a0, b0), b_length) / denom;
  return extend_point(a0, a_length.scale(a_scale));
}

/**
 * Calculates the intersection point between a finite segment and an infinite line.
 * Checks both cases: segment-line and line-segment.
 *
 * @param {[DOMPointReadOnly, DOMPointReadOnly]} lineA - The first line [A0, A1].
 * @param {[DOMPointReadOnly, DOMPointReadOnly]} lineB - The second line [B0, B1].
 * @returns {DOMPointReadOnly|null} The intersection point, or null
 */
function segmentLineIntersection([a0, a1], [b0, b1]) {
  const a_length = Vector2D.fromPoints(a0, a1);
  const b_length = Vector2D.fromPoints(b0, b1);

  const denom = Vector2D.crossLength(a_length, b_length);
  if (Math.abs(denom) < 1e-6) {
    return null;
  }

  const offset = Vector2D.fromPoints(a0, b0);
  const inv_denom = 1 / denom;

  const a_scale = Vector2D.crossLength(offset, b_length) * inv_denom;
  if (a_scale >= 0 && a_scale <= 1) {
    return extend_point(a0, a_length.scale(a_scale));
  }

  const b_scale = Vector2D.crossLength(offset, a_length) * inv_denom;
  if (b_scale >= 0 && b_scale <= 1) {
    return extend_point(b0, b_length.scale(b_scale));
  }

  return null;
}

function adjusted_radius_dimension(coverage, radius, outset) {
  if (radius > outset || coverage > 1) {
    return radius + outset;
  }
  const ratio = radius / outset;
  return radius + outset * (1 - (1 - ratio) ** 3 * (1 - coverage ** 3));
}

function outset_adjusted_border_radius(width, height, radius, outset_x, outset_y) {
  const coverage = 2 * Math.min(radius[0] / width, radius[1] / height);
  const adjusted_radius = [
    adjusted_radius_dimension(coverage, radius[0], outset_x),
    adjusted_radius_dimension(coverage, radius[1], outset_y)
  ];
  return adjusted_radius;
}

/**
 * @param {number} superellipse_param
 */
function normalized_superellipse_half_corner(superellipse_param) {
  const n = Math.pow(2, Math.abs(superellipse_param));
  const convexHalfCorner = Math.pow(0.5, 1 / n);
  if (superellipse_param < 0) return 1 - convexHalfCorner;
  return convexHalfCorner;
}

/**
 * @param {number} startRadius
 * @param {number} endRadius
 * @param {number} startInset
 * @param {number} endInset
 * @param {DOMPointReadOnly} targetOuter
 * @param {Vector2D} normalizedV3
 * @param {Vector2D} normalizedV2
 * @param {number} superellipse_param
 * @param {"fill" | "stroke"} mode
 */
function corner_clip_out_path(startRadius, endRadius, startInset, endInset,
  targetOuter, normalizedV3, normalizedV2,
  superellipse_param, mode = 'fill') {
  if (!startRadius || !endRadius || superellipse_param === Infinity)
    return new Path2D();

  const originalOuter = extend_point(targetOuter, normalizedV3.scale(-endInset),
    normalizedV2.scale(-startInset));
  const originalStart = extend_point(originalOuter, normalizedV3.scale(endRadius));
  const originalEnd = extend_point(originalOuter, normalizedV2.scale(startRadius));
  const originalCenter = extend_point(originalOuter, normalizedV3.scale(endRadius),
    normalizedV2.scale(startRadius));

  const map_point_to_corner = (x, y, start, end, center) =>
    extend_point(center, Vector2D.fromPoints(center, end).scale(x),
      Vector2D.fromPoints(center, start).scale(y));

  const add_curve = (path, start, outer, end, center) => {
    path.lineTo(start.x, start.y);
    if (superellipse_param == -Infinity) {
      path.lineTo(center.x, center.y);
      path.lineTo(end.x, end.y);
      return;
    }

    const n = Math.pow(2, Math.abs(superellipse_param));
    const curveCenter = superellipse_param < 0 ? outer : center;
    const t_set = new Set([0, 1]);

    const denom = Math.log(1 / n);
    for (let x = Math.min(start.x, end.x); x < Math.max(start.x, end.x); x++) {
      const t = Math.log((x - start.x) / (end.x - start.x)) / denom;
      if (t > 0 && t < 1)
        t_set.add(t);
    }
    for (let y = Math.min(start.y, end.y); y < Math.max(start.y, end.y); y++) {
      const t = Math.log(1 - (y - start.y) / (end.y - start.y)) / denom;
      if (t > 0 && t < 1)
        t_set.add(t);
    }

    for (const t of [...t_set].toSorted((a, b) => a - b)) {
      const x = Math.pow(t, 1 / n);
      const y = Math.pow(1 - t, 1 / n);
      const point = map_point_to_corner(x, y, start, end, curveCenter);
      path.lineTo(point.x, point.y);
    }
  };

  const path = new Path2D();
  if (!startInset && !endInset) {
    path.moveTo(originalStart.x, originalStart.y);
    add_curve(path, originalStart, originalOuter, originalEnd, originalCenter);
    if (mode === 'fill')
      path.lineTo(targetOuter.x, targetOuter.y);
    return path;
  }

  const clampedK = Math.max(-1, Math.min(1, superellipse_param));
  const halfCornerX = normalized_superellipse_half_corner(clampedK);
  const controlPointX = halfCornerX / (Math.SQRT2 - 1) - 1 / Math.SQRT2;

  const insetDiff =
    Math.max(-startRadius, Math.min(endRadius, endInset - startInset));

  if (superellipse_param <= 0 && (insetDiff == -startRadius || insetDiff == endRadius))
    return new Path2D();

  let startControlPointX = controlPointX;
  let endControlPointX = controlPointX;
  if (insetDiff != 0) {
    const bevelNormalDelta = Math.sqrt(startRadius ** 2 + endRadius ** 2 + insetDiff ** 2);
    const bevelNormalX = endRadius * insetDiff + startRadius * bevelNormalDelta;
    const bevelNormalY = -startRadius * insetDiff + endRadius * bevelNormalDelta;

    const bevelControlPointX = startRadius * bevelNormalY / (startRadius * bevelNormalY + endRadius * bevelNormalX);
    if (superellipse_param < 0)
      startControlPointX = bevelControlPointX * (2 * controlPointX);
    else
      startControlPointX = 1 - (1 - bevelControlPointX) * (2 * (1 - controlPointX));
    endControlPointX = 2 * controlPointX - startControlPointX;
  }

  const unmappedStartNormal = new Vector2D((1 - startControlPointX) * startRadius, startControlPointX * endRadius).normalized();
  const unmappedEndNormal = new Vector2D(endControlPointX * startRadius, (1 - endControlPointX) * endRadius).normalized();
  const offsetStartV3 = normalizedV3.scale(unmappedStartNormal.x * startInset);
  const offsetStartV2 = normalizedV2.scale(unmappedStartNormal.y * startInset);
  const offsetEndV3 = normalizedV3.scale(unmappedEndNormal.x * endInset);
  const offsetEndV2 = normalizedV2.scale(unmappedEndNormal.y * endInset);

  const adjustedStart = extend_point(originalStart, offsetStartV3, offsetStartV2);
  const adjustedOuter = extend_point(originalOuter, offsetEndV3, offsetStartV2);
  const adjustedEnd = extend_point(originalEnd, offsetEndV3, offsetEndV2);
  const adjustedCenter = extend_point(originalCenter, offsetStartV3, offsetEndV2);

  if ((startInset >= 0 && endInset >= 0) || superellipse_param >= 1) {
    path.moveTo(adjustedStart.x, adjustedStart.y);
    add_curve(path, adjustedStart, adjustedOuter, adjustedEnd, adjustedCenter);
    if (mode === 'fill')
      path.lineTo(targetOuter.x, targetOuter.y);
    return path;
  }

  const clipStart = extend_point(targetOuter, normalizedV3);
  const clipEnd = extend_point(targetOuter, normalizedV2);
  let miterStart = adjustedStart;
  let miterEnd = adjustedEnd;
  if (superellipse_param >= 0) {
    const controlPoint =
      map_point_to_corner(controlPointX, controlPointX,
        adjustedStart, adjustedEnd, adjustedCenter);

    if (startInset < 0) {
      miterStart = lineIntersection([adjustedStart, controlPoint], [clipStart, targetOuter])
        || adjustedStart;
    }

    if (endInset < 0) {
      miterEnd = lineIntersection([adjustedEnd, controlPoint], [clipEnd, targetOuter])
        || adjustedEnd;
    }
  } else {
    const startTangent =
      Vector2D.concat(offsetStartV3, offsetStartV2).perpendicular().scale(-1);
    const endTangent =
      Vector2D.concat(offsetEndV3, offsetEndV2).perpendicular();

    if (startInset < 0)
      miterStart = lineIntersection(
        [adjustedStart, extend_point(adjustedStart, startTangent)], [clipStart, targetOuter])
        || adjustedStart;

    if (endInset < 0)
      miterEnd = lineIntersection([adjustedEnd, extend_point(adjustedEnd, endTangent)], [clipEnd, targetOuter])
        || adjustedEnd;
  }

  path.moveTo(miterStart.x, miterStart.y);

  let miterIntersection = null;
  if (superellipse_param < 0 && startInset < 0 && endInset < 0 &&
    (-endInset >= startRadius || -startInset >= endRadius)) {
    miterIntersection = segmentLineIntersection([miterStart, adjustedStart], [miterEnd, adjustedEnd]);
  }

  if (miterIntersection)
    path.lineTo(miterIntersection.x, miterIntersection.y);
  else
    add_curve(path, adjustedStart, adjustedOuter, adjustedEnd, adjustedCenter);

  path.lineTo(miterEnd.x, miterEnd.y);

  if (mode === 'fill')
    path.lineTo(targetOuter.x, targetOuter.y);
  return path;
}

/**
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} style
 * @param {DOMRectReadOnly} borderEdge
 * @param {{left: number, top: number, right: number, bottom: number}} inset
 * @param {"fill" | "stroke"} mode
 */
function draw_contoured_path(
  ctx, style, borderEdge, inset = {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0
  },
  mode = 'fill') {
  const targetEdge = new DOMRectReadOnly(
    borderEdge.left + inset.left, borderEdge.top + inset.top,
    borderEdge.width - inset.left - inset.right,
    borderEdge.height - inset.top - inset.bottom);

  const topRightRadius = style['border-top-right-radius'];
  const bottomRightRadius = style['border-bottom-right-radius'];
  const bottomLeftRadius = style['border-bottom-left-radius'];
  const topLeftRadius = style['border-top-left-radius'];

  function adjusted_inset(width, height, radius, inset_x, inset_y) {
    const adjusted_radius = outset_adjusted_border_radius(width, height, radius, -inset_x, -inset_y);
    return [radius[0] - adjusted_radius[0], radius[1] - adjusted_radius[1]];
  }

  const topRightInset = adjusted_inset(borderEdge.width, borderEdge.height,
    topRightRadius, inset.right, inset.top);
  const bottomRightInset = adjusted_inset(borderEdge.width, borderEdge.height,
    bottomRightRadius, inset.right, inset.bottom);
  const bottomLeftInset = adjusted_inset(borderEdge.width, borderEdge.height,
    bottomLeftRadius, inset.left, inset.bottom);
  const topLeftInset = adjusted_inset(borderEdge.width, borderEdge.height,
    topLeftRadius, inset.left, inset.top);

  function add_corner(path) {
    if (!path)
      return;
    const targetRectPath = new Path2D();
    targetRectPath.rect(
      targetEdge.x, targetEdge.y, targetEdge.width, targetEdge.height);

    if (mode === 'fill' || mode === 'clip-fill') {
      targetRectPath.addPath(path);
      ctx.clip(targetRectPath, 'evenodd');
    } else if (mode === 'stroke') {
      ctx.clip(targetRectPath, 'evenodd');
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 3;
      ctx.stroke(path);
    } else if (mode === 'clip-stroke') {
      targetRectPath.addPath(path);
      ctx.strokeStyle = 'green';
      ctx.lineWidth = 3;
      ctx.stroke(targetRectPath);
    }
  };

  ctx.save();
  const cornerMode = mode.endsWith('fill') ? 'fill' : 'stroke';
  add_corner(corner_clip_out_path(
    topRightRadius[1], topRightRadius[0], topRightInset[1], topRightInset[0],
    new DOMPoint(targetEdge.right, targetEdge.top), new Vector2D(-1, 0),
    new Vector2D(0, 1), style['corner-top-right-shape'], cornerMode));
  add_corner(corner_clip_out_path(
    bottomRightRadius[0], bottomRightRadius[1], bottomRightInset[0],
    bottomRightInset[1], new DOMPoint(targetEdge.right, targetEdge.bottom),
    new Vector2D(0, -1), new Vector2D(-1, 0),
    style['corner-bottom-right-shape'], cornerMode));
  add_corner(corner_clip_out_path(
    bottomLeftRadius[1], bottomLeftRadius[0], bottomLeftInset[1],
    bottomLeftInset[0], new DOMPoint(targetEdge.left, targetEdge.bottom),
    new Vector2D(1, 0), new Vector2D(0, -1),
    style['corner-bottom-left-shape'], cornerMode));
  add_corner(corner_clip_out_path(
    topLeftRadius[0], topLeftRadius[1], topLeftInset[0], topLeftInset[1],
    new DOMPoint(targetEdge.left, targetEdge.top), new Vector2D(0, 1),
    new Vector2D(1, 0), style['corner-top-left-shape'], cornerMode));

  if (mode === 'fill')
    ctx.fillRect(targetEdge.x, targetEdge.y, targetEdge.width, targetEdge.height);

  if (mode !== 'clip-fill')
    ctx.restore();
}

/**
 *
 * @param {object} style
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 */
function render(style, ctx, width, height, mode = 'fill') {
  const border_rect = new DOMRect(0, 0, width, height);

  if (style['clip-path'] === 'margin-box') {
    draw_contoured_path(ctx, style, border_rect, {
      left: -style['margin-left'],
      top: -style['margin-top'],
      right: -style['margin-right'],
      bottom: -style['margin-bottom']
    },
      `clip-${mode}`);
  }

  const shadow_spread = style['shadow-spread'] || 0;
  const shadow_offset = [style['shadow-offset-x'] || 0, style['shadow-offset-y'] || 0];
  if (shadow_offset[0] || shadow_offset[1] || shadow_spread) {
    ctx.save();
    ctx.translate(...shadow_offset);
    ctx.fillStyle = 'black';
    draw_contoured_path(ctx, style, border_rect, {
      left: -shadow_spread,
      top: -shadow_spread,
      right: -shadow_spread,
      bottom: -shadow_spread
    },
      mode);
    ctx.restore();
  }
  ctx.fillStyle = 'purple';
  draw_contoured_path(
    ctx, style, border_rect, { left: 0, top: 0, right: 0, bottom: 0 }, mode);
  ctx.fillStyle = 'yellow';
  draw_contoured_path(
    ctx, style, border_rect, {
    left: style['border-left-width'],
    top: style['border-top-width'],
    right: style['border-right-width'],
    bottom: style['border-bottom-width']
  },
    mode);
}

const padding = 100;
function create_ref_canvas(style, width, height, mode = 'fill') {
  const canvas = document.createElement('canvas');
  canvas.width = width + padding * 2;
  canvas.height = height + padding * 2;
  const ctx = canvas.getContext('2d');
  ctx.translate(padding, padding);
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  render(style, ctx, width, height, mode);
  return canvas;
}

function create_ref(style, width, height) {
  const div = document.createElement('div');
  div.style.width = width + 'px';
  div.style.height = height + 'px';
  div.style.position = 'relative';
  const fill_canvas = create_ref_canvas(style, width, height, 'fill');
  const stroke_canvas = create_ref_canvas(style, width, height, 'stroke');
  div.appendChild(fill_canvas);
  div.appendChild(stroke_canvas);
  return div;
}

function create_actual(style, width, height) {
  const div = document.createElement('div');
  div.style.width = width + 'px';
  div.style.height = height + 'px';
  div.style.position = 'relative';
  div.style.left = `${padding}px`;
  div.style.top = `${padding}px`;
  for (const prop
    of ['border-top-width', 'border-right-width',
      'border-bottom-width', 'border-left-width']) {
    div.style[prop] = style[prop] + 'px';
  }

  let border_radius = '';
  for (const prop
    of ['border-top-left-radius', 'border-top-right-radius',
      'border-bottom-right-radius', 'border-bottom-left-radius']) {
    border_radius += style[prop][0] + 'px ';
  }
  border_radius += ' / ';
  for (const prop
    of ['border-top-left-radius', 'border-top-right-radius',
      'border-bottom-right-radius', 'border-bottom-left-radius']) {
    border_radius += style[prop][1] + 'px ';
  }

  for (const prop
    of ['margin-top', 'margin-right', 'margin-bottom', 'margin-left']) {
    div.style[prop] = style[prop] + 'px';
  }
  div.style.clipPath = style['clip-path'];

  for (const prop
    of ['corner-top-left-shape', 'corner-top-right-shape',
      'corner-bottom-right-shape', 'corner-bottom-left-shape']) {
    div.style[prop] = `superellipse(${style[prop]})`;
  }

  div.style.boxShadow =
    `${style['shadow-offset-x'] || 0}px ${style['shadow-offset-y'] || 0}px 0px ${style['shadow-spread'] || 0}px black`;

  div.style.borderRadius = border_radius;

  div.style.borderColor = 'purple';
  div.style.borderStyle = 'solid';
  div.style.backgroundColor = 'yellow';
  div.style.boxSizing = 'border-box';
  div.id = 'ref';
  const canvas = create_ref_canvas(style, width, height, 'stroke');

  const article = document.createElement('article');
  article.style.position = 'relative';
  article.appendChild(div);
  article.appendChild(canvas);
  return article;
}

const corner_shape_keywords = new Map([
  ['infinity', Infinity],
  ['-infinity', -Infinity],
  ['square', Infinity],
  ['notch', -Infinity],
  ['scoop', -1],
  ['round', 1],
  ['bevel', 0],
  ['squircle', 2],
]);

/**
 *
 * @param {URLSearchParams} params
 * @param {"ref" | "actual"} mode
 * @returns
 */
function create_element_with_corner_shape(params, mode) {
  const style = Object.fromEntries(params.entries());
  const width = +(params.get('width') || 200);
  const height = +(params.get('height') || 100);
  for (const prop
    of ['border-left-width', 'border-top-width', 'border-bottom-width',
      'border-right-width']) {
    style[prop] = params.has(prop) ? parseFloat(params.get(prop)) :
      params.has('border-width') ? parseFloat(params.get('border-width')) : 0;
  }

  for (const prop
    of ['shadow-spread', 'shadow-offset-x',
      'shadow-offset-y']) {
    style[prop] = params.has(prop) ? parseFloat(params.get(prop)) : 0;
  }

  style['clip-path'] = params.get('clip-path') === 'margin-box' ? 'margin-box' : 'none';
  for (const prop
    of ['margin-left', 'margin-top', 'margin-bottom',
      'margin-right']) {
    style[prop] = params.has(prop) ? parseFloat(params.get(prop)) :
      params.has('margin') ? parseFloat(params.get('margin')) : 0;
  }

  for (const prop
    of ['corner-top-left-shape', 'corner-top-right-shape',
      'corner-bottom-right-shape', 'corner-bottom-left-shape']) {
    const value = params.has(prop) ? params.get(prop) :
      params.has('corner-shape') ? params.get('corner-shape') :
        1;
    style[prop] = corner_shape_keywords.has(value) ?
      corner_shape_keywords.get(value) :
      parseFloat(value);
  }

  for (const prop
    of ['border-top-left-radius', 'border-top-right-radius',
      'border-bottom-right-radius', 'border-bottom-left-radius']) {
    style[prop] = params.has(prop) ? params.get(prop) :
      (params.has('border-radius') ? params.get('border-radius') : '0');
    style[prop] = style[prop].split(',');
    if (style[prop].length === 1) {
      style[prop] = [style[prop][0], style[prop][0]];
    }
    style[prop] = style[prop].map((v, i) => {
      const n = parseFloat(v);
      if (v.endsWith('%')) {
        return (n / 100) * (i ? height : width);
      }
      return n;
    });
  }

  return mode === 'ref' ? create_ref(style, width, height) :
    create_actual(style, width, height);
}
