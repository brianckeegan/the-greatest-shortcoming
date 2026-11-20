package tgs.echo

import dev.oblac.gart.Dimension
import dev.oblac.gart.color.RetroColors
import dev.oblac.gart.gfx.drawBorder
import org.jetbrains.skia.Canvas
import org.jetbrains.skia.PathBuilder
import tgs.fill
import tgs.stroke
import tgs.withAlpha

private val ink = RetroColors.black01
private val paper = RetroColors.white01
private val red = RetroColors.red01

/**
 * A · SWING, EXPONENTIAL — after gart's lines/swing (bands of parallel cream lines with
 * one orange line, folding on a dark ground). Four hooked bands leave the centre as a
 * single bundle and FAN OUT exponentially along their length: each band's width is
 * W0 + (W1−W0)·exp-law(s), so near the centre the lines nearly touch and at the hook
 * they splay wide. Framed at 45°, magnified, and off-centre: the frame holds the
 * crossing and parts of two-and-a-half arms, never the whole figure.
 */
fun swingExponential(c: Canvas, d: Dimension) {
    val w = d.w.toFloat()
    c.clear(ink)
    // a retro sun, off in an empty quadrant — never behind the crossing
    c.drawCircle(w * 0.78f, w * 0.24f, w * 0.11f, fill(RetroColors.yellow01))

    val arm = hookArm(run = w * 0.30f, bend = w * 0.16f, tail = w * 0.34f)
    val arms = fourArms(arm)
    val lines = 11
    // stroke weights step geometrically across the band (×1.22 per stripe), normalised so
    // the stripes together fill ~58% of it — the band is heavier on one edge than the other
    val q = 1.22f
    val weights = FloatArray(lines) { Math.pow(q.toDouble(), it.toDouble()).toFloat() }
    val wsum = weights.sum()
    c.fragment(d, rotDeg = 45f, zoom = 1.35f, fx = w * 0.32f, fy = w * 0.14f) {
        for (a in arms) {
            for (i in 0 until lines) {
                val col = if (i == 2) red else paper
                // ribbon i: centre offset and half-thickness both scale with the band width
                val pb = PathBuilder()
                val left = ArrayList<FloatArray>(); val right = ArrayList<FloatArray>()
                for (k in 0 until a.n step 2) {
                    val bw = w * (0.012f + 0.36f * Law.EXPONENTIAL.f(a.s[k], 2.4f))   // band width
                    val off = (i / (lines - 1f) - 0.5f) * bw
                    val half = bw * 0.58f * weights[lines - 1 - i] / wsum * 0.5f + w * 0.0005f
                    val nx = -a.ty[k]; val ny = a.tx[k]
                    left += floatArrayOf(a.x[k] + nx * (off - half), a.y[k] + ny * (off - half))
                    right += floatArrayOf(a.x[k] + nx * (off + half), a.y[k] + ny * (off + half))
                }
                pb.moveTo(left[0][0], left[0][1])
                for (p in left) pb.lineTo(p[0], p[1])
                for (p in right.asReversed()) pb.lineTo(p[0], p[1])
                drawPath(pb.closePath().detach(), fill(col))
            }
        }
    }
    c.drawBorder(d, w * 0.035f, paper)
}

/**
 * B · STRIPES, EXPONENTIAL — after gart's lines/stripes2 (a field of parallel lines,
 * bent). Upright cream lines fill the page; four hooked channels, set at 45°, push them
 * aside. Each channel's width grows exponentially along its arm, so the lines are
 * barely nudged at the centre and shoved hard apart at the hooks — the figure exists
 * only as the space the lines are forced out of. One line is red. Cropped off-centre.
 */
fun stripesExponential(c: Canvas, d: Dimension) {
    val w = d.w.toFloat()
    c.clear(ink)
    val arm = hookArm(run = w * 0.26f, bend = w * 0.15f, tail = w * 0.40f, n = 360)
    // the figure turned 45° and shifted, expressed directly in page coordinates
    val ox = w * 0.40f; val oy = w * 0.56f
    val arms = fourArms(arm).map { it.rotated(45f) }.map { l ->
        Line(FloatArray(l.n) { l.x[it] + ox }, FloatArray(l.n) { l.y[it] + oy }, l.tx, l.ty, l.s)
    }
    val count = 63                                   // 1+2+4+8+16+32: six doubling bands
    val gap = w / count
    // geometric colormap: line j takes colour floor(log2(j+1)), so the colour bands are
    // 1, 2, 4, 8, 16 and 32 lines wide — each band as wide as all the ones before it
    val ramp = listOf(paper, paper, RetroColors.yellow01, RetroColors.amber01, RetroColors.orange01, red)
    for (j in 0 until count) {
        val x0 = (j + 0.5f) * gap
        val pb = PathBuilder()
        var y = -w * 0.05f; var first = true
        var lx = 0f; var ly = 0f
        while (y <= w * 1.05f) {
            val nr = nearest(arms, x0, y)
            val ch = w * (0.004f + 0.075f * Law.EXPONENTIAL.f(nr.s, 3.4f))   // channel half-width
            // push the point out of the channel: strong inside, decaying outside
            val push = ch * kotlin.math.exp(-nr.d / ch)
            val px = x0 + nr.nx * push; val py = y + nr.ny * push
            // a line crossing a channel's centreline is pushed to opposite banks: break it
            // there instead of drawing a seam straight across the gap
            if (first || dist(px, py, lx, ly) > w * 0.02f) pb.moveTo(px, py) else pb.lineTo(px, py)
            first = false; lx = px; ly = py
            y += w * 0.003f
        }
        val band = 31 - Integer.numberOfLeadingZeros(j + 1)
        // geometric stroke weight: ×1.035 per line, ~8× from first to last
        val weight = w * 0.0011f * Math.pow(1.035, j.toDouble()).toFloat()
        c.drawPath(pb.detach(), stroke(withAlpha(ramp[band], 0.97f), weight))
    }
    c.drawBorder(d, w * 0.035f, paper)
}
