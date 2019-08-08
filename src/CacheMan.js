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

/**
 * @typedef {{set: set, get: get}} StorageBackend
 * Creates a StorageBackend which holds its data in memory
 *
 * @private
 * @return {StorageBackend | {set: set, get: get}}
 */
const createDefaultStorageBackend = function createDefaultStorageBackend() {
  return MemoryStorageBackend.create();
};

/**
 * The CacheMan library
 */
export class CacheMan {
  /**
   * Creates a new CacheMan instance
   *
   * @param upstream - The upstream data source to fetch from. Should speak Promise.
   * @param timeoutInMillis - Timeout in milliseconds until any data held in the cache is invalidated.
   * @param backend - The StorageBackend that holds the cached data - held in memory by default.
   * @return {CacheManClass}
   */
  static create(upstream, timeoutInMillis = 2 * 60 * 1000, backend = null) {
    let storageBackend = backend;
    if (!storageBackend) {
      // No storage backend was provided, use the default
      storageBackend = createDefaultStorageBackend();
    }

    return createCache(upstream, timeoutInMillis, storageBackend);
  }
}
