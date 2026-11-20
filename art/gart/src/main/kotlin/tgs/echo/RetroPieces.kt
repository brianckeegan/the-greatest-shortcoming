package tgs.echo

import dev.oblac.gart.Dimension
import dev.oblac.gart.color.RetroColors
import dev.oblac.gart.gfx.drawBorder
import org.jetbrains.skia.Canvas
import org.jetbrains.skia.Rect
import tgs.fill
import tgs.stroke
import tgs.withAlpha
import kotlin.math.PI
import kotlin.math.atan2
import kotlin.math.ceil
import kotlin.math.exp
import kotlin.math.hypot
import kotlin.math.ln
import kotlin.math.min
import kotlin.random.Random

private val ink = RetroColors.black01
private val paper = RetroColors.white01
private val red = RetroColors.red01
private val umber = 0xFF5C4A3A.toInt()
private val oxblood = 0xFF7A2618.toInt()

/**
 * C · HALFTONE, LOGISTIC — after gart's retro halftone pieces. The dot grid itself is
 * geometric: every time the distance from the centre doubles, the grid pitch (and so
 * every dot) grows ×1.5, so the screen coarsens in visible octave rings. Along each
 * hooked arm, dot size follows a LOGISTIC curve — slow, then fast, then levelling at
 * the carrying capacity where neighbours touch. Colour steps each time a dot's AREA
 * doubles (1/16 → 1/8 → 1/4 → 1/2 → full), so the ramp marks doublings, not equal steps.
 */
fun halftoneLogistic(c: Canvas, d: Dimension) {
    val w = d.w.toFloat()
    c.clear(paper)
    val run = w * 0.30f; val bend = w * 0.18f; val tail = w * 1.2f
    val arm = hookArm(run = run, bend = bend, tail = tail, n = 700)
    val total = run + (PI / 2).toFloat() * bend + tail
    val lRef = run + (PI / 2).toFloat() * bend + w * 0.40f
    val arms = fourArms(arm)
    val ramp = listOf(ink, umber, RetroColors.yellow01, RetroColors.orange01, red)
    val r0 = w * 0.05f; val p0 = w * 0.0062f
    c.fragment(d, rotDeg = 45f, zoom = 1.0f, fx = w * 0.24f, fy = w * 0.16f) {
        for (L in 0..7) {
            val rIn = if (L == 0) 0f else r0 * (1 shl (L - 1)); val rOut = r0 * (1 shl L)
            val pitch = p0 * Math.pow(1.5, L.toDouble()).toFloat()
            val m = ceil(rOut / pitch).toInt()
            for (i in -m..m) for (j in -m..m) {
                val x = i * pitch; val y = j * pitch
                val rr = hypot(x, y)
                if (rr < rIn || rr >= rOut) continue
                val nr = nearest(arms, x, y)
                val sg = min(nr.s * total / lRef, 1f)
                val bandHalf = w * (0.03f + 0.09f * sg)
                val inBand = (1f - nr.d / bandHalf).coerceIn(0f, 1f)
                val grow = Law.LOGISTIC.f(sg, 7f)
                val rel = 0.17f + 0.83f * (0.15f + 0.85f * grow) * smooth(inBand)
                val area = rel * rel
                val step = when { area < 1f / 16 -> 0; area < 1f / 8 -> 1; area < 1f / 4 -> 2; area < 0.5f -> 3; else -> 4 }
                drawCircle(x, y, pitch * 0.53f * rel, fill(ramp[step]))
            }
        }
    }
    c.drawBorder(d, w * 0.035f, paper)
}

/**
 * D · WHIRL, LOGISTIC — after gart's retro/rectaround and rotor. Three overlapping seeds
 * of nested squares, each a geometric series (×1.07 to ×1.11 per square) around its own
 * slightly offset centre. Each seed's cumulative turn follows a LOGISTIC curve with its
 * own steepness and ceiling, so their S-shaped corner-arms drift in and out of phase.
 * Stroke widths differ by seed: proportional to size, growing ×1.12 per square, or
 * pulsing heavy every fourth square (a doubling rhythm).
 */
fun whirlLogistic(c: Canvas, d: Dimension) {
    val w = d.w.toFloat()
    c.clear(ink)
    class Seed(val cx: Float, val cy: Float, val ratio: Double, val maxTurn: Float, val k: Float,
               val color: Int, val weight: (Int, Float) -> Float)
    val seeds = listOf(
        Seed(w * 0.020f, -w * 0.015f, 1.07, 150f, 5f, withAlpha(red, 0.9f))
            { k, _ -> min(w * 0.0010f * Math.pow(1.06, k.toDouble()).toFloat(), w * 0.006f) },
        Seed(-w * 0.018f, w * 0.020f, 1.11, 60f, 12f, withAlpha(RetroColors.yellow01, 0.85f))
            { k, _ -> w * 0.0016f * (if (k % 4 == 0) 4f else 1f) },
        Seed(0f, 0f, 1.09, 95f, 8f, withAlpha(paper, 0.92f))
            { _, half -> half * 0.028f },
    )
    c.fragment(d, rotDeg = 45f, zoom = 1.25f, fx = w * 0.16f, fy = -w * 0.10f) {
        for (s in seeds) {
            var k = 0
            val steps = (ln(1.6 * w / (w * 0.012)) / ln(s.ratio)).toInt()
            while (k <= steps) {
                val half = w * 0.012f * Math.pow(s.ratio, k.toDouble()).toFloat()
                val turn = s.maxTurn * Law.LOGISTIC.f(k / steps.toFloat(), s.k)
                save(); translate(s.cx, s.cy); rotate(turn)
                drawRect(Rect.makeLTRB(-half, -half, half, half), stroke(s.color, s.weight(k, half).coerceAtLeast(1.2f)))
                restore()
                k++
            }
        }
        save(); translate(w * 0.004f, -w * 0.004f); rotate(12f)
        drawRect(Rect.makeLTRB(-w * 0.022f, -w * 0.022f, w * 0.022f, w * 0.022f), fill(red)); restore()
    }
    c.drawBorder(d, w * 0.035f, paper)
}

