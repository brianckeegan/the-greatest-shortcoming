package tgs

import org.jetbrains.skia.Canvas

/**
 * Four-way symmetry about (cx, cy). Two kinds, kept deliberately separate:
 *
 *  - [mirror4]  reflections across the vertical and horizontal axes (dihedral, D2).
 *  - [mirror8]  the above plus the diagonal reflection (full square symmetry, D4).
 *  - [rotate4]  quarter-turn rotation only (cyclic, C4). Chiral: it spins one way, which
 *               is what lets a four-armed figure drift toward a hooked cross. Pieces that
 *               use it are the flagged "deliberate echo" pieces — nothing else may.
 *
 * Each helper runs [draw] once per symmetry image with the canvas already transformed,
 * so a piece draws ONE fundamental region in coordinates centred on (0, 0).
 */
inline fun Canvas.mirror4(cx: Float, cy: Float, draw: Canvas.() -> Unit) {
    for (sx in floatArrayOf(1f, -1f)) for (sy in floatArrayOf(1f, -1f)) {
        save(); translate(cx, cy); scale(sx, sy); draw(); restore()
    }
}

inline fun Canvas.mirror8(cx: Float, cy: Float, draw: Canvas.() -> Unit) {
    mirror4(cx, cy) {
        draw()
        // reflect across y = x: a 90° rotation composed with a horizontal flip
        save(); rotate(90f); scale(1f, -1f); draw(); restore()
    }
}

inline fun Canvas.rotate4(cx: Float, cy: Float, draw: Canvas.() -> Unit) {
    for (k in 0 until 4) {
        save(); translate(cx, cy); rotate(90f * k); draw(); restore()
    }
}
