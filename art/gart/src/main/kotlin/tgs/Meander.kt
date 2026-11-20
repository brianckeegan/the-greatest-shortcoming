package tgs

import dev.oblac.gart.Dimension
import org.jetbrains.skia.Canvas
import org.jetbrains.skia.PaintStrokeCap
import org.jetbrains.skia.PaintStrokeJoin
import org.jetbrains.skia.Path
import org.jetbrains.skia.PathBuilder

/**
 * MEANDER, DOUBLING — lines gallery. Countable doubling, mirror symmetry (D4).
 *
 * The fret — the Greek key, and the stepped borders on Baltic sashes and mittens — is
 * folk ornament's oldest growth pattern: a hook, repeated. Here each hook is twice the
 * size of the one before it, so you can count the doubling along every arm: 1, 2, 4, 8,
 * 16, 32. One arm is mirrored across its own axis and then into all four directions —
 * reflection only, never rotation, so the ornament has no spin. It is drawn as the
 * lines gallery's striped "tapes": a band of parallel lines, one of them red.
 */
fun meander(c: Canvas, d: Dimension) {
    val cx = d.cx; val cy = d.cy; val w = d.w.toFloat()
    c.clear(Pal.black)

    // one half-arm along +x, above the axis: a fret whose module doubles every hook.
    // Five hooks (1, 2, 4, 8, 16) span 4·31 modules; size the base so the arm ends at the edge.
    val hooks = 5
    val start = w * 0.03f
    val h0 = (w * 0.40f) / (4f * ((1 shl hooks) - 1))
    // each hook is its own path so its tape can be as wide as its module — the band
    // doubles too, from a hairline at the centre to a heavy stripe at the rim
    val arm: List<Pair<Path, Float>> = buildList {
        var x = start; var h = h0
        repeat(hooks) {
            // key hook of module h: up 2h, forward 3h, down h, back h, down h, forward 2h
            val pb = PathBuilder().moveTo(x, 0f)
                .lineTo(x, 2 * h).lineTo(x + 3 * h, 2 * h).lineTo(x + 3 * h, h)
                .lineTo(x + 2 * h, h).lineTo(x + 2 * h, 0f).lineTo(x + 4 * h, 0f)
            add(pb.detach() to h)
            x += 4 * h; h *= 2f                                  // ← the doubling
        }
    }

    // tape: concentric strokes, widest first, alternating ink and ground; one red stripe
    val stripes = 7
    c.mirror8(cx, cy) {
        for (flip in floatArrayOf(1f, -1f)) {
            save(); scale(1f, flip)
            for ((path, h) in arm) {
                val bandW = h * 0.62f
                for (k in stripes downTo 1) {
                    val col = when {
                        k == 3 -> Pal.tomato
                        k % 2 == 1 -> Pal.offWhite
                        else -> Pal.black
                    }
                    val p = stroke(col, bandW * k / stripes.toFloat()).apply {
                        strokeJoin = PaintStrokeJoin.MITER; strokeCap = PaintStrokeCap.SQUARE
                    }
                    drawPath(path, p)
                }
            }
            restore()
        }
    }
    // the one cell at the origin
    val s = w * 0.012f
    c.drawRect(org.jetbrains.skia.Rect.makeXYWH(cx - s, cy - s, 2 * s, 2 * s), fill(Pal.tomato))
    // ochre registration frame, poster-style
    val m = w * 0.03f
    c.drawRect(org.jetbrains.skia.Rect.makeLTRB(m, m, w - m, w - m), stroke(Pal.ochre, w * 0.004f))
}
