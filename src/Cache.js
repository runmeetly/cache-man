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
 * @private
 * @param {function} upstream - Upstream resolver function
 * @param {Number} timeoutInMillis - cache invalidation time
 * @param {StorageBackend} backend - cache StorageBackend implementation
 * @return {CacheManClass}
 */
export const createCache = (upstream, timeoutInMillis, backend) => {
  const _upstream = Validator.resolver(upstream);
  const _backend = Validator.backend(backend);
  const _timeout = Validator.timeout(timeoutInMillis);
  let _work = null;

  /**
   * Fetches new data from the upstream and caches the result
   *
   * @private
   * @param {Number} accessTime - Time at which the resolver was called
   * @param {Array<*> | undefined} args - Arguments
   * @return {Promise<*>}
   */
  const _newGet = (accessTime, ...args) => {
    let promise;

    // Grab the upstream data
    const potentialPromise = _upstream(...args);
    if (!!potentialPromise.then) {
      // If it has a .then, its a Promise enough for us
      promise = potentialPromise;
    } else {
      // No then, not a promise. Resolve it ourselves into a promise
      promise = Promise.resolve(potentialPromise);
    }

    // Fetch payload from the upstream and deliver the data
    return promise
      .then(result => {
        // Cache the fetch results for the next go around
        _backend.set(result, accessTime);
        return result;
      })
      .catch(error => {
        // Erase cached data in the event that an error occurs
        _backend.set(null, 0);

        // Rethrow to continue the chain
        throw error;
      });
  };

  /**
   * Fetch data from the upstream resolver
   *
   * Begins a new upstream fetch if no current work is happening, else
   * this attaches to the existing work and debounces other requests.
   *
   * @private
   * @param {Number} accessTime - Time at which the resolver was called
   * @param {Array<*> | undefined } args - Arguments
   * @return {Promise<*>}
   */
  const _get = (accessTime, ...args) => {
    if (!_work) {
      _work = _newGet(accessTime, ...args)
        .then(result => {
          _work = null;
          return result;
        })
        .catch(error => {
          _work = null;
          throw error;
        });
    }

    return _work;
  };

  /**
   * CacheMan instance which knows how to retrieve data from a cache and clear stale data.
   */
  class CacheManClass {
    /**
     * Hits the upstream and uses the caching strategy
     *
     * @param {Array<*> | undefined } args - Arguments
     * @return {Promise<*>}
     */
    get = (...args) => {
      return new Promise((resolve, reject) => {
        const now = Date.now();
        const cached = _backend.get(_timeout);
        if (!cached) {
          _get(now, ...args)
            .then(result => resolve(result))
            .catch(error => reject(error));
        } else {
          resolve(cached);
        }
      });
    };

    /**
     * Delete cached data and start over
     */
    clear = () => {
      _backend.set(null, 0);
      _work = null;
    };
  }

  return new CacheManClass();
};
