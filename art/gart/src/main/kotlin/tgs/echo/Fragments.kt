package tgs.echo

import dev.oblac.gart.Dimension
import org.jetbrains.skia.Canvas
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.hypot
import kotlin.math.sin
import kotlin.math.sqrt

/*
 * Shared machinery for the ECHO FRAGMENTS: the flagged series that lets four-way
 * ROTATION drift toward the Baltic fire cross (ugunskrusts). Each piece is a crop —
 * rotated, zoomed, asymmetric — of a four-armed hooked figure whose arms are shaped by
 * one of three historical laws of population growth (see [Law]). Held constraints for
 * every fragment: no red field, no white disc behind the figure, no complete isolated
 * emblem in the frame.
 */

/**
 * The three laws, each normalised to map t ∈ [0,1] onto [0,1] so they can drive any
 * quantity (width, twist, dot size, timing) along an arm.
 *  - EXPONENTIAL: Malthus → Bartlett's bacteria. P = e^(rt). Never stops.
 *  - LOGISTIC: Verhulst (1838). P = K / (1 + e^(−r(t−t0))). Runs into a ceiling.
 *  - HYPERBOLIC: von Foerster, Mora & Amiot, "Doomsday: Friday, 13 November, A.D. 2026"
 *    (Science, 1960). P = C / (T − t). Infinite at a finite date.
 *  - PARABOLIC: polynomial growth, P ∝ t². Accelerating, but tamely — the foil.
 */
enum class Law {
    EXPONENTIAL, LOGISTIC, HYPERBOLIC, PARABOLIC;

    fun f(t: Float, k: Float = 4f): Float = when (this) {
        EXPONENTIAL -> ((exp(k * t) - 1f) / (exp(k) - 1f))
        LOGISTIC -> {
            // centred S-curve, rescaled so f(0)=0 and f(1)=1
            fun sig(x: Float) = 1f / (1f + exp(-x))
            val a = sig(-k * 0.5f); val b = sig(k * 0.5f)
            (sig(k * (t - 0.5f)) - a) / (b - a)
        }
        HYPERBOLIC -> {
            // singularity just past the end of the arm: T = 1 + 1/k
            val T = 1f + 1f / k
            (1f / (T - t) - 1f / T) / (1f / (T - 1f) - 1f / T)
        }
        PARABOLIC -> t * t
    }
}

/** A sampled centreline: positions, unit tangents, normalised arc length s ∈ [0,1]. */
class Line(val x: FloatArray, val y: FloatArray, val tx: FloatArray, val ty: FloatArray, val s: FloatArray) {
    val n get() = x.size
    fun rotated(deg: Float): Line {
        val a = (deg * PI / 180).toFloat(); val c = cos(a); val sn = sin(a)
        return Line(
            FloatArray(n) { x[it] * c - y[it] * sn }, FloatArray(n) { x[it] * sn + y[it] * c },
            FloatArray(n) { tx[it] * c - ty[it] * sn }, FloatArray(n) { tx[it] * sn + ty[it] * c }, s
        )
    }
}

/**
 * One hooked arm in canonical position: out along +x for [run], a quarter-turn of radius
 * [bend], then on for [tail]. The four arms are this arm at 0°, 90°, 180°, 270°.
 */
fun hookArm(run: Float, bend: Float, tail: Float, n: Int = 600): Line {
    val arc = (PI / 2 * bend).toFloat()
    val total = run + arc + tail
    val x = FloatArray(n); val y = FloatArray(n); val tx = FloatArray(n); val ty = FloatArray(n); val s = FloatArray(n)
    for (i in 0 until n) {
        val d = total * i / (n - 1)
        s[i] = d / total
        when {
            d <= run -> { x[i] = d; y[i] = 0f; tx[i] = 1f; ty[i] = 0f }
            d <= run + arc -> {
                val th = (d - run) / bend                 // 0 → π/2
                x[i] = run + bend * sin(th); y[i] = bend - bend * cos(th)
                tx[i] = cos(th); ty[i] = sin(th)
            }
            else -> { x[i] = run + bend; y[i] = bend + (d - run - arc); tx[i] = 0f; ty[i] = 1f }
        }
    }
    return Line(x, y, tx, ty, s)
}

fun fourArms(arm: Line): List<Line> = (0 until 4).map { arm.rotated(90f * it) }

/** Nearest point on any of the arms: distance, its s, and the unit normal pointing at p. */
class Near(val d: Float, val s: Float, val nx: Float, val ny: Float)

fun nearest(arms: List<Line>, px: Float, py: Float): Near {
    var best = Float.MAX_VALUE; var bs = 0f; var bx = 0f; var by = 0f
    for (a in arms) for (i in 0 until a.n) {
        val dx = px - a.x[i]; val dy = py - a.y[i]
        val dd = dx * dx + dy * dy
        if (dd < best) { best = dd; bs = a.s[i]; bx = dx; by = dy }
    }
    val d = sqrt(best)
    return if (d > 1e-4f) Near(d, bs, bx / d, by / d) else Near(0f, bs, 0f, 0f)
}

/**
 * Frame a fragment: the figure lives in coordinates centred on (0,0); this rotates it by
 * [rotDeg], magnifies by [zoom], and puts figure point ([fx],[fy]) at the canvas centre —
 * so the frame holds a turned, cropped, off-centre part of the whole.
 */
inline fun Canvas.fragment(d: Dimension, rotDeg: Float, zoom: Float, fx: Float, fy: Float, body: Canvas.() -> Unit) {
    save()
    translate(d.cx, d.cy); scale(zoom, zoom); rotate(rotDeg); translate(-fx, -fy)
    body()
    restore()
}

fun dist(ax: Float, ay: Float, bx: Float, by: Float) = hypot(ax - bx, ay - by)
