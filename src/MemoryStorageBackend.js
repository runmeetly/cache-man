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
   * @returns {Readonly<{set: set, get: get, timeout: Number}>}
   */
  static create(timeout) {
    let storage = null;
    let lastAccessTime = 0;

    timeout = Validator.timeout(timeout);

    return Object.freeze({
      // Time after which cached data is considered expired
      timeout,

      // If we have no cached data, or the cached data we do have is outside of the TTL
      get: function() {
        if (!storage || lastAccessTime + timeout < Date.now()) {
          return null;
        } else {
          return storage;
        }
      },

      // Save cached data into backend
      set: function(data, accessTime) {
        storage = data;
        lastAccessTime = accessTime;
      }
    });
  }
}
