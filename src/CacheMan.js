/*
 *  Copyright 2019 Meetly Inc.
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

import { createCache } from "./Cache";
import { MemoryStorageBackend } from "./MemoryStorageBackend";
import { Checker } from "./Checker";

const DEFAULT_TIMEOUT = 2 * 60 * 1000;

/**
 * The CacheMan library
 */
export class CacheMan {
  /**
   * Creates a new CacheMan instance
   *
   * @typedef {{set: set, get: get}} StorageBackend
   * @param {function} upstream - The upstream data source to fetch from. Should speak Promise.
   * @param {{
   *   timeout: Number?
   *   backend: StorageBackend?
   * }?} options - Options object
   * @return {CacheManClass}
   */
  static create(upstream, options) {
    const opts = options || {};

    let timeoutInMillis = opts.timeout;
    if (!Checker.timeout(timeoutInMillis)) {
      timeoutInMillis = DEFAULT_TIMEOUT;
    }

    let storageBackend = opts.backend;
    if (!Checker.backend(storageBackend)) {
      storageBackend = MemoryStorageBackend.create();
    }

    return createCache(upstream, timeoutInMillis, storageBackend);
  }
}

