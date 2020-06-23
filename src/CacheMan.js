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
   * @typedef {{set: (function(*, Number): Promise<*>), get: get, clear: clear, timeout: Number, empty: Empty}} StorageBackend
   * @typedef {{}} Empty
   * @typedef {{get, clear}} Cache
   *
   * @param {Function} upstream - The upstream data source to fetch from. Should speak Promise.
   * @param {{
   *   backend: StorageBackend | Array<StorageBackend> | null | undefined
   * }?} options - Options object
   * @returns {Cache}
   */
  static create(upstream, options) {
    const opts = options || {};

    let storageBackend = opts.backend;
    if (!Checker.backend(storageBackend)) {
      storageBackend = MemoryStorageBackend.create(DEFAULT_TIMEOUT);
    }

    return createCache(upstream, storageBackend);
  }
}
