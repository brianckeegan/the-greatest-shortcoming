package tgs.echo

import dev.oblac.gart.Dimension
import dev.oblac.gart.color.RetroColors
import dev.oblac.gart.gfx.drawBorder
import org.jetbrains.skia.Canvas
import org.jetbrains.skia.PaintStrokeCap
import org.jetbrains.skia.Path
import org.jetbrains.skia.PathBuilder
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

private fun mix(a: Int, b: Int, t: Float): Int {
    val u = t.coerceIn(0f, 1f)
    fun ch(s: Int) = (((a shr s) and 255) * (1 - u) + ((b shr s) and 255) * u).toInt() shl s
    return (0xFF shl 24) or ch(16) or ch(8) or ch(0)
}

/**
 * G · FOUR LAWS, FLOWFORCE — after gart's flowforce/flowforce3. A white hooked cross,
 * turned 45° and set off-centre, made of a bundle of fine white lines. Round it, a flow
 * field (swirl about the cross's centre, plus a push away from its arms) carries a few
 * thousand swirls. Each swirl's own turn grows along its length by one of FOUR laws,
 * and the law sets its colour family:
 *   EXPONENTIAL  orange → vermilion   curls ever tighter
 *   HYPERBOLIC   teal → blue          runs nearly straight, then whips into a knot
 *   PARABOLIC    mustard → amber      bends steadily more
 *   LOGISTIC     sage → cream         turns, then straightens out at its ceiling
 * Width and opacity are drawn from halving-odds (geometric) distributions: many fine
 * faint swirls, a few broad bright ones.
 */
fun lawsField(c: Canvas, d: Dimension) {
    val w = d.w.toFloat()
    val sc = w / 2048f
    c.clear(ink)
    val ox = w * 0.45f; val oy = w * 0.54f
    val arms = fourArms(hookArm(run = w * 0.13f, bend = w * 0.08f, tail = w * 0.22f, n = 500))
        .map { it.rotated(45f) }
        .map { l -> Line(FloatArray(l.n) { l.x[it] + ox }, FloatArray(l.n) { l.y[it] + oy }, l.tx, l.ty, l.s) }

    // the field on a coarse grid, sampled bilinearly
    val G = 192; val gs = w / (G - 1)
    val fxA = FloatArray(G * G); val fyA = FloatArray(G * G)
    for (gj in 0 until G) for (gi in 0 until G) {
        val px = gi * gs; val py = gj * gs
        var best = Float.MAX_VALUE; var nx = 0f; var ny = 0f
        for (a in arms) for (k in 0 until a.n step 2) {
            val dx = px - a.x[k]; val dy = py - a.y[k]
            val dd = dx * dx + dy * dy
            if (dd < best) { best = dd; nx = dx; ny = dy }
        }
        val dist = sqrt(best).coerceAtLeast(1f); nx /= dist; ny /= dist
        val push = exp(-dist / (w * 0.035f))
        val rx = px - ox; val ry = py - oy; val r = hypot(rx, ry).coerceAtLeast(1f)
        val swx = -ry / r; val swy = rx / r                      // swirl, the hooks' hand
        val wx = sin(py * 0.004f / sc) * 0.25f; val wy = cos(px * 0.0032f / sc) * 0.25f
        var vx = swx + rx / r * 0.25f + nx * push * 1.6f + wx
        var vy = swy + ry / r * 0.25f + ny * push * 1.6f + wy
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

    val rng = Random(1960)
    fun geo(max: Int): Int { var l = 0; while (l < max && rng.nextFloat() < 0.5f) l++; return l }
    class Swirl(val path: Path, val width: Float, val color: Int)
    val swirls = ArrayList<Swirl>()
    val sage = 0xFF8A9A6B.toInt()
    repeat(4200) {
        var x = rng.nextFloat() * w; var y = rng.nextFloat() * w
        val law = Law.entries[rng.nextInt(4)]
        val dir = if (rng.nextFloat() < 0.8f) 1f else -1f        // mostly with the hooks' hand
        val tpos = rng.nextFloat()
        val maxTurn: Float; val k: Float; val col: Int
        when (law) {
            Law.EXPONENTIAL -> { maxTurn = 4.5f * PI.toFloat(); k = 4f; col = mix(RetroColors.orange01, red, tpos) }
            Law.HYPERBOLIC -> { maxTurn = 5.0f * PI.toFloat(); k = 6f; col = mix(RetroColors.teal01, RetroColors.blue01, tpos) }
            Law.PARABOLIC -> { maxTurn = 2.5f * PI.toFloat(); k = 4f; col = mix(RetroColors.yellow01, RetroColors.amber01, tpos) }
            Law.LOGISTIC -> { maxTurn = 1.6f * PI.toFloat(); k = 10f; col = mix(sage, paper, tpos) }
        }
        val steps = 160 + rng.nextInt(360)
        val step = 2.4f * sc
        val pb = PathBuilder().moveTo(x, y)
        for (i in 1..steps) {
            val th = angle(x, y) + dir * maxTurn * law.f(i / steps.toFloat(), k) * 0.6f
            x += cos(th) * step; y += sin(th) * step
            if (x < -40 || y < -40 || x > w + 40 || y > w + 40) break
            pb.lineTo(x, y)
        }
        val lvl = geo(5)
        val width = 0.8f * sc * (1 shl lvl)                         // ×2 per class, each half as common
        val alpha = (0.95f * Math.pow(0.6, geo(3).toDouble()).toFloat()) / (1f + lvl * 0.25f)
        swirls += Swirl(pb.detach(), width, withAlpha(col, alpha))
    }
    swirls.sortByDescending { it.width }                            // broad washes first, hairlines on top
    for (s in swirls) c.drawPath(s.path, stroke(s.color, s.width).apply { strokeCap = PaintStrokeCap.ROUND })

    // the white cross: a solid paper band along each arm, widening slightly toward the
    // tips, then combed with fine lines (the gentle bundle) so it keeps the flow's grain
    for (a in arms) {
        val left = PathBuilder(); val right = ArrayList<FloatArray>()
        for (kk in 0 until a.n) {
            val hb = w * (0.022f + 0.022f * a.s[kk]) * 0.5f
            val lx = a.x[kk] + a.ty[kk] * hb; val ly = a.y[kk] - a.tx[kk] * hb
            if (kk == 0) left.moveTo(lx, ly) else left.lineTo(lx, ly)
            right += floatArrayOf(a.x[kk] - a.ty[kk] * hb, a.y[kk] + a.tx[kk] * hb)
        }
        for (p in right.asReversed()) left.lineTo(p[0], p[1])
        c.drawPath(left.closePath().detach(), tgs.fill(paper))
    }
    val lines = 46
    for (pass in 0..0) for (a in arms) for (i in 0 until lines) {
        val u = i / (lines - 1f) - 0.5f
        val pb = PathBuilder()
        for (kk in 0 until a.n) {
            val bw = w * (0.022f + 0.022f * a.s[kk])
            val off = u * bw
            val px = a.x[kk] - a.ty[kk] * off; val py = a.y[kk] + a.tx[kk] * off
            if (kk == 0) pb.moveTo(px, py) else pb.lineTo(px, py)
        }
        val pen = stroke(withAlpha(if (i % 3 == 0) RetroColors.yellow01 else ink, 0.10f), 0.9f * sc)
        c.drawPath(pb.detach(), pen)
    }
    c.drawBorder(d, w * 0.035f, paper)
}
