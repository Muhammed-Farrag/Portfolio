# Interactive particle portrait

Open particle-portrait-preview.html in a browser for the portable preview, or serve this source directory with any static web server.

The implementation uses HTML, CSS and WebGL without third-party dependencies. portrait.js contains the rendering and interactions. portrait.png is the generated amber treatment of the supplied photograph.

Move the pointer over the face to displace points. Click the portrait or Scatter & reform to scatter. Controls support three palettes, detail levels, force, pause, source comparison and reset. Reduced-motion preference starts paused. Canvas is backed by a static image fallback when WebGL is unavailable.

This is an original particle study inspired by EddyOS, not its fluid-photo-reveal implementation or a complete portfolio. No data is uploaded. No tracking or remote dependencies are included.

Verified: WebGL rendered 10,207 points at Ultra detail; detail, palette, source, pause and reset controls were exercised in the browser. Phone-width layout at 390px had no horizontal overflow. Browser warning/error log was empty during these checks. Reduced-motion handling was code-reviewed, not emulated in the browser. Real phone performance remains unmeasured.