/**
 * F · FLIP, HYPERBOLIC — after gart's retro/flip, bubbles/holes and cell/rugae. An Ising
 * model on a disc board: each disc is a spin, it agrees with its neighbours, and an
 * outside field pulls discs to red as a front runs out along four hooked arms. The
 * front's reach follows the HYPERBOLIC law, racing at the end. Updates are applied to
 * whole C4 orbits, so local, noisy agreement assembles the hooked figure by itself.
 * Rendering: disc size halves for every 4 neighbours that disagree (√√2 per neighbour);
 * colour by how many doublings ago it flipped; discs on a domain wall turn on edge,
 * oriented along the wall.
 */
fun flipHyperbolic(c: Canvas, d: Dimension) {
    val w = d.w.toFloat()
    c.clear(ink)
    val arm = hookArm(run = w * 0.22f, bend = w * 0.13f, tail = w * 0.36f, n = 300)
    val arms = fourArms(arm)
    val n = 96
    val cell = w * 1.3f / n
    val rng = Random(1960)
    fun cx(i: Int) = (i - n / 2f + 0.5f) * cell
    val sArr = FloatArray(n * n); val dArr = FloatArray(n * n)
    for (j in 0 until n) for (i in 0 until n) {
        val nr = nearest(arms, cx(i), cx(j)); sArr[j * n + i] = nr.s; dArr[j * n + i] = nr.d
    }
    val spin = IntArray(n * n) { -1 }
    val flipT = IntArray(n * n) { -1 }
    fun orbit(i: Int, j: Int, f: (Int) -> Unit) {
        var a = i; var b = j
        repeat(4) { f(b * n + a); val t = a; a = n - 1 - b; b = t }
    }
    fun at(i: Int, j: Int) = if (i < 0 || j < 0 || i >= n || j >= n) -1 else spin[j * n + i]
    val sweeps = 70
    val bandHalf = w * 0.05f
    val J = 0.42f; val T = 1.7f
    for (t in 0 until sweeps) {
        val front = 1.02f * Law.HYPERBOLIC.f(t / (sweeps - 1f), 5f)
        repeat(n * n / 4) {
            val i = rng.nextInt(n); val j = rng.nextInt(n); val id = j * n + i
            var sum = 0
            for (dj in -1..1) for (di in -1..1) if (di != 0 || dj != 0) sum += at(i + di, j + dj)
            val reached = sArr[id] <= front
            val h = if (reached) 1.9f * exp(-(dArr[id] / bandHalf).let { it * it }) - 0.45f else -0.45f
            val p = 1f / (1f + exp(-2f * (J * sum + h) / T))
            val ns = if (rng.nextFloat() < p) 1 else -1
            orbit(i, j) { o -> spin[o] = ns; if (ns == 1 && flipT[o] < 0) flipT[o] = t; if (ns == -1) flipT[o] = -1 }
        }
    }
    val ages = listOf(RetroColors.yellow01, RetroColors.yellow01, RetroColors.orange01, RetroColors.orange01, red, red, oxblood)
    c.fragment(d, rotDeg = 45f, zoom = 1.25f, fx = w * 0.12f, fy = w * 0.20f) {
        for (j in 0 until n) for (i in 0 until n) {
            val s = at(i, j)
            var same = 0
            for (dj in -1..1) for (di in -1..1) if ((di != 0 || dj != 0) && at(i + di, j + dj) == s) same++
            val r = cell * 0.48f * Math.pow(2.0, (same - 8) / 4.0).toFloat()
            // local magnetisation gradient → the domain wall's direction
            val gx = (at(i + 1, j) - at(i - 1, j)).toFloat() * 0.5f
            val gy = (at(i, j + 1) - at(i, j - 1)).toFloat() * 0.5f
            val g = min(1f, hypot(gx, gy))
            val col = if (s == 1) {
                val age = sweeps - flipT[j * n + i]
                ages[(31 - Integer.numberOfLeadingZeros(age.coerceAtLeast(1))).coerceIn(0, ages.size - 1)]
            } else paper
            val minor = r * (1f - 0.7f * g)
            save(); translate(cx(i), cx(j)); rotate((atan2(gy, gx) * 180 / PI).toFloat())
            drawOval(Rect(-minor, -r, minor, r), fill(col))
            // holes: settled red discs carry a small knocked-out core
            if (s == 1 && same == 8) drawCircle(r * 0.18f, -r * 0.12f, r * 0.30f, fill(ink))
            restore()
        }
    }
    c.drawBorder(d, w * 0.035f, paper)
}

private fun smooth(t: Float) = t * t * (3f - 2f * t)
