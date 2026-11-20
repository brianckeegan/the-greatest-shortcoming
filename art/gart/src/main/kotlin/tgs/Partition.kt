package tgs

import dev.oblac.gart.Dimension
import org.jetbrains.skia.Canvas
import org.jetbrains.skia.Rect
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.random.Random

/**
 * PARTITION — rects gallery. Countable growth (×4 per split), mirror symmetry (D4), ominous.
 *
 * The land, divided. A quadtree: a square splits into four, each of those into four...
 * The rule for when to split is exponential in distance: out at the rim a parcel can
 * stay vast; toward the centre the allowed size halves every ~130 px, so the parcels
 * multiply ×4 per step until the dividing lines themselves are all there is — the
 * centre goes black with borders and red with claims. The colouring is folded onto
 * one octant before it's chosen, so mirror-image parcels always match.
 */
fun partition(c: Canvas, d: Dimension) {
    val w = d.w.toFloat(); val cx = d.cx; val cy = d.cy
    val maxDist = hypot(cx, cy)
    c.clear(Pal.black)

    // capped, so even the rim is a field of parcels rather than a few flat slabs
    fun maxSize(dist: Float) = min(260f, 7f * 2f.pow(dist / 130f))

    fun parcel(x: Float, y: Float, s: Float) {
        val mx = x + s / 2; val my = y + s / 2
        val dist = hypot(mx - cx, my - cy)
        if (s > maxSize(dist) && s > 6f) {
            val h = s / 2
            parcel(x, y, h); parcel(x + h, y, h); parcel(x, y + h, h); parcel(x + h, y + h, h)
            return
        }
        // fold the parcel's centre into one octant → identical colour across its 8 mirrors
        val a = (kotlin.math.abs(mx - cx)).roundToInt(); val b = (kotlin.math.abs(my - cy)).roundToInt()
        val rng = Random(min(a, b) * 7919 + max(a, b) * 104729 + s.roundToInt())
        val near = 1f - dist / maxDist                       // 0 at the corners, 1 at the centre
        val r = rng.nextFloat()
        val col = when {
            r < 0.06f + 0.42f * near * near -> Pal.swissRed  // claims thicken toward the centre
            r < 0.12f + 0.55f * near * near -> Pal.black
            r < 0.16f + 0.55f * near * near -> Pal.grey
            r < 0.175f + 0.55f * near * near && s > 120f -> Pal.blue   // rare, rim only
            else -> Pal.white
        }
        val line = (s * 0.06f).coerceIn(1.6f, 13f)            // borders don't shrink as fast as parcels
        val rect = Rect.makeXYWH(x + line / 2, y + line / 2, s - line, s - line)
        if (s - line > 0.5f) c.drawRect(rect, fill(col))
    }
    parcel(0f, 0f, w)
    // outer border
    c.drawRect(Rect.makeXYWH(0f, 0f, w, w), stroke(Pal.black, 18f))
}
