package tgs

import dev.oblac.gart.Dimension
import org.jetbrains.skia.Canvas
import org.jetbrains.skia.PaintStrokeCap
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.ln
import kotlin.math.pow
import kotlin.math.sin
import kotlin.random.Random

/**
 * TWELVE O'CLOCK — sf gallery. Mathematical form, mirror symmetry (D4), seductive/cosmic.
 *
 * A vermilion disc — the bottle, full, at noon — inside rings whose radii step by a
 * constant ratio (√2: each ring encloses twice the area of the last), and a sunburst
 * whose outline is r = r0·e^(λθ) within each 45° octant, mirrored eight ways. So the
 * burst's silhouette IS the exponential function, wrapped around a point: flat near
 * the axes, then racing to four long points on the diagonals.
 */
fun twelveOclock(c: Canvas, d: Dimension) {
    val cx = d.cx; val cy = d.cy; val w = d.w.toFloat()
    val rng = Random(1200)
    c.clear(Pal.paper)
    // sf pieces sit as a charcoal plate inside a paper margin
    val m = w * 0.04f
    c.save()
    c.clipRect(org.jetbrains.skia.Rect.makeLTRB(m, m, w - m, w - m))
    c.clear(Pal.charcoal)

    val r0 = w * 0.065f
    val rTip = w * 0.66f                       // envelope reaches past the frame on the diagonals
    val lambda = ln(rTip / r0)                 // r(u) = r0·e^(λu), u ∈ [0,1] across an octant

    // equal-ratio rings (√2 per step → area doubles per ring)
    val ringPaint = stroke(withAlpha(Pal.paper, 0.35f), w * 0.0011f)
    var r = r0 * 1.5f
    while (r < w) { c.drawCircle(cx, cy, r, ringPaint); r *= 2.0.pow(0.5).toFloat() }

    // sunburst: rays from the disc to the exponential envelope, one octant, mirrored ×8
    val rays = 70
    c.mirror8(cx, cy) {
        for (i in 0..rays) {
            val u = i / rays.toFloat()             // 0 on the axis → 1 on the diagonal
            val th = u * PI.toFloat() / 4f
            val len = r0 * exp(lambda * u)
            val jitter = 1f + (rng.nextFloat() - 0.5f) * 0.05f
            val p = stroke(withAlpha(Pal.paper, 0.45f + 0.45f * u), w * (0.0007f + 0.0006f * u))
                .apply { strokeCap = PaintStrokeCap.ROUND }
            val a = r0 * 1.18f
            drawLine(a * cos(th), a * sin(th), len * jitter * cos(th), len * jitter * sin(th), p)
        }
    }

    // noon
    c.drawCircle(cx, cy, r0, fill(Pal.vermilion))
    // fine grain, like the sf prints
    val grain = fill(withAlpha(Pal.paper, 0.10f))
    repeat(60000) { c.drawCircle(rng.nextFloat() * w, rng.nextFloat() * w, w * 0.0006f, grain) }
    c.restore()
}
