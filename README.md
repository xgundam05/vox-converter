# vox-converter
Convert Voxel-based models into printable STL format models.

**Overview**

This tool was written to facilitate creating 3D-printed miniatures from Voxel models.
I needed something to easily convert MagicaVoxel format models into STL for a series
of 3D-printed tabletop miniatures I was working on.

Currently the tool only supports MagicaVoxel files, however, other model formats should
be "fairly simple" to include. As long as the import class generates a VoxModel object.

**Features**

 * Import models from MagicaVoxel
 * Export models to binary and ascii STL
 * View printed mass based on voxel size and selected material *(currently ABS and PLA)*

**Known Issues**

 * The generated binary STL file seems to not play nice with Shapeways. At least when created on a Linux box.
