package tgs.echo

import dev.oblac.gart.Dimension
import dev.oblac.gart.color.RetroColors
import dev.oblac.gart.gfx.drawBorder
import org.jetbrains.skia.Canvas
import org.jetbrains.skia.PathBuilder
import tgs.stroke
import tgs.withAlpha
import kotlin.math.PI
import kotlin.math.exp
import kotlin.math.sin
import kotlin.random.Random

private val ink = RetroColors.black01
private val paper = RetroColors.white01
private val red = RetroColors.red01

/**
 * A · SWING, EXPONENTIAL — after gart's lines/swing and circledots/gentle (bundles of
 * fine, translucent cream lines with a few red ones, swaying on a charcoal ground).
 * Four hooked bundles leave the centre tight and FAN OUT exponentially along their
 * length: the bundle's width is W0 + (W1−W0)·exp-law(s), so at the crossing the lines
 * nearly touch and past the hook they splay wide and run off the page. Stroke weight
 * steps geometrically across each bundle (×q per line, light on the inside of the
 * curve, heavy on the outside). Framed at 45°, off-centre: two hooks in view, never
 * the whole figure.
 */
fun swingExponential(c: Canvas, d: Dimension) {
    val w = d.w.toFloat()
    c.clear(ink)

    val run = w * 0.26f; val bend = w * 0.15f; val tail = w * 1.6f      // tails run off the page
    val arm = hookArm(run = run, bend = bend, tail = tail, n = 1400)
    val total = run + (PI / 2).toFloat() * bend + tail
    val lRef = run + (PI / 2).toFloat() * bend + w * 0.40f              // where growth is "done"
    val arms = fourArms(arm)

    val lines = 110
    val q = 1.02                                    // ×1.02 per line: ~8.8× across the bundle
    val reds = setOf(17, 71, 96)
    val rng = Random(1798)                          // Malthus's Essay
    c.fragment(d, rotDeg = 45f, zoom = 1.0f, fx = w * 0.16f, fy = w * 0.20f) {
        for ((ai, a) in arms.withIndex()) {
            for (i in 0 until lines) {
                val u = i / (lines - 1f) - 0.5f                       // −½ inside … +½ outside
                val phase = rng.nextFloat() * 6.283f
                val freq = 5f + rng.nextFloat() * 4f
                val pb = PathBuilder()
                for (k in 0 until a.n) {
                    val along = a.s[k] * total
                    val sg = 1.4f * (1f - exp(-along / lRef / 1.4f))   // ≈ along/lRef, easing to 1.4 (no kink)
                    val bw = w * (0.010f + 0.50f * Law.EXPONENTIAL.f(sg, 2.4f))  // bundle width
                    // gentle's sway: each line drifts a little, more as the bundle widens
                    val sway = sin(sg * freq + phase + ai) * bw * 0.035f
                    val off = u * bw + sway
                    val px = a.x[k] - a.ty[k] * off; val py = a.y[k] + a.tx[k] * off
                    if (k == 0) pb.moveTo(px, py) else pb.lineTo(px, py)
                }
                val weight = w * 0.0009f * Math.pow(q, i.toDouble()).toFloat()
                val pen = if (i in reds) stroke(withAlpha(red, 0.95f), weight * 1.8f)
                          else stroke(withAlpha(paper, 0.45f), weight)
                drawPath(pb.detach(), pen)
            }
        }
    }
    c.drawBorder(d, w * 0.035f, paper)
}
