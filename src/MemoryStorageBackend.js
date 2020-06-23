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

import { Validator } from "./Validator";

/**
 * A StorageBackend which holds its data in memory and expires after a given timeout
 */
export class MemoryStorageBackend {
  /**
   * Create a new storage backend backend by memory
   *
   * @param {Number} timeout - Timeout in milliseconds before data is considered expired
   * @returns {Readonly<{set: (function(*, Number): Promise<*>), get: get, clear: clear, timeout: Number, empty: Empty}>}
   */
  static create(timeout) {
    timeout = Validator.timeout(timeout);

    // noinspection UnnecessaryLocalVariableJS
    /**
     * NOTE: We keep this here defined as a variable so that each new cache has its own NO_RESULT object
     * instead of all sharing a single NO_RESULT
     * Symbol replacement - no result returned yet.
     * @type {Empty}
     */
    const NO_RESULT = {};

    let storage = NO_RESULT;
    let lastAccessTime = 0;

    return Object.freeze({
      // Time after which cached data is considered expired
      timeout,

      // What this cache considers to be "empty"
      empty: NO_RESULT,

      // If we have no cached data, or the cached data we do have is outside of the TTL
      get: function get() {
        if (storage === NO_RESULT || lastAccessTime + timeout < Date.now()) {
          return NO_RESULT;
        } else {
          return storage;
        }
      },

      // Save cached data into backend
      set: function set(data, accessTime) {
        storage = data;
        lastAccessTime = accessTime;
      },
      clear: function clear() {
        storage = NO_RESULT;
        lastAccessTime = 0;
      }
    });
  }
}
