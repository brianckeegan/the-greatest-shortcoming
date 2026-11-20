package tgs

import dev.oblac.gart.Gart
import dev.oblac.gart.Dimension
import org.jetbrains.skia.Canvas
import java.io.File

/** A square master: a name, and a draw function onto an S×S canvas. */
class Piece(val name: String, val draw: (Canvas, Dimension) -> Unit)

const val S = 2048   // master size; crops for plate / title card / cover come later

val pieces: List<Piece> = listOf(
    Piece("inscribed", ::inscribed),
    Piece("undamped", ::undamped),
    Piece("twelve-oclock", ::twelveOclock),
    Piece("ugunskrusts-field", ::fireCross),
    Piece("meander", ::meander),
    Piece("colony", ::colony),
    Piece("partition", ::partition),
)

fun main(args: Array<String>) {
    val only = args.firstOrNull().orEmpty()
    File("renders").mkdirs()
    for (p in pieces) {
        if (only.isNotEmpty() && !p.name.equals(only, ignoreCase = true)) continue
        val gart = Gart.of(p.name, S, S)
        val g = gart.gartvas()
        val t0 = System.currentTimeMillis()
        p.draw(g.canvas, gart.d)
        gart.saveImage(g, "renders/${p.name}.png")
        println("rendered ${p.name}  (${System.currentTimeMillis() - t0} ms)")
    }
}
