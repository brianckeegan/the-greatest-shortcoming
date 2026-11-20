package tgs

import dev.oblac.gart.Gart
import dev.oblac.gart.Dimension
import dev.oblac.gart.fx.downsample
import dev.oblac.gart.fx.supersampled
import org.jetbrains.skia.Canvas
import tgs.echo.bubblesExponential
import tgs.echo.lawsField
import tgs.echo.swingCover
import tgs.echo.swingExponential
import java.io.File

/** A square master: a name, a draw function onto an S×S canvas, and a supersample factor. */
class Piece(val name: String, val ss: Int = 1, val w: Int = S, val h: Int = S, val draw: (Canvas, Dimension) -> Unit)

const val S = 2048   // master size; crops for plate / title card / cover come later

val pieces: List<Piece> = listOf(
    // round one
    Piece("inscribed", draw = ::inscribed),
    Piece("undamped", draw = ::undamped),
    Piece("twelve-oclock", draw = ::twelveOclock),
    Piece("ugunskrusts-field", draw = ::fireCross),
    Piece("meander", draw = ::meander),
    Piece("colony", draw = ::colony),
    Piece("partition", draw = ::partition),
    // echo fragments — flagged series, see tgs/echo/Fragments.kt
    Piece("echo-a-swing-exponential", ss = 2, draw = ::swingExponential),
    Piece("echo-c-bubbles-exponential", ss = 2, draw = ::bubblesExponential),
    Piece("echo-g-four-laws-flowforce", draw = ::lawsField),
    // cover: 6×9 in at 300 dpi plus 0.125 in bleed all round = 1875 × 2775 px, full bleed
    Piece("cover-a-swing", w = 1875, h = 2775, draw = ::swingCover),
)

fun main(args: Array<String>) {
    val only = args.firstOrNull().orEmpty()
    // optional cover framing override for exploring: ax,ay,zoom
    args.getOrNull(1)?.split(",")?.map { it.toFloat() }?.let {
        tgs.echo.coverAx = it[0]; tgs.echo.coverAy = it[1]; tgs.echo.coverZoom = it[2]
    }
    File("renders").mkdirs()
    for (p in pieces) {
        if (only.isNotEmpty() && !p.name.startsWith(only, ignoreCase = true)) continue
        val gart = Gart.of(p.name, p.w, p.h)
        val t0 = System.currentTimeMillis()
        val g = if (p.ss > 1) {
            // gart's own supersample → downsample, as the retro gallery pieces do
            val big = gart.supersampled(p.ss)
            p.draw(big.canvas, big.d)
            big.downsample(p.ss)
        } else {
            gart.gartvas().also { p.draw(it.canvas, gart.d) }
        }
        gart.saveImage(g, "renders/${p.name}.png")
        println("rendered ${p.name}  (${System.currentTimeMillis() - t0} ms)")
    }
}
