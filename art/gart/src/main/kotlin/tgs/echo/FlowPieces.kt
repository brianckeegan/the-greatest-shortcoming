package tgs.echo

import dev.oblac.gart.Dimension
import dev.oblac.gart.color.RetroColors
import dev.oblac.gart.gfx.drawBorder
import org.jetbrains.skia.Canvas
import org.jetbrains.skia.ClipMode
import org.jetbrains.skia.PaintStrokeCap
import org.jetbrains.skia.Path
import org.jetbrains.skia.PathBuilder
import tgs.fill
import tgs.stroke
import tgs.withAlpha
import kotlin.math.PI
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.hypot
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.random.Random

private val ink = RetroColors.black01
private val paper = RetroColors.white01
private val red = RetroColors.red01
private val sage = 0xFF8A9A6B.toInt()

private fun mix(a: Int, b: Int, t: Float): Int {
    val u = t.coerceIn(0f, 1f)
    fun ch(s: Int) = (((a shr s) and 255) * (1 - u) + ((b shr s) and 255) * u).toInt() shl s
    return (0xFF shl 24) or ch(16) or ch(8) or ch(0)
}

/** Each law's colour family; t picks a point along it. */
private fun lawColor(law: Law, t: Float) = when (law) {
    Law.EXPONENTIAL -> mix(RetroColors.orange01, red, t)
    Law.HYPERBOLIC -> mix(RetroColors.teal01, RetroColors.blue01, t)
    Law.PARABOLIC -> mix(RetroColors.yellow01, RetroColors.amber01, t)
    Law.LOGISTIC -> mix(sage, paper, t)
}

/**
 * G · FOUR LAWS, FLOWFORCE — after gart's flowforce/flowforce3, crossed with a bubble
 * chamber photograph. A hooked cross, turned 45°, is never drawn: it is the NEGATIVE
 * SPACE that no line enters. The crop is close and off-centre, so the crossing and parts
 * of the arms are in frame but not all four hooks — the figure is implied by absence.
 *
 * Two kinds of mark fill the rest, each bending by a curvature that grows along its
 * length under one of four laws (EXPONENTIAL, HYPERBOLIC, PARABOLIC, LOGISTIC), which
 * also sets its colour family:
 *  - flow swirls: long continuous strokes carried by a field that circles the cross and
 *    slides along its edges, so the empty arms are outlined by the current;
 *  - bubble-chamber tracks: dotted trails from a vertex, often in pairs that curl in
 *    opposite senses, tightening into spirals as their curvature runs away — the
 *    signature of a charged particle losing energy.
 * Widths, dot sizes and opacities are drawn from halving-odds (geometric) distributions.
 */
