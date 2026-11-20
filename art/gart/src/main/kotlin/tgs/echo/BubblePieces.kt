package tgs.echo

import dev.oblac.gart.Dimension
import dev.oblac.gart.color.RetroColors
import dev.oblac.gart.gfx.drawBorder
import org.jetbrains.skia.Canvas
import tgs.fill
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.ln
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.random.Random

private val ink = RetroColors.black01
private val paper = RetroColors.white01
private val red = RetroColors.red01

private class Bub(val x: Float, val y: Float, val r: Float)

/**
 * Random-sequential circle packing, gart's bubbles convention (simpleCirclePacker),
 * except each point carries its own size ceiling: a candidate grows until it touches a
 * neighbour or reaches [target](x, y). A coarse spatial hash keeps it fast.
 */
private fun pack(
    rng: Random, x0: Float, y0: Float, x1: Float, y1: Float, attempts: Int,
    rMin: Float, pad: Float, cellSize: Float, seed: List<Bub>,
    target: (Float, Float) -> Float,
): List<Bub> {
    val nx = ((x1 - x0) / cellSize).toInt() + 1; val ny = ((y1 - y0) / cellSize).toInt() + 1
    val grid = Array(nx * ny) { ArrayList<Bub>(4) }
    val out = ArrayList<Bub>()
    var rMaxSeen = rMin
    fun insert(b: Bub) {
        val bi0 = max(0, ((b.x - b.r - x0) / cellSize).toInt()); val bi1 = min(nx - 1, ((b.x + b.r - x0) / cellSize).toInt())
        val bj0 = max(0, ((b.y - b.r - y0) / cellSize).toInt()); val bj1 = min(ny - 1, ((b.y + b.r - y0) / cellSize).toInt())
        for (cj in bj0..bj1) for (ci in bi0..bi1) grid[cj * nx + ci] += b
        rMaxSeen = max(rMaxSeen, b.r)
    }
    seed.forEach(::insert)
    repeat(attempts) {
        val x = x0 + rng.nextFloat() * (x1 - x0); val y = y0 + rng.nextFloat() * (y1 - y0)
        var allowed = target(x, y)
        if (allowed < rMin) return@repeat
        // look as far as the biggest circle that could reach us
        val reach = allowed + rMaxSeen + pad
        val ci0 = max(0, ((x - reach - x0) / cellSize).toInt()); val ci1 = min(nx - 1, ((x + reach - x0) / cellSize).toInt())
        val cj0 = max(0, ((y - reach - y0) / cellSize).toInt()); val cj1 = min(ny - 1, ((y + reach - y0) / cellSize).toInt())
        val seen = HashSet<Bub>()
        loop@ for (cj in cj0..cj1) for (ci in ci0..ci1) for (b in grid[cj * nx + ci]) {
            if (!seen.add(b)) continue
            allowed = min(allowed, hypot(x - b.x, y - b.y) - b.r - pad)
            if (allowed < rMin) break@loop
        }
        if (allowed < rMin) return@repeat
        val b = Bub(x, y, allowed); out += b; insert(b)
    }
    return out
}

/**
 * C · BUBBLES, EXPONENTIAL — after gart's bubbles gallery (Bubbles2, bubbub, BubbleStripe):
 * a relaxed, random circle packing in place of a halftone grid. Read from the tips inward,
 * the largest bubble allowed along each hooked arm grows EXPONENTIALLY, from 0.15% of
 * the page at the tips to 17% at the centre, where they aggregate — over 100×, two
 * orders of magnitude — and big bubbles carry a second, nested pack of
 * paper holes, a third order down. Off the arms the froth stays at the smallest size.
 * Colour steps once per doubling of radius (log₂ r), so the ramp counts the doublings.
 */
fun bubblesExponential(c: Canvas, d: Dimension) {
    val w = d.w.toFloat()
    c.clear(paper)
    val run = w * 0.30f; val bend = w * 0.18f; val tail = w * 1.2f
    val arm = hookArm(run = run, bend = bend, tail = tail, n = 700)
    val total = run + (PI / 2).toFloat() * bend + tail
    val lRef = run + (PI / 2).toFloat() * bend + w * 0.55f
    val arms = fourArms(arm)

    val rMin = w * 0.0015f; val rArm = w * 0.17f
    val ramp = listOf(ink, ink, 0xFF5C4A3A.toInt(), RetroColors.blue01, RetroColors.yellow01, RetroColors.orange01, red)
    val fx = w * 0.14f; val fy = w * 0.12f; val half = w * 0.95f
    val rng = Random(1838)

    // the field: tiny everywhere, exponentially larger along the arms
    fun target(x: Float, y: Float): Float {
        val nr = nearest(arms, x, y)
        val sg = min(nr.s * total / lRef, 1f)
        val onArm = rMin * Math.pow((rArm / rMin).toDouble(), (1f - sg).toDouble()).toFloat()   // exponential, largest at the centre
        val band = max(w * 0.025f, onArm * 1.15f)
        return if (nr.d < band) onArm else rMin * 1.6f
    }
    // pack big-first: a short pass with a high floor lays down the large bubbles, then
    // ever-lower floors fill the gaps, so the packing is not starved of big ones
    val all = ArrayList<Bub>()
    val floors = listOf(0.08f, 0.04f, 0.016f, 0.006f, 0.0025f, 0.0015f)
    for ((pi, f) in floors.withIndex()) {
        val got = pack(rng, fx - half, fy - half, fx + half, fy + half,
            attempts = if (pi < floors.size - 1) 60_000 else 520_000,
            rMin = w * f, pad = w * 0.0018f, cellSize = w * 0.02f,
            seed = all.toList(), target = ::target)
        all += got
    }
    c.fragment(d, rotDeg = 45f, zoom = 0.85f, fx = fx, fy = fy) {
        for (b in all) {
            val oct = (ln(b.r / rMin) / ln(2f)).toInt().coerceIn(0, ramp.size - 1)
            drawCircle(b.x, b.y, b.r, fill(ramp[oct]))
            // nested holes, BubbleStripe-style: big bubbles carry a pack of paper holes,
            // themselves up to a quarter of the parent's radius
            if (b.r > w * 0.03f) {
                val inner = Random((b.x * 31 + b.y).toInt())
                val holes = ArrayList<Bub>()
                repeat(900) {
                    val a = inner.nextFloat() * 2 * PI.toFloat(); val rr = sqrt(inner.nextFloat()) * b.r
                    val x = b.x + cos(a) * rr; val y = b.y + sin(a) * rr
                    var al = min(b.r * 0.26f, b.r - rr - w * 0.002f)
                    for (h in holes) al = min(al, hypot(x - h.x, y - h.y) - h.r - w * 0.0015f)
                    if (al > w * 0.0016f) holes += Bub(x, y, al)
                }
                for (h in holes) drawCircle(h.x, h.y, h.r, fill(withAlphaPaper(h.r / b.r)))
            }
        }
    }
    c.drawBorder(d, w * 0.035f, paper)
}

private fun withAlphaPaper(rel: Float): Int = if (rel > 0.12f) paper else 0xFFE8E0C6.toInt()
