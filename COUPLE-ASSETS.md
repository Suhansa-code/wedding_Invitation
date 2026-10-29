# Selected original couple

The opening now uses the couple explicitly selected by the user: the bride in
an ivory/gold sari with jasmine and gold hair jewellery, and the bearded groom
in an ivory coat with an embroidered gold stole. They match the existing hero.

Final meeting pose: `dist/assets/couple.webp` is the unmodified original image.
Running poses: `dist/assets/original-couple-run.webp`, generated from the original
image as the identity reference using built-in ImageGen. The source PNG is kept
locally at `reference/original-couple-run-sheet.png`. The figures enter from their
original image positions (bride left, groom right) and resolve into the original
hand-holding pose. The earlier video-style Kandyan costumes are no longer used.

Generation prompt:

> Use case: identity-preserve. Create an animation sprite sheet derived ONLY from the provided couple image. These are the EXACT two character identities to preserve: same faces, eyes, hair, beard, skin tone, jewellery, outfit colors, and polished soft 3D cartoon rendering. Do not redesign or substitute either character. Bride: the woman from this reference with large warm brown eyes, side-parted dark hair in a low flower bun, cream-white jasmine flowers and gold head chains, ivory and gold sari, gold short-sleeved blouse, gold necklaces, bangles and a small cascading white/cream rose bouquet. Groom: the man from this reference with swept-back black quiff hair, big brown eyes, a FULL BLACK BEARD AND MOUSTACHE, ivory high-collared wedding coat, long richly embroidered GOLD STOLE over one shoulder, ivory traditional lower garment and dark brown shoes. No hat, no black jacket, no veil redesign, no clean-shaven groom, no flat vector drawing. STRICT sprite sheet on 1536x1024 transparent canvas: FOUR EQUAL COLUMNS and TWO EQUAL ROWS, each cell384x512. Top row bride FACING RIGHT towards groom, bottom row groom FACING LEFT towards bride. Columns1-4 show four distinct frames of the running-in-place gait: stride1 forward foot, passing pose, stride2 opposite foot, passing pose. Arms swing, clothing moves, bride holds her bouquet safely. The heads and bodies keep the reference's proportions and recognizable character identity in every cell. Entire each figure fits within central260pixels width and400pixels height of its384x512 cell. Clear transparent margins on every side; no overlapping cells, no neighboring pieces. Consistent scale and feet baseline in each row. Soft detailed realistic 3D animated-film shading and embroidery exactly like source. No background, no scenery, no text, no borders, no cell labels. True transparent alpha outside characters. The source image is a character identity reference, not a pose reference; change only poses and facing direction necessary for running.
