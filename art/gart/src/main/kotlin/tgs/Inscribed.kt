package tgs

import dev.oblac.gart.Dimension
import org.jetbrains.skia.Canvas
import org.jetbrains.skia.ClipMode
import org.jetbrains.skia.Path
import org.jetbrains.skia.PathBuilder

/**
 * INSCRIBED — retro gallery. Countable doubling, mirror symmetry (D4), seductive.
 *
 * A square, the diamond that circumscribes it, the square that circumscribes that, ...
 * Each figure has exactly twice the area of the one inside it, so every ring holds as
 * much area as everything it encloses: the last ring is half the whole, the way the
 * bottle is half full at 11:59. The halftone dots sit on one fixed grid, so the dot
 * COUNT doubles ring by ring too — from a single vermilion dot (the first bacterium)
 * to ~2,000 in the outermost ring, which is vermilion again (the last minute).
 */
fun inscribed(c: Canvas, d: Dimension) {
    val cx = d.cx; val cy = d.cy
    val levels = 12                       // 12 doublings: 1 → 2^12 in area
    val outer = d.w * 0.45f               // half-side of the outermost (axis-aligned) square
    val spacing = d.w * 0.0137f           // fixed halftone pitch → innermost square holds ~1 dot

    c.clear(Pal.paper)

    // figure m (0 = outermost): even m → axis square, odd m → diamond (45°).
    fun figure(m: Int): Path {
        val pb = PathBuilder()
        if (m % 2 == 0) {
            val a = outer / (1 shl (m / 2)).toFloat()
            pb.moveTo(cx - a, cy - a).lineTo(cx + a, cy - a).lineTo(cx + a, cy + a).lineTo(cx - a, cy + a)
        } else {
            val b = outer / (1 shl ((m - 1) / 2)).toFloat()
            pb.moveTo(cx, cy - b).lineTo(cx + b, cy).lineTo(cx, cy + b).lineTo(cx - b, cy)
        }
        return pb.closePath().detach()
    }

    val gridHalf = (outer / spacing).toInt() + 1
    fun dots(color: Int, rFrac: Float) {
        val p = fill(color)
        for (i in -gridHalf..gridHalf) for (j in -gridHalf..gridHalf) {
            c.drawCircle(cx + i * spacing, cy + j * spacing, spacing * rFrac, p)
        }
    }

    // ring k = figure(k) minus figure(k+1); k = levels is the innermost figure itself.
    for (k in 0..levels) {
        c.save()
        c.clipPath(figure(k), ClipMode.INTERSECT, true)
        if (k < levels) c.clipPath(figure(k + 1), ClipMode.DIFFERENCE, true)
        when {
            k == 0 -> dots(Pal.vermilion, 0.40f)            // the last doubling: half the whole
            k == levels -> dots(Pal.vermilion, 0.40f)       // the first bacterium
            k % 2 == 1 -> { c.clear(Pal.charcoal); dots(Pal.paper, 0.17f) }   // dark ring
            else -> dots(Pal.charcoal, 0.27f)                                  // light ring
        }
        c.restore()
    }

    // hairline edges so the doubling geometry reads crisply
    val edge = stroke(Pal.charcoal, d.w * 0.0012f)
    for (k in 0..levels) c.drawPath(figure(k), edge)
}
