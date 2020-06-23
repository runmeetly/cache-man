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
 * Creates a new CacheMan instance
 *
 * @param {Function} upstream - Upstream resolver function
 * @param {StorageBackend | Array<StorageBackend>} backend - cache StorageBackend implementation or list of implementations
 * @returns {Readonly<{get: (function(...[Array<*>|undefined]): Promise<*>), clear: clear}>}
 */
export function createCache(upstream, backend) {
  /**
   * TODO: Maybe move upstream into a Fetcher class
   */
  upstream = Validator.resolver(upstream);
  backend = Validator.backend(backend);

  // noinspection UnnecessaryLocalVariableJS
  /**
   * NOTE: We keep this here defined as a variable so that each new cache has its own NO_RESULT object
   * instead of all sharing a single NO_RESULT
   * Symbol replacement - no result returned yet.
   * @type {Empty}
   */
  const NO_RESULT = {};

  /**
   * The result of the upstream call.
   */
  let result = NO_RESULT;

  /**
   * Perform a command on the backend - can handle if the backend is a list or just a single implementation
   *
   * @private
   * @param {Function} command - Command to perform
   */
  function withBackend(command) {
    if (Array.isArray(backend)) {
      for (const b of backend) {
        command(b);
      }
    } else {
      command(backend);
    }
  }

  /**
   * Insert data into the backend
   *
   * @private
   * @param {*} data - Data to insert
   * @param {Number} time - Time insertion occurs
   */
  function setBackend(data, time) {
    withBackend(b => b.set(data, time));
  }

  /**
   * Clear data from the backend
   *
   * @private
   */
  function clearBackend() {
    withBackend(b => b.clear());
  }

  /**
   * Fetch from the upstream source - debounce repeated calls.
   *
   * @private
   * @param {Number} accessTime - Time of call
   * @param {Array<*> | undefined} args - Arguments
   * @returns {Promise<*>}
   */
  function fetchUpstream(accessTime, ...args) {
    if (result === NO_RESULT) {
      // Cache the promise object itself so that future calls to this function return the same debounced object
      let promise = upstream.apply(this, ...args);
      if (!promise || !promise.then) {
        promise = Promise.resolve(promise);
      }
      result = promise
        .then(r => {
          // Save result to backend
          setBackend(r, accessTime);

          // Clear cached upstream debounce
          result = NO_RESULT;

          // Continue chain
          return r;
        })
        .catch(err => {
          // Clear backend
          clearBackend();

          // Clear cached upstream debounce
          result = NO_RESULT;

          // Continue error chain
          throw err;
        });
    }

    return result;
  }

  return Object.freeze({
    /**
     * Hits the upstream and uses the caching strategy
     *
     * @param {Array<*> | undefined} args - Arguments
     * @returns {Promise<*>}
     */
    get: function get(...args) {
      const now = Date.now();

      if (Array.isArray(backend)) {
        for (const b of backend) {
          const cached = b.get();
          if (cached !== b.empty) {
            return Promise.resolve(cached);
          }
        }

        return fetchUpstream(now, ...args);
      } else {
        const cached = backend.get();
        if (cached !== backend.empty) {
          return Promise.resolve(cached);
        } else {
          return fetchUpstream(now, ...args);
        }
      }
    },

    /**
     * Delete cached data and start over
     */
    clear: function clear() {
      setBackend(null, 0);
    }
  });
}
