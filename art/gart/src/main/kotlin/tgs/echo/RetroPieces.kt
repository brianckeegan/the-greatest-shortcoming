package tgs.echo

import dev.oblac.gart.Dimension
import dev.oblac.gart.color.RetroColors
import dev.oblac.gart.gfx.drawBorder
import org.jetbrains.skia.Canvas
import org.jetbrains.skia.PaintStrokeCap
import org.jetbrains.skia.PathBuilder
import org.jetbrains.skia.Rect
import tgs.fill
import tgs.stroke
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin
import kotlin.random.Random

private val ink = RetroColors.black01
private val paper = RetroColors.white01
private val red = RetroColors.red01

/**
 * C · HALFTONE, LOGISTIC — after gart's retro halftone pieces (dot grids over a red sun).
 * A grid of dots whose size rises along each hooked arm on a LOGISTIC curve: tiny near
 * the centre, swelling fast through the middle, then levelling off at the carrying
 * capacity — the point where neighbouring dots touch and can't grow any further.
 * Inside the vermilion sun the dots knock out to paper, the retro way. The board is
 * turned 45° and cropped so a single hook runs through the frame.
 */
fun halftoneLogistic(c: Canvas, d: Dimension) {
    val w = d.w.toFloat()
    c.clear(paper)
    val arm = hookArm(run = w * 0.30f, bend = w * 0.18f, tail = w * 0.40f, n = 300)
    val arms = fourArms(arm)
    val pitch = w * 0.016f
    val half = (w * 0.85f / pitch).toInt()
    val sunX = w * 0.42f; val sunY = -w * 0.22f; val sunR = w * 0.12f     // figure coords
    // geometric colormap: a dot's colour steps each time its AREA doubles
    // (1/16 → 1/8 → 1/4 → 1/2 → full), so the colour bands mark doublings, not equal steps
    val ramp = listOf(ink, 0xFF5C4A3A.toInt(), RetroColors.yellow01, RetroColors.orange01, red)
    c.fragment(d, rotDeg = 45f, zoom = 1.0f, fx = w * 0.24f, fy = w * 0.14f) {
        drawCircle(sunX, sunY, sunR, fill(red))
        for (i in -half..half) for (j in -half..half) {
            val x = i * pitch; val y = j * pitch
            val nr = nearest(arms, x, y)
            val bandHalf = w * 0.09f
            val inBand = (1f - (nr.d / bandHalf)).coerceIn(0f, 1f)
            val grow = Law.LOGISTIC.f(nr.s, 7f)                     // the S-curve along the arm
            val rel = (0.08f + 0.92f * (0.18f + 0.82f * grow) * smooth(inBand))       // radius relative to capacity
            val r = pitch * 0.53f * rel                              // 0.53·pitch ≈ touching
            val area = rel * rel
            val step = when { area < 1f / 16 -> 0; area < 1f / 8 -> 1; area < 1f / 4 -> 2; area < 0.5f -> 3; else -> 4 }
            val inSun = hypot(x - sunX, y - sunY) < sunR
            drawCircle(x, y, r, fill(if (inSun) paper else ramp[step]))
        }
    }
    c.drawBorder(d, w * 0.035f, paper)
}

/**
 * D · WHIRL, LOGISTIC — after gart's retro/rectaround and rotor (squares turned by a
 * little more each step). Forty nested squares, each 9% larger than the last; the
 * cumulative turn follows a LOGISTIC curve, so the squares barely twist near the
 * centre, whirl hard through the middle, and stop turning at the rim. Their corners
 * therefore trace four S-shaped arms. Magnified onto one corner, off-centre.
 */
fun whirlLogistic(c: Canvas, d: Dimension) {
    val w = d.w.toFloat()
    c.clear(ink)
    val steps = 46
    c.fragment(d, rotDeg = 45f, zoom = 1.25f, fx = w * 0.16f, fy = -w * 0.10f) {
        for (k in steps - 1 downTo 0) {
            val t = k / (steps - 1f)
            val half = w * 0.012f * Math.pow(1.09, k.toDouble()).toFloat()
            val turn = 95f * Law.LOGISTIC.f(t, 8f)
            save(); rotate(turn)
            val r = Rect.makeLTRB(-half, -half, half, half)
            drawRect(r, stroke(paper, max(1.2f, half * 0.035f)))
            restore()
        }
        // the red square sits slightly off the centre, like rectaround's inner squares
        save(); translate(w * 0.004f, -w * 0.004f); rotate(12f)
        drawRect(Rect.makeLTRB(-w * 0.026f, -w * 0.026f, w * 0.026f, w * 0.026f), fill(red)); restore()
    }
    c.drawBorder(d, w * 0.035f, paper)
}

