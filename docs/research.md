This document outlines the upgrades that are research-grade, and capable of improving system reliability and performance exponentially, but were infeasible for prototyping and edge-deployment.


### Image Processing and Quality Enhancements
- Camera calibration with distortion coefficients.
- Fisheye/Barrel distortion correction
- Zero-DCE++ neural enhancement for severe darkness, instead of just CLAHE
- MPRNet deraining
- MPRNet deblurring
- JPEG decompression artifiact removal
- Image quality measurement

### Vehicle and Road User Detection
- RT-DETR-L as a secondary accuracy model.
- 13 annotation classes (only 4 classes implemented)
- Driver interior detection via ResNet on windshield crops

### Traffic Violation Detection
- Many features offloaded to LLM because manual annotation of large amounts of data required.
    - Yolo on torso for detecting seatbelt-compliance
    - Wrong-side driving via SegFormer and Lane Detection
    - Stop Line violation via Canny
    - Mobile phone use via hand-region classifier on driver corps
    - Children detection in triple-riding, height based

### Violation Classification adn Confidence Scoring
- Three-tier threshold policy (only two-tier and no review queue routing)

### License Plate Recognition
- Dedicated YOLO model for plate detection
- Partial occlusion handling
- Plate confidence estimation via vehicle distance estimation

