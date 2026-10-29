# Floral artwork

Mode: built-in ImageGen. Use case: illustration-story.

Final project asset: `dist/assets/floral-border.webp` (optimized from the original
PNG, approximately 296 KB). This file is self-contained in the new app.

Prompt:

> Asset type: full-screen botanical border for an elegant digital wedding invitation.
> Create an original high quality watercolor floral stationery background, portrait
> 2:3 composition. Warm ivory handmade paper (#fbf7ef) with lush hand-painted ivory
> garden roses, pale blush pink roses and cherry blossom sprays, muted sage and
> eucalyptus leaves. Florals richly clustered at upper left and lower right, with
> delicate trailing flowers along the edges; keep 65 percent center completely
> empty ivory for real HTML text. Fine art botanical watercolor, soft translucent
> paint, refined and airy, romantic Sri Lankan wedding stationery mood,
> sophisticated rather than cartoon. Cream, dusty rose, soft pink, sage, tiny
> antique gold details. No lettering, no text, no monograms, no frames, no people,
> no watermark. Artwork should feel tactile and detailed, gorgeous floral blooms,
> vertical composition.

# Superseded video-style running couple

This experiment was replaced after the user selected the original ivory-and-gold
couple. It is no longer used by the app. See `COUPLE-ASSETS.md` for the current
assets and exact generation prompt. The earlier files are retained only in the
ignored local `reference/` folder.

Mode: built-in ImageGen, using the supplied video's opening frame as a fashion
and facing-direction reference. Project asset: `dist/assets/kandyan-couple-sheet.webp`.
The original PNG is retained beside it. This is a generated original illustration,
not a cutout of the characters in the phone recording.

Prompt direction: a precise 5-column, 2-row transparent sprite sheet. Top row is
a smiling Kandyan groom, facing right, wearing a cream-and-gold traditional hat,
a dark embroidered ceremonial jacket, ivory sarong trousers, and dark shoes.
Bottom row is a bride facing left, in a white/ivory osariya with embroidered
details, hair bun and jasmine flowers, a bouquet and a trailing sari scarf.
Columns 1–4 show successive running poses; column 5 shows each standing still.
Keep faces, scale and clothing consistent; use detailed hand-painted wedding
illustration rather than geometric vector figures. No text, phone, UI, logos or
background. A second refinement requested smaller figures and consistent
baselines within equal 307-by-512 grid cells on a 1536-by-1024 transparent canvas.

The app displays selected viewports from this sheet and switches frames while
the groom travels from the left and bride from the right, then uses the standing
poses. Reduced motion shows the standing pose immediately.

Final refinement prompt (built-in ImageGen, with the first generated sheet as
the edit target):

> Refine this animation sprite sheet, preserving exactly the beautiful detailed
> illustrated characters, identities, faces, outfits, colors and directions.
> Critical production correction: create a STRICT UNIFORM 5 COLUMNS x 2 ROWS
> sprite sheet on a 1536 x 1024 transparent canvas. Imagine ten cells of width307
> height512. Every character must be noticeably SMALLER than in the reference:
> entire figure INCLUDING HAT VEIL AND FEET fits in central 240 pixels of each
> 307px-wide cell and 390px height of each512px-tall cell. A minimum30px EMPTY
> TRANSPARENT MARGIN on left and right of EVERY CELL. ALL GROOM FEET ALIGNED TO
> ROW BASELINE at y470. ALL BRIDE FEET ALIGNED TO ROW BASELINE at y982. No part
> of any sprite crosses a cell boundary. No frame borders or grid lines. Top row
> groom looking RIGHT, bottom row bride looking LEFT. Columns1-4 are four visibly
> DIFFERENT sequential RUNNING gait poses of the same person: extended forward
> leg / passing position / opposite extended leg / opposite passing position,
> clearly bend and alternate the legs; bride sari should drape consistently
> across each different leg position, same scale in all cells. Column5 is the
> matching STANDING STILL relaxed pose of the same person, same full-body height
> and same feet baseline, groom smiling to right and bride smiling to left with
> bouquet. No white or brown background, absolutely transparent background
> outside figures; no glow or background shadows. Do not add UI or text. Clean
> professional game sprite sheet asset.