/**
 * E · COIL, HYPERBOLIC — after gart's retro/coil (bricks laid in rings round a sun; a
 * slip per ring winds the stripes). Here each ring has four bricks, and the slip per
 * ring follows von Foerster's HYPERBOLIC law C/(T−k): the arms lean gently at first,
 * then the slip runs away as the rings approach the singular ring T, and past it the
 * pattern shears into noise. Red bricks inside the sun. Cropped to a turned quarter
 * so the singularity crosses the frame on the diagonal.
 */
fun coilHyperbolic(c: Canvas, d: Dimension) {
    val w = d.w.toFloat()
    c.clear(paper)
    val course = w * 0.012f
    val rings = 120
    val T = 92.5f                                   // the singular ring
    val c0 = 900f                                   // degrees·rings: sets how hard it winds
    // framed on the singular ring itself (radius ≈ 1.1w), so the centre — and any clean
    // four-bladed figure — is out of frame; what's left is arms winding into the blow-up
    c.fragment(d, rotDeg = 45f, zoom = 0.8f, fx = w * 0.80f, fy = w * 0.60f) {
        for (k in 1..rings) {
            val r = (k - 0.5f) * course
            // where this ring's bricks start: C/(T−k), zeroed at the centre. Gentle for most
            // rings, whipping round as k → T, then flipping sign past T: the doomsday ring.
            val seam = c0 / (T - k) - c0 / T
            // stroke weight scales geometrically with ring index: rings thicken outward
            val weight = course * 0.78f * Math.pow(1.004, k.toDouble()).toFloat()
            val pen = stroke(if (k > T) red else ink, weight).apply { strokeCap = PaintStrokeCap.BUTT }
            for (j in 0 until 4) drawArc(-r, -r, r, r, seam + j * 90f, 32f, false, pen)
        }
    }
    c.drawBorder(d, w * 0.035f, paper)
}

/**
 * F · FLIP, HYPERBOLIC — after gart's retro/flip (a flip-disc board caught mid-change).
 * Discs flip from paper to red as a front travels out along four hooked arms. The
 * front's reach follows the HYPERBOLIC law — finite-time blow-up — so this snapshot,
 * taken just before "doomsday", shows the front racing: discs well behind it fully
 * red, discs at it caught on their edges, the rest of the board still paper. The board
 * is turned 45° and the frame holds an off-centre slice.
 */
fun flipHyperbolic(c: Canvas, d: Dimension) {
    val w = d.w.toFloat()
    c.clear(ink)
    val arm = hookArm(run = w * 0.22f, bend = w * 0.13f, tail = w * 0.36f, n = 300)
    val arms = fourArms(arm)
    val n = 64
    val cell = w * 1.3f / n
    val rng = Random(1960)
    val front = 0.93f                              // how far the front has run (s units), hyperbolically warped
    c.fragment(d, rotDeg = 45f, zoom = 1.3f, fx = w * 0.12f, fy = w * 0.20f) {
        for (j in 0 until n) for (i in 0 until n) {
            val x = (i - n / 2f + 0.5f) * cell; val y = (j - n / 2f + 0.5f) * cell
            val nr = nearest(arms, x, y)
            val bandHalf = w * 0.045f
            // arrival time of the front at this disc: inverse of the hyperbolic reach
            val sWarp = Law.HYPERBOLIC.f(nr.s, 5f)
            var age = (front - sWarp) * 14f - (nr.d / bandHalf) * 3.2f + (rng.nextFloat() - 0.5f) * 0.6f
            if (nr.d > bandHalf * 1.25f) age = -1f
            disc(this, x, y, cell * 0.44f, turn(age))
        }
    }
    c.drawBorder(d, w * 0.035f, paper)
}

private fun smooth(t: Float) = t * t * (3f - 2f * t)

/** flip angle 0 (paper up) → π (red up) with a little settling wobble, per gart's Flip. */
private fun turn(age: Float): Float {
    if (age <= 0f) return 0f
    val rise = 2.6f
    if (age < rise) return (PI * (age / rise) * (age / rise)).toFloat()
    val wob = 0.35f * kotlin.math.exp(-(age - rise)) * sin((age - rise) * 4f)
    return (PI - abs(wob)).toFloat()
}

private fun disc(c: Canvas, cx: Float, cy: Float, r: Float, th: Float) {
    val ct = cos(th)
    val b = r * abs(ct)
    if (b < 0.4f) { c.drawLine(cx - r, cy, cx + r, cy, stroke(paper, 1.4f)); return }  // on its edge
    c.drawOval(Rect(cx - r, cy - b, cx + r, cy + b), fill(if (ct > 0f) paper else red))
}
