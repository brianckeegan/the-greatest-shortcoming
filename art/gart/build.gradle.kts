plugins {
    id("org.jetbrains.kotlin.jvm")
}

repositories {
    mavenCentral()
    maven("https://redirector.kotlinlang.org/maven/compose-dev")
}

dependencies {
    implementation("dev.oblac.gart:gart")
}

java { toolchain { languageVersion = JavaLanguageVersion.of(21) } }

kotlin {
    compilerOptions { freeCompilerArgs.add("-Xcontext-parameters") }
}

// `./gradlew render` draws every piece headless and writes square masters to renders/.
// `./gradlew render -Ppiece=Doubling` draws just one.
tasks.register<JavaExec>("render") {
    group = "art"
    description = "Render the square masters into renders/"
    classpath = sourceSets["main"].runtimeClasspath
    mainClass = "tgs.RenderAllKt"
    workingDir = projectDir
    jvmArgs("-Djava.awt.headless=true")
    args(listOfNotNull(providers.gradleProperty("piece").orElse("").get(), providers.gradleProperty("frame").orNull))
}
