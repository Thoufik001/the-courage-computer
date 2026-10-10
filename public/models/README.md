# Optional model replacements

No model is required. The original procedural diary and table are the defaults.

- `diary.glb`: model in metres, Y up, centre at the closed book centre, footprint 2.62 × 3.58 along X/Z. Back cover at Y=0. The writable page corners must be (-1.2, .31, -1.625) through (1.2, .31, 1.625). Include a group `CoverHinge` at (-1.31, .32, 0) that opens around local Z from 0 to π. Once loaded, this model replaces the procedural book.
- `table.glb`: tabletop centred at the world origin, top surface Y=-.02, approximately 22 × 18 along X/Z. It replaces the procedural table when successfully loaded.

Draco and KTX2 decoders are served locally under `/decoders/`. Decoder files are distributed with Three.js; see its MIT license. The files are optional; malformed models leave the procedural fallback available. A missing CoverHinge will make an imported book static: author the hinge before using it.
