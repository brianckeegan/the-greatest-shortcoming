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
 * nearly touch and past the hook they splay wide and run off the page. Each line draws
 * its own weight, opacity and colour from geometric (halving-odds) distributions, so
 * the bundle mixes hairlines with rare heavy strokes and bright lines with ghosts. Framed at 45°, off-centre: two hooks in view, never
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

    val lines = 120
    val reds = setOf(17, 71, 96)
    val rng = Random(1798)                          // Malthus's Essay
    // every line draws its own weight, opacity and colour, all from geometric laws:
    //  - weight level L with P(L) = ½^(L+1): each heavier class half as common, twice as wide
    //    (×32 from the hairlines to the rare heavy strokes), on top of a ×1.015 drift
    //    across the bundle;
    //  - opacity 0.9 · 0.62^m, the same halving-odds draw: mostly bright, a few ghosts;
    //  - colour: cream mostly, with mustard, amber, orange and teal at falling odds.
    fun geo(max: Int): Int { var l = 0; while (l < max && rng.nextFloat() < 0.5f) l++; return l }
    val accents = listOf(RetroColors.yellow01, RetroColors.amber01, RetroColors.orange01, RetroColors.teal01)
    class Stroke(val arm: Int, val i: Int, val weight: Float, val color: Int, val phase: Float, val freq: Float)
    val strokes = ArrayList<Stroke>()
    for (ai in 0 until 4) for (i in 0 until lines) {
        val lvl = geo(5)
        val m = geo(3)
        val pickAcc = geo(4)
        val base = when {
            i in reds -> red
            pickAcc == 0 || pickAcc == 1 -> paper
            else -> accents[(pickAcc - 2 + rng.nextInt(2)).coerceAtMost(accents.size - 1)]
        }
        val alpha = if (i in reds) 0.95f else 0.9f * Math.pow(0.62, m.toDouble()).toFloat()
        val weight = w * 0.00045f * (1 shl lvl) * Math.pow(1.015, i.toDouble()).toFloat() * (if (i in reds) 1.6f else 1f)
        strokes += Stroke(ai, i, weight, withAlpha(base, alpha), rng.nextFloat() * 6.283f, 5f + rng.nextFloat() * 4f)
    }
    strokes.sortByDescending { it.weight }            // heavy strokes underneath, hairlines on top
    c.fragment(d, rotDeg = 45f, zoom = 1.0f, fx = w * 0.16f, fy = w * 0.20f) {
        for (st in strokes) {
            val a = arms[st.arm]
            val u = st.i / (lines - 1f) - 0.5f                        // −½ inside … +½ outside
            val pb = PathBuilder()
            for (k in 0 until a.n) {
                val along = a.s[k] * total
                val sg = 1.4f * (1f - exp(-along / lRef / 1.4f))   // ≈ along/lRef, easing to 1.4 (no kink)
                val bw = w * (0.010f + 0.50f * Law.EXPONENTIAL.f(sg, 2.4f))  // bundle width
                // gentle's sway: each line drifts a little, more as the bundle widens
                val sway = sin(sg * st.freq + st.phase + st.arm) * bw * 0.035f
                val off = u * bw + sway
                val px = a.x[k] - a.ty[k] * off; val py = a.y[k] + a.tx[k] * off
                if (k == 0) pb.moveTo(px, py) else pb.lineTo(px, py)
            }
            drawPath(pb.detach(), stroke(st.color, st.weight))
        }
    }
    c.drawBorder(d, w * 0.035f, paper)
}
