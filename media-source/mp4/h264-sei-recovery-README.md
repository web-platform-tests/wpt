# H.264 SEI Recovery Point Test Files

## h264-sei-recovery-init.mp4

Init segment (ftyp + moov) for an open-GOP H.264 fMP4 stream.
Codec: avc1.640029 (H.264 High profile, level 4.1), 320x240, 24fps.

## h264-sei-recovery-media.mp4

Media segment (moof + mdat) starting with an SEI recovery point
(recovery_frame_cnt=0) followed by non-IDR frames. No IDR frame
is present in this segment. This is used to test that browsers
accept SEI recovery points as valid random access points for MSE.

## Generation

1. Generate a 2-second open-GOP H.264 source:

```
ffmpeg -y -f lavfi -i "testsrc2=size=320x240:rate=24:duration=2" \
    -c:v libx264 -preset fast -profile:v high -level 41 \
    -x264-params "keyint=24:min-keyint=24:bframes=3:open-gop=1" \
    -pix_fmt yuv420p -an \
    -movflags +frag_keyframe+empty_moov+default_base_moof \
    output.mp4
```

This produces two fragments:
- Fragment 1: IDR keyframe + non-keyframes
- Fragment 2: SEI recovery point (recovery_frame_cnt=0) + non-keyframes

2. Split the fMP4 into init segment (ftyp + moov) and second media
   segment (moof + mdat) using a script that parses MP4 box boundaries.
