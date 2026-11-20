package tgs

import org.jetbrains.skia.Paint
import org.jetbrains.skia.PaintMode

/**
 * Palettes. Every piece is anchored on red / white / black; the mid-century families
 * around those anchors vary piece to piece (site, Saul Bass poster, Eames/atomic, Swiss).
 */
object Pal {
    // site palette (assets/css/src/main.css)
    val ink = 0xFF1A1A1A.toInt()
    val red = 0xFFB0382A.toInt()
    val blue = 0xFF285079.toInt()
    val mustard = 0xFFE0A52F.toInt()
    val cream = 0xFFECE4D2.toInt()

    // retro / sf (gart RetroColors family) — warm paper, charcoal, vermilion
    val paper = 0xFFD9D1B4.toInt()
    val charcoal = 0xFF2E2E29.toInt()
    val vermilion = 0xFFCC4B26.toInt()

    // Saul Bass poster
    val tomato = 0xFFE03C28.toInt()
    val offWhite = 0xFFF4EFE4.toInt()
    val ochre = 0xFFC98A1E.toInt()

    // Eames / atomic
    val teal = 0xFF2F7F7A.toInt()
    val olive = 0xFF7C7A3A.toInt()
    val burnt = 0xFFC2612B.toInt()

    // Swiss
    val swissRed = 0xFFE2231A.toInt()
    val black = 0xFF111111.toInt()
    val white = 0xFFF7F5F0.toInt()
    val grey = 0xFF8A8A85.toInt()
}

fun fill(color: Int) = Paint().apply { this.color = color; isAntiAlias = true; mode = PaintMode.FILL }
fun stroke(color: Int, w: Float) = Paint().apply { this.color = color; isAntiAlias = true; mode = PaintMode.STROKE; strokeWidth = w }
fun withAlpha(color: Int, a: Float): Int = (color and 0x00FFFFFF) or ((a.coerceIn(0f, 1f) * 255).toInt() shl 24)