fun lawsField(c: Canvas, d: Dimension) {
    val w = d.w.toFloat()
    val sc = w / 2048f
    c.clear(ink)
    // the figure is large and off-centre: crossing in frame, hooks mostly outside it
    val ox = w * 0.40f; val oy = w * 0.58f
    val arms = fourArms(hookArm(run = w * 0.30f, bend = w * 0.18f, tail = w * 0.60f, n = 700))
        .map { it.rotated(45f) }
        .map { l -> Line(FloatArray(l.n) { l.x[it] + ox }, FloatArray(l.n) { l.y[it] + oy }, l.tx, l.ty, l.s) }

    // the void: a band along each arm, widening a little toward the tips. Only its core
    // (CORE of the width) is a hard clip; marks stop short of the full band at a jittered
    // distance, so the edge is feathered by the marks themselves, not cut.
    fun halfBand(s: Float) = w * (0.034f + 0.022f * s)
    val CORE = 0.62f
    val voidPath = PathBuilder().apply {
        for (a in arms) {
            for (k in 0 until a.n) {
                val hb = halfBand(a.s[k]) * CORE
                val lx = a.x[k] + a.ty[k] * hb; val ly = a.y[k] - a.tx[k] * hb
                if (k == 0) moveTo(lx, ly) else lineTo(lx, ly)
            }
            for (k in a.n - 1 downTo 0) {
                val hb = halfBand(a.s[k]) * CORE
                lineTo(a.x[k] - a.ty[k] * hb, a.y[k] + a.tx[k] * hb)
            }
            closePath()
        }
    }.detach()

    // the field on a coarse grid: swirl about the centre, sliding along the arms' edges
    val G = 192; val gs = w / (G - 1)
    val fxA = FloatArray(G * G); val fyA = FloatArray(G * G)
    val dA = FloatArray(G * G); val sA = FloatArray(G * G)
    for (gj in 0 until G) for (gi in 0 until G) {
        val px = gi * gs; val py = gj * gs
        var best = Float.MAX_VALUE; var nx = 0f; var ny = 0f; var tx = 0f; var ty = 0f
        for (a in arms) for (k in 0 until a.n step 2) {
            val dx = px - a.x[k]; val dy = py - a.y[k]
            val dd = dx * dx + dy * dy
            if (dd < best) { best = dd; nx = dx; ny = dy; tx = a.tx[k]; ty = a.ty[k]; sA[gj * G + gi] = a.s[k] }
        }
        val dist = sqrt(best).coerceAtLeast(1f); nx /= dist; ny /= dist
        dA[gj * G + gi] = dist
        val edge = exp(-dist / (w * 0.06f))
        val rx = px - ox; val ry = py - oy; val r = hypot(rx, ry).coerceAtLeast(1f)
        val swx = -ry / r; val swy = rx / r
        val wx = sin(py * 0.004f / sc) * 0.25f; val wy = cos(px * 0.0032f / sc) * 0.25f
        // near an arm: run along it (sign chosen to agree with the swirl) and lean outward
        val sgn = if (tx * swx + ty * swy >= 0f) 1f else -1f
        var vx = (swx + rx / r * 0.2f + wx) * (1 - edge) + (tx * sgn * 1.4f + nx * 0.5f) * edge
        var vy = (swy + ry / r * 0.2f + wy) * (1 - edge) + (ty * sgn * 1.4f + ny * 0.5f) * edge
        val m = hypot(vx, vy).coerceAtLeast(1e-4f); vx /= m; vy /= m
        fxA[gj * G + gi] = vx; fyA[gj * G + gi] = vy
    }
    fun angle(x: Float, y: Float): Float {
        val gx = (x / gs).coerceIn(0f, G - 1.001f); val gy = (y / gs).coerceIn(0f, G - 1.001f)
        val i = gx.toInt(); val j = gy.toInt(); val u = gx - i; val v = gy - j
        fun lerp2(a: FloatArray) = (a[j * G + i] * (1 - u) + a[j * G + i + 1] * u) * (1 - v) +
            (a[(j + 1) * G + i] * (1 - u) + a[(j + 1) * G + i + 1] * u) * v
        return atan2(lerp2(fyA), lerp2(fxA))
    }

    /** how far inside the feathered edge a point is: < 0 means "in the void". */
    fun clearance(x: Float, y: Float, jitter: Float): Float {
        val gi = (x / gs + 0.5f).toInt().coerceIn(0, G - 1); val gj = (y / gs + 0.5f).toInt().coerceIn(0, G - 1)
        return dA[gj * G + gi] - halfBand(sA[gj * G + gi]) * jitter
    }

    val rng = Random(1960)
    fun geo(max: Int): Int { var l = 0; while (l < max && rng.nextFloat() < 0.5f) l++; return l }
    fun lawK(law: Law) = when (law) { Law.EXPONENTIAL -> 4f; Law.HYPERBOLIC -> 6f; Law.PARABOLIC -> 4f; Law.LOGISTIC -> 10f }

    c.save()
    c.clipPath(voidPath, ClipMode.DIFFERENCE, true)

    // 1 · flow swirls
    class Swirl(val path: Path, val width: Float, val color: Int)
    val swirls = ArrayList<Swirl>()
    repeat(3400) {
        var x = rng.nextFloat() * w; var y = rng.nextFloat() * w
        val law = Law.entries[rng.nextInt(4)]
        val dir = if (rng.nextFloat() < 0.8f) 1f else -1f
        val maxTurn = when (law) { Law.EXPONENTIAL -> 4.5f; Law.HYPERBOLIC -> 5f; Law.PARABOLIC -> 2.5f; Law.LOGISTIC -> 1.6f } * PI.toFloat()
        val steps = 160 + rng.nextInt(360); val step = 2.4f * sc
        val jit = 0.75f + rng.nextFloat() * 0.45f              // this swirl's stopping distance
        if (clearance(x, y, jit) < 0f) return@repeat
        val pb = PathBuilder().moveTo(x, y)
        for (i in 1..steps) {
            val th = angle(x, y) + dir * maxTurn * law.f(i / steps.toFloat(), lawK(law)) * 0.5f
            x += cos(th) * step; y += sin(th) * step
            if (x < -40 || y < -40 || x > w + 40 || y > w + 40) break
            if (clearance(x, y, jit) < 0f) break               // it never enters the void
            pb.lineTo(x, y)
        }
        val lvl = geo(4)
        val alpha = (0.9f * Math.pow(0.6, geo(3).toDouble()).toFloat()) / (1f + lvl * 0.3f)
        swirls += Swirl(pb.detach(), 0.8f * sc * (1 shl lvl), withAlpha(lawColor(law, rng.nextFloat()), alpha))
    }
    swirls.sortByDescending { it.width }
    for (s in swirls) c.drawPath(s.path, stroke(s.color, s.width).apply { strokeCap = PaintStrokeCap.ROUND })

    // 2 · bubble-chamber tracks: dotted, curling ever tighter, often in opposite pairs
    repeat(260) {
        val vx = rng.nextFloat() * w; val vy = rng.nextFloat() * w
        val prongs = if (rng.nextFloat() < 0.55f) 2 else 1
        val th0 = rng.nextFloat() * 2 * PI.toFloat()
        val law = Law.entries[rng.nextInt(4)]
        val dotR = 0.9f * sc * Math.pow(1.6, geo(3).toDouble()).toFloat()
        val alpha = 0.95f * Math.pow(0.7, geo(2).toDouble()).toFloat()
        val col = withAlpha(lawColor(law, rng.nextFloat()), alpha)
        val len = (500 + rng.nextInt(1400)) * sc               // path length, px
        val kEnd = 1f / ((3f + rng.nextFloat() * 6f) * sc)     // final curvature: a few px radius
        for (p in 0 until prongs) {
            var x = vx; var y = vy
            var th = th0 + if (p == 1) (0.15f + rng.nextFloat() * 0.3f) else 0f
            val sense = if (p == 0) 1f else -1f
            val step = 1.0f * sc
            val n = (len / step).toInt()
            var since = 0f
            for (i in 0 until n) {
                val kap = 1f / (w * 0.6f) + kEnd * law.f(i / n.toFloat(), lawK(law))
                th += sense * kap * step
                x += cos(th) * step; y += sin(th) * step
                since += step
                if (since >= dotR * 2.6f) {
                    // dots fade out over the feathered edge instead of stopping at a line
                    val cl = clearance(x, y, 1f) / (halfBand(0.5f) * 0.4f)
                    if (cl > 0f || rng.nextFloat() < 1f + cl) c.drawCircle(x, y, dotR, fill(col))
                    since = 0f
                }
            }
        }
    }
    c.restore()
    c.drawBorder(d, w * 0.035f, paper)
}
