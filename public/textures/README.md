# Surface assets

The project includes these unmodified CC0 Poly Haven 1K JPEG maps, downloaded through https://api.polyhaven.com/files/ on 2026-10-08. No reference-image pixels or film assets are used.

| Local filename | Exact asset download |
|---|---|
| wood-map.jpg | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/wood_table_worn/wood_table_worn_diff_1k.jpg |
| wood-normalMap.jpg | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/wood_table_worn/wood_table_worn_nor_gl_1k.jpg |
| wood-roughnessMap.jpg | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/wood_table_worn/wood_table_worn_rough_1k.jpg |
| leather-map.jpg | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/brown_leather/brown_leather_albedo_1k.jpg |
| leather-normalMap.jpg | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/brown_leather/brown_leather_nor_gl_1k.jpg |
| leather-roughnessMap.jpg | https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/brown_leather/brown_leather_rough_1k.jpg |

Asset pages: https://polyhaven.com/a/wood_table_worn and https://polyhaven.com/a/brown_leather. License: https://polyhaven.com/license . Leather is tinted near-black in the material.

Paper and stone use original deterministic procedural color, normal and roughness maps. All surfaces fall back to procedural maps if their files are removed. Optional replacements use `paper-map.jpg`, `paper-normalMap.jpg`, `paper-roughnessMap.jpg` (likewise `stone`). PNG and WebP extensions also work. Use original or CC0 assets only, OpenGL normal maps, sRGB for color and linear data for normal/roughness. Restart after adding files in a production Next build; development discovers them on the next server render.
