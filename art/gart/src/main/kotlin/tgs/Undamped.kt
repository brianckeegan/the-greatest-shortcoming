package tgs

import dev.oblac.gart.Dimension
import org.jetbrains.skia.Canvas
import org.jetbrains.skia.ClipMode
import org.jetbrains.skia.PathBuilder
import kotlin.math.exp
import kotlin.math.ln
import kotlin.math.sin

/**
 * UNDAMPED — harmongraph gallery. Mathematical form, mirror symmetry (D2), seductive→ominous.
 *
 * A harmonograph is two pendulums whose swing DECAYS, so the pen spirals inward to rest.
 * Run it with the sign flipped — amplitude e^(+gt) — and the figure never settles: it
 * starts as a knot too small to see and swings out past the paper. The ground takes the
 * gallery's diagonal split and doubles it (both diagonals → four triangles), the curve
 * is mirrored into all four, and the final e-fold — the last stretch in which the swing
 * multiplies by e — is drawn in red.
 */
fun undamped(c: Canvas, d: Dimension) {
    val cx = d.cx; val cy = d.cy; val w = d.w.toFloat()

    // four triangles: top/bottom paper, left/right charcoal
    c.clear(Pal.paper)
    val left = PathBuilder().moveTo(0f, 0f).lineTo(cx, cy).lineTo(0f, w).closePath().detach()
    val right = PathBuilder().moveTo(w, 0f).lineTo(cx, cy).lineTo(w, w).closePath().detach()
    val dark = fill(Pal.charcoal)
    c.drawPath(left, dark); c.drawPath(right, dark)

    // undamped harmonograph in one quadrant's coordinates, mirrored ×4
    val tMax = 64f
    val a0 = w * 0.003f
    val g = ln((w * 0.50f) / a0) / tMax          // amplitude grows from a0 to ~0.5w
    val f1 = 2.0f; val f2 = 3.003f; val p1 = 0.0f
    // a ribbon of phase-shifted copies, like the dense pen-meshes in the gart gallery
    fun pathFor(t0: Float, t1: Float, ribbon: Int): org.jetbrains.skia.Path {
        val pb = PathBuilder()
        for (k in 0 until ribbon) {
            val p2 = 1.1f + k * 0.012f
            var t = t0; var first = true
            while (t <= t1) {
                val amp = a0 * exp(g * t)
                val x = amp * sin(f1 * t + p1)
                val y = amp * sin(f2 * t + p2) * 0.92f
                if (first) { pb.moveTo(x, y); first = false } else pb.lineTo(x, y)
                t += 0.006f
            }
        }
        return pb.detach()
    }
    // red = the final DOUBLING of the swing. Even that one span sweeps more paper than
    // everything before it combined — which is the point.
    val tLastDouble = tMax - ln(2f) / g
    val body = pathFor(0f, tLastDouble, 26)
    val last = pathFor(tLastDouble, tMax, 3)     // one sharp thread, not a ribbon

    val onPaper = stroke(withAlpha(Pal.charcoal, 0.24f), w * 0.0006f)
    val onDark = stroke(withAlpha(Pal.paper, 0.24f), w * 0.0006f)
    val red = stroke(withAlpha(Pal.swissRed, 0.85f), w * 0.0010f)

    // draw the curve twice, each clipped to the ground it should contrast with
    for ((clipDark, paint) in listOf(false to onPaper, true to onDark)) {
        c.save()
        c.clipPath(left, if (clipDark) ClipMode.INTERSECT else ClipMode.DIFFERENCE, true)
        if (clipDark) {
            c.restore(); c.save()
            val both = PathBuilder().moveTo(0f, 0f).lineTo(cx, cy).lineTo(0f, w).closePath()
                .moveTo(w, 0f).lineTo(cx, cy).lineTo(w, w).closePath().detach()
            c.clipPath(both, ClipMode.INTERSECT, true)
        } else {
            c.clipPath(right, ClipMode.DIFFERENCE, true)
        }
        c.mirror4(cx, cy) { drawPath(body, paint) }
        c.restore()
    }
    c.mirror4(cx, cy) { drawPath(last, red) }
}
