package tgs

import dev.oblac.gart.Dimension
import dev.oblac.gart.noise.OpenSimplexNoise
import org.jetbrains.skia.Canvas
import org.jetbrains.skia.PaintStrokeCap
import org.jetbrains.skia.PathBuilder
import kotlin.math.PI
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.sin
import kotlin.random.Random

/**
 * UGUNSKRUSTS (FIELD) — flowforce gallery. Felt growth. ROTATIONAL symmetry (C4).
 *
 * ⚠ DELIBERATE ECHO. This is one of the flagged pieces that knowingly lets four-way
 * ROTATION drift toward a hooked cross. The reference is the Baltic fire cross
 * (Latvian ugunskrusts) — a folk sun/fire ornament on cloth and metalwork long before
 * it was captured as an emblem of exclusion — which is the book's own subject: images
 * of growth and soil taken up by politics. So the echo is allowed to emerge from the
 * GROWTH, never stated as an emblem: four streams of filaments ride outward along
 * log-spiral (equiangular) currents, thickening and brightening as they go, and only at
 * a squint does the whole curl into the shape. Constraints held on purpose: charcoal
 * ground (not a red field), no white disc, no isolated 45° hooked cross.
 *
 * One arm is simulated in a canonical frame and stamped four times by rotation, so
 * the symmetry is exact.
 */
fun fireCross(c: Canvas, d: Dimension) {
    val cx = d.cx; val cy = d.cy; val w = d.w.toFloat()
    val rng = Random(1934)                 // seed choice incidental; deterministic render
    val noise = OpenSimplexNoise(7L)
    c.clear(Pal.charcoal)

    // Eames / atomic around the anchors: vermilion + cream lead, teal/mustard/olive recede
    val colors = listOf(
        Pal.vermilion to 0.30f, Pal.cream to 0.26f, Pal.mustard to 0.16f,
        Pal.teal to 0.14f, Pal.olive to 0.08f, Pal.burnt to 0.06f,
    )
    fun pick(): Int {
        var x = rng.nextFloat()
        for ((col, wt) in colors) { if (x < wt) return col; x -= wt }
        return colors.last().first
    }

    // The current starts out radial and bends tangential as it grows: the turn grows
    // with r^1.7, so each arm runs straight out and then sweeps sideways at the rim.
    // That late hook is the echo; a constant-pitch spiral just reads as a vortex.
    // Capped below a quarter-turn, so no filament ever goes fully tangential and orbits.
    val maxTurn = (PI * 0.5 * 0.72).toFloat()
    val rRef = w * 0.5f
    val step = w * 0.0022f
    val half = w * 0.62f

    // One arm's filaments, in canonical coordinates (arm centred on +x). Two populations:
    // FIELD filaments seed anywhere in the quarter at any radius and are dim; CORE
    // filaments seed in a narrow fan at the origin and are bright. The four-armed hook
    // must exist only as a brighter current inside a full field — an earlier pass with
    // core filaments alone resolved into a clean, isolated emblem, which is exactly what
    // this piece is not allowed to be.
    class Trail(val pts: FloatArray, val n: Int, val color: Int, val wScale: Float, val alpha: Float)
    val trails = ArrayList<Trail>()
    val fieldColors = listOf(Pal.teal, Pal.olive, Pal.mustard, Pal.cream)
    repeat(900) { idx ->
        val core = idx % 3 == 0
        var a: Float; var r: Float
        if (core) {
            a = (rng.nextFloat() - 0.5f) * 0.30f
            r = w * (0.008f + rng.nextFloat() * 0.03f)
        } else {
            a = (rng.nextFloat() - 0.5f) * (PI / 2).toFloat()   // anywhere in the quarter
            r = w * (0.02f + rng.nextFloat() * 0.40f)
        }
        var x = r * cos(a); var y = r * sin(a)
        val buf = FloatArray(2 * 900); var n = 0
        for (s in 0 until 900) {
            buf[2 * n] = x; buf[2 * n + 1] = y; n++
            r = hypot(x, y); a = atan2(y, x)
            val nz = noise.random2D(x / (w * 0.18f), y / (w * 0.18f))
            val turn = maxTurn * (r / rRef).coerceAtMost(1f).let { Math.pow(it.toDouble(), 1.7).toFloat() }
            val dir = a + turn + nz * 0.42f
            // speed grows with radius: the stream accelerates as it spreads (felt growth)
            val v = step * (1f + r / (w * 0.12f))
            x += v * cos(dir); y += v * sin(dir)
            if (x * x + y * y > half * half) break
        }
        trails += if (core) Trail(buf, n, pick(), 0.6f + rng.nextFloat() * 0.8f, 1f)
        else Trail(buf, n, fieldColors[rng.nextInt(fieldColors.size)], 0.4f + rng.nextFloat() * 0.6f, 0.38f)
    }

    c.rotate4(cx, cy) {
        for (t in trails) {
            // draw in short runs so width and alpha can swell along the filament
            val runs = 6
            for (k in 0 until runs) {
                val i0 = t.n * k / runs; val i1 = minOf(t.n - 1, t.n * (k + 1) / runs)
                if (i1 - i0 < 2) continue
                val pb = PathBuilder().moveTo(t.pts[2 * i0], t.pts[2 * i0 + 1])
                for (i in i0 + 1..i1) pb.lineTo(t.pts[2 * i], t.pts[2 * i + 1])
                val f = (k + 1f) / runs
                val p = stroke(withAlpha(t.color, (0.18f + 0.55f * f) * t.alpha), w * 0.0011f * t.wScale * (0.5f + 2.6f * f * f))
                    .apply { strokeCap = PaintStrokeCap.ROUND }
                drawPath(pb.detach(), p)
            }
        }
    }
    // the ember at the origin, where all four streams begin as one cell
    c.drawCircle(cx, cy, w * 0.012f, fill(Pal.vermilion))
}
