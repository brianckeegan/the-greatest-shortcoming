// Sketches for The Greatest Shortcoming, built on gart (vendored by ./setup.sh).
// gart isn't on Maven, so it's pulled in as a composite build and its `:gart` module is
// substituted for the dev.oblac.gart:gart coordinate used in build.gradle.kts.
pluginManagement {
    plugins {
        id("org.jetbrains.kotlin.jvm") version "2.3.20"   // match gart's kotlinVersion
    }
}

plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

rootProject.name = "tgs-art"

includeBuild("vendor/gart") {
    dependencySubstitution {
        substitute(module("dev.oblac.gart:gart")).using(project(":gart"))
    }
}
