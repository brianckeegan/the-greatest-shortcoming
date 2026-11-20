package tgs.echo

import dev.oblac.gart.Dimension
import dev.oblac.gart.color.RetroColors
import dev.oblac.gart.gfx.drawBorder
import org.jetbrains.skia.Canvas
import org.jetbrains.skia.PathBuilder
import tgs.stroke
import tgs.withAlpha
import kotlin.math.PI
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.hypot
import kotlin.math.sin
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
 * G · THREE LAWS, FLOWFORCE — after gart's flowforce/flowforce3 (tens of thousands of
 * faint trails through a spiral-plus-wave field, one bright white thread). The field is
 * a hooked cross turned 45° and set off-centre: trails near an arm run along it, trails
 * further off are swept round and outward. Every trail also bends by a turn of its own
 * that grows along its length according to one of the three laws — EXPONENTIAL
 * (orange→vermilion), LOGISTIC (mustard→cream, levels off), HYPERBOLIC (teal→blue,
 * whips round at the end). The figure appears only as the bright threads that follow
 * the arms out of the centre, half lost in the weather around them.
 */
fun lawsField(c: Canvas, d: Dimension) {
    val w = d.w.toFloat()
    val sc = w / 2048f
    c.clear(paper)
    val ox = w * 0.36f; val oy = w * 0.62f
    val arms = fourArms(hookArm(run = w * 0.24f, bend = w * 0.14f, tail = w * 0.46f, n = 300))
        .map { it.rotated(45f) }
        .map { l -> Line(FloatArray(l.n) { l.x[it] + ox }, FloatArray(l.n) { l.y[it] + oy }, l.tx, l.ty, l.s) }

    // the field, precomputed on a coarse grid and sampled bilinearly
    val G = 192; val gs = w / (G - 1)
    val fxA = FloatArray(G * G); val fyA = FloatArray(G * G)
    for (gj in 0 until G) for (gi in 0 until G) {
        val px = gi * gs; val py = gj * gs
        var best = Float.MAX_VALUE; var tx = 0f; var ty = 0f
        for (a in arms) for (k in 0 until a.n) {
            val dd = (px - a.x[k]).let { it * it } + (py - a.y[k]).let { it * it }
            if (dd < best) { best = dd; tx = a.tx[k]; ty = a.ty[k] }
        }
        val dist = kotlin.math.sqrt(best)
        val near = exp(-dist / (w * 0.07f))
        val rx = px - ox; val ry = py - oy; val r = hypot(rx, ry).coerceAtLeast(1f)
        val swx = -ry / r; val swy = rx / r                      // swirl, same hand as the hooks
        val wx = sin(py * 0.0035f / sc) * 0.35f; val wy = cos(px * 0.0028f / sc) * 0.35f
        var vx = tx * near * 1.8f + (swx * 0.9f + rx / r * 0.55f) * (1 - near) + wx
        var vy = ty * near * 1.8f + (swy * 0.9f + ry / r * 0.55f) * (1 - near) + wy
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

    val rng = Random(1838)
    val steps = 240; val step = 2.3f * sc
    repeat(72000) {
        var x = rng.nextFloat() * w; var y = rng.nextFloat() * w
        // laws are dealt out by sector round the centre (twelve sectors, cycling), so each
        // colour family stays coherent in space instead of muddying into the others
        val sector = (((atan2(y - oy, x - ox) + PI) / (2 * PI) * 12).toInt()) % 3
        val law: Law; val maxTurn: Float; val k: Float; val col: Int
        val tpos = hypot(x - ox, y - oy) / (w * 0.9f)
        when {
            sector == 0 -> { law = Law.EXPONENTIAL; maxTurn = 1.5f; k = 3f; col = mix(RetroColors.orange01, red, tpos) }
            sector == 1 -> { law = Law.LOGISTIC; maxTurn = 1.1f; k = 9f; col = mix(RetroColors.yellow01, paper, tpos) }
            else -> { law = Law.HYPERBOLIC; maxTurn = 2.4f; k = 4f; col = mix(RetroColors.teal01, RetroColors.blue01, tpos) }
        }
        val pb = PathBuilder().moveTo(x, y)
        for (i in 1..steps) {
            val th = angle(x, y) + maxTurn * law.f(i / steps.toFloat(), k)
            x += cos(th) * step; y += sin(th) * step
            if (x < -20 || y < -20 || x > w + 20 || y > w + 20) break
            pb.lineTo(x, y)
        }
        c.drawPath(pb.detach(), stroke(withAlpha(col, 0.22f), 1.0f * sc))
    }
    // the bright threads: released along each arm near the centre, no turn of their own
    repeat(260) {
        val a = arms[rng.nextInt(4)]; val kk = rng.nextInt(a.n / 6)
        var x = a.x[kk] + (rng.nextFloat() - 0.5f) * w * 0.03f
        var y = a.y[kk] + (rng.nextFloat() - 0.5f) * w * 0.03f
        val pb = PathBuilder().moveTo(x, y)
        for (i in 1..520) {
            val th = angle(x, y)
            x += cos(th) * step; y += sin(th) * step
            if (x < -20 || y < -20 || x > w + 20 || y > w + 20) break
            pb.lineTo(x, y)
        }
        c.drawPath(pb.detach(), stroke(withAlpha(ink, 0.40f), 1.0f * sc))
    }
    c.drawBorder(d, w * 0.035f, paper)
}
