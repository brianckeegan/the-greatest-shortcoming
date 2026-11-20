package tgs

import dev.oblac.gart.Dimension
import org.jetbrains.skia.Canvas
import org.jetbrains.skia.Image
import org.jetbrains.skia.ImageInfo
import kotlin.random.Random

/**
 * COLONY — pixelmania gallery. Countable doubling, mirror symmetry (D4), ominous.
 *
 * An actual growth process, not a picture of one: an Eden model — the textbook model of
 * a bacterial colony on a plate — where every step a random cell on the colony's edge
 * divides into empty space. Each new cell is added together with its seven mirror
 * images, so the colony is exactly four-way symmetric while its edge stays ragged and
 * alive. Cells are banded by GENERATION: generation g is the 2^g cells that took the
 * population from 2^g to 2^(g+1). The colony stops at 2^15 cells, so the final
 * generation — the red rim — is exactly half of everything on the plate. The bands
 * widen as they go out because each holds as many cells as all the bands inside it.
 * Rendered as a raw pixel buffer with grain, in the pixelmania manner.
 */
fun colony(c: Canvas, d: Dimension) {
    val G = 256                              // grid cells per side
    val cellPx = d.w / G                     // 8 px at 2048
    val target = 1 shl 15                    // stop at 2^15 cells
    val rng = Random(1972)                   // seed incidental; deterministic render

    val gen = IntArray(G * G) { -1 }         // generation at birth, -1 = empty
    val frontier = IntArray(G * G); var fn = 0
    val inFrontier = BooleanArray(G * G)
    var pop = 0

    fun orbit(i: Int, j: Int): List<Int> {
        val ii = G - 1 - i; val jj = G - 1 - j
        return listOf(i to j, ii to j, i to jj, ii to jj, j to i, jj to i, j to ii, jj to ii)
            .map { (a, b) -> b * G + a }.distinct()
    }
    fun pushNeighbours(k: Int) {
        val x = k % G; val y = k / G
        for ((dx, dy) in arrayOf(1 to 0, -1 to 0, 0 to 1, 0 to -1)) {
            val nx = x + dx; val ny = y + dy
            if (nx !in 0 until G || ny !in 0 until G) continue
            val nk = ny * G + nx
            if (gen[nk] < 0 && !inFrontier[nk]) { frontier[fn++] = nk; inFrontier[nk] = true }
        }
    }
    fun add(k: Int) {
        if (gen[k] >= 0) return
        pop++
        gen[k] = 31 - Integer.numberOfLeadingZeros(pop)        // floor(log2(n)) for the n-th cell
        pushNeighbours(k)
    }

    for (k in orbit(G / 2 - 1, G / 2 - 1)) add(k)                // the founding cells
    while (pop < target && fn > 0) {
        val pick = rng.nextInt(fn)
        val k = frontier[pick]
        frontier[pick] = frontier[--fn]; inFrontier[k] = false
        if (gen[k] >= 0) continue
        for (o in orbit(k % G, k / G)) add(o)
    }
    val last = 14                                                  // cells 2^14 .. 2^15-1
    for (k in gen.indices) if (gen[k] > last) gen[k] = last       // the ≤7 overflow cells

    // generation → colour: an ink core, then blue / mustard / clay bands, the last half red
    fun colorOf(g: Int): Int = when {
        g < 0 -> Pal.cream
        g <= 9 -> Pal.ink
        g == 10 -> Pal.blue
        g == 11 -> Pal.mustard
        g == 12 -> 0xFF5C4A3A.toInt()        // umber
        g == 13 -> 0xFFC9B79A.toInt()        // clay
        else -> Pal.red                      // the final doubling
    }

    // raw BGRA pixels with per-pixel grain
    val W = d.w; val H = d.h
    val px = ByteArray(W * H * 4)
    for (y in 0 until H) for (x in 0 until W) {
        val k = (y / cellPx).coerceAtMost(G - 1) * G + (x / cellPx).coerceAtMost(G - 1)
        var col = colorOf(gen[k])
        val r = rng.nextFloat()
        col = if (gen[k] < 0) {
            if (r < 0.025f) Pal.ink else col                      // dust on the plate
        } else when {
            r < 0.10f -> Pal.cream                                // speckle of the medium
            r < 0.14f -> Pal.ink
            else -> col
        }
        val o = (y * W + x) * 4
        px[o] = (col and 0xFF).toByte()
        px[o + 1] = ((col shr 8) and 0xFF).toByte()
        px[o + 2] = ((col shr 16) and 0xFF).toByte()
        px[o + 3] = 0xFF.toByte()
    }
    val img = Image.makeRaster(ImageInfo.makeN32Premul(W, H), px, W * 4)
    c.drawImage(img, 0f, 0f)
    println("  colony: $pop cells, last generation = ${gen.count { it == last }} cells")
}
