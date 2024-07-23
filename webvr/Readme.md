This directory contains a set of WebVR specific tests. Each html file corresponds to one test.

VRSimulator.js is intended for mocking the underlying MR/VR platform.
Here is more detail on the API that is found in VRSimulator. These must be implemented in accordance with the behavior of the underlying platform being simulated:
- AttachVRDisplay - Synthetically attaches a VR device to the system. Takes no parameters.
- DetachVRDisplay - Removes the VR device from the system. Takes no parameters.
- UserConsentRequestPresent - Simulates a user click on the element with the specified id. It is intended for consenting to a request present.