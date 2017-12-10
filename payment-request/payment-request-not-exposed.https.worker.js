// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

importScripts("/resources/testharness.js");

test(function() {
  assert_true(isSecureContext);
  assert_false('PaymentRequest' in self);
}, "PaymentRequest constructor must not be exposed in worker global scope");

done();
